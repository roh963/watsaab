import { Mongoose, mongoose } from 'mongoose';
import { ApiError } from './../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ChatEventEnum } from './../../constant';
import { Chat } from './../models/chat.model';
import { Message } from './../models/message.model';
import { emitSocketEvent } from '../socket/socketio';
import { getLocalPath, getStaticFilePath, removeLocalFile } from '../utils/helpers';


const chatMessageCommonAggregation = () => {
    retunr[
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "senderDetails"
            }
        }, {
            $unwind: "$senderDetails"
        }, {
            $project: {
                "senderDetails.password": 0,
                "senderDetails.refreshToken": 0
            }
        }
    ]
}


export const getAllMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const selectedChat = await Chat.findById(chatId);

    if (!selectedChat) throw new ApiError(404, "Chat does not exist");

    if (!selectedChat.participants.includes(req.user._id)) throw new ApiError(403, "Unauthorized access");

    const message = await Message.aggregate([
        { $match: { chat: new mongoose.Types.ObjectId(chatId) } },
        ...chatMessageCommonAggregation(),
        { $sort: { createdAt: -1 } },
    ])

    res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
})

export const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content && req.files?.attachments?.length) {
        throw new ApiError(400, "Message content or attachment is required");
    }
    const selectedChat = await Chat.findById(chatId);
    if (!selectedChat) throw new ApiError(404, "Chat does not exist");

    const attachments = req.files?.attachments?.map((file) => ({
        url: getStaticFilePath(req, file.filename),
        localPath: getLocalPath(file.filename),
    })) || [];
    const message = await Message.create({
        sender: req.user._id,
        content: content || "",
        chat: chatId,
        attachments
    })
    const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $set: {
                lastMessage: message._id,
            },
        },
        { new: true }
    );

    const messages = await ChatMessage.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(message._id) } },
        ...chatMessageCommonAggregation(),
    ]);
    const receivedMessage = messages[0];
    if (!receivedMessage) throw new ApiError(500, "Failed to fetch the message");


    (selectedChat || chat).participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
            emitSocketEvent(
                req,
                participantId.toString(),
                ChatEventEnum.MESSAGE_RECEIVED_EVENT,
                receivedMessage
            );
        }
    });
    return res.status(201).json(new ApiResponse(201, receivedMessage, "Message saved successfully"));

})

export const deleteMessage = asyncHandler(async (req, res) => {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user._id
    })
    if (!chat) throw new ApiError(404, "chat not found");

    const message = await Message.findOne({
        _id: new mongoose.ObjectId.Types(messageId)
    })

    if (!message) throw new ApiError(404, "message not found");

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "not authorized to delete this message")
    }
    if (message.attachments.length) {
        message.attachments.forEach((attachment) => removeLocalFile(attachment.localPath))
    }
    await Message.deleteOne({ _id: messageId });
    if (chat.lastMessage.toString() == messageId) {
        const lastMessage = await Message.findOne({ chat: chatId }, {}, { sort: { createdAt: -1 } });
        await Chat.findByIdAndUpdate(chatId, { lastMessage: lastMessage?._id });
    }
    chat.participants.forEach((participantId) => {
        if (participantId.toString() === req.user._id.toString()) return;
        emitSocketEvent(
            req,
            participantId.toString,
            ChatEventEnum.MESSAGE_DELETE_EVENT,
            messageId
        );
    });
    return res.status(200).json(new ApiResponse(200, message, "Message deleted successfully"));
})
