import cookie from "cookie";
import jwt from "jsonwebtoken"
import { Server, Socket } from "socket.io"
import { User } from './../models/user.model';
import { Chat } from "../models/chat.model";
import { AvailableChatEvents, ChatEventEnum } from './../../constant';
import { ApiError } from './../utils/ApiError';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../../config";


const mountJoinChatEvent = (socket) => {
    socket.on(ChatEventEnum.JOIN_CHAT_EVENT, async (chatId) => {
        try {
            console.log(`User joined chart room : ${chatId}`);
            const chat = await Chat.findById(chatId)
            if (!chat) {
                socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, "chat is not found");
                return;
            }
            socket.join(chatId)
            console.log(`User joined chat room: ${chatId}`);
        } catch (error) {
            socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, error.message || "Failed to join chat room");
        }
    })
}

const mountTypingEvent = (socket) => {
    socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, {
            chatId,
            userId: socket.user._id,
            username: socket.user.username,
        })
    })
}
const mountStopTypingEvent = (socket) => {
    socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
        socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, {
            chatId,
            userId: socket.user._id,
            username: socket.user.username,
        })
    })
}

const initializSocketIO = (io) => {
    io.on("connection", async (socket) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
            let token = cookie?.accessToken || socket.handshake.auth?.token;
            if (!token) {
                throw new ApiError(401, "Unauthorized: Token missing");
            }
            const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (!user) {
                throw new ApiError(401, "Unauthorized: Invalid token");
            }
            socket.user = user;
            socket.join(user._id.toString());

            socket.emit(ChatEventEnum.CONNECTED_EVENT);
            console.log(`User connected: ${user._id}`);

            mountJoinChatEvent(socket);
            mountStopTypingEvent(socket);
            mountTypingEvent(socket);

            socket.on(ChatEventEnum.SEND_MESSAGE_EVENT, async (messageData) => {
                const { chatId, content } = messageData;
                try {
                    const newMessage = {
                        sender: user._id,
                        content,
                        chat: chatId
                    }
                    const chatRoom = await Chat.findById(chatId);
                    if (!chatRoom) {
                        throw new ApiError(404, "Chat room not found");
                    }
                    chatRoom.lastMessage = content;
                    await chatRoom.save()
                    io.in(chatId).emit(ChatEventEnum.NEW_CHAT_EVENT, newMessage);
                } catch (error) {
                    socket.emit(ChatEventEnum.DISCONNECT_EVENT, () => {
                        console.log(`User disconnected: ${user._id}`);
                        socket.leave(user._id.toString());
                    })
                }
            })
        } catch (error) {
            socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, error.message || "Socket connection error");
        }
    })
}

const emitSocketEvent = (req,roomId,event,payload)=>{
    req.app.get("io").in(roomId).emit(event,payload);
}
export {initializSocketIO, emitSocketEvent}