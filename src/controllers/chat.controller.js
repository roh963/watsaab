import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Chat } from '../models/chat.model';
import { ChatEventEnum } from '../../constant';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { removeLocalFile } from './../utils/helpers';
import { emitSocketEvent } from '../socket/socketio';
import { Message } from './../models/message.model';
import { asyncHandler } from '../utils/asyncHandler';

const chatCommonAggregation = () => {
    return [
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "participants",
                as: "participants",
                pipeline: [
                    {
                        $project: {
                            password: 0,
                            refreshToken: 0,
                            forgotPasswordToken: 0,
                            forgotPasswordExpiry: 0,
                            emailVerificationToken: 0,
                            emailVerificationExpiry: 0,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "messages",
                foreignField: "_id",
                localField: "lastMessage",
                as: "lastMessage",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "sender",
                            as: "sender",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        email: 1,
                                    },
                                }
                            ]
                        }
                    },

                    {
                        $addFields: {
                            sender: { $first: "$sender" },
                        },
                    },

                ]
            }
        },
        {
            $addFields: {
                lastMessage: { $first: "$lastMessage" }
            }
        }
    ]
}

const deleteCascadeChatMessages = async (chatId) => {
    try {

        const messages = await ChatMessage.find({
            chat: new mongoose.Types.ObjectId(chatId),
        });

        let attachments = [];


        attachments = attachments.concat(
            ...messages.flatMap((message) => message.attachments || [])
        );

        attachments.forEach((attachment) => {
            if (attachment?.localPath) {
                removeLocalFile(attachment.localPath);
            }
        });

        await ChatMessage.deleteMany({
            chat: new mongoose.Types.ObjectId(chatId),
        });

        console.log(`Chat and messages deleted successfully for chatId: ${chatId}`);
    } catch (error) {
        console.error("Error while deleting chat messages:", error);
        throw new Error("Failed to delete chat messages.");
    }
};

export const searchAvailableUsers = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: {
                    $ne: req.user._id,
                }
            }
        },
        {
            $project: {
                avatar: 1,
                username: 1,
                email: 1
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const createOrGetAOneOnOneChat = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new ApiError(404, "reciver ia not exist in data base ")
    }
    if (receiver._id.toString() === req.user._id.toString()) {
        throw new ApiError(404, "you can't message yourself ");
    }
    const chat = Chat.aggregate([
        {
            $match: {
                isGroupChat: false,
                $and: [
                    {
                        participants: { $elemMatch: { $eq: req.user._id } }
                    },
                    {
                        $elemMatch: { $eq: new mongoose.Types.ObjectId(receiverId) },
                    }
                ]
            }

        },
        ...chatCommonAggregation(),
    ])

    if (chat.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, chat[0], "Chat retrieved successfully"));
    }

    const newChatInstance = await Chat.create({
        name: "One on one chat",
        participants: [req.user._id, new mongoose.Types.ObjectId(receiverId)], // add receiver and logged in user as participants
        admin: req.user._id,
    });
    const createdChat = await Chat.aggregate([
        {
            $match: {
                _id: newChatInstance._id,
            }
        },
        ...chatCommonAggregation()
    ])
    const payload = createdChat[0]
    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }
    payload?.participants?.forEach((participants) => {
        if (participants._id.toString() === req.user._id.toString()) return;
    })
    emitSocketEvent(
        req,
        participant._id?.toString(),
        ChatEventEnum.NEW_CHAT_EVENT,
        payload
    );
    return res
        .status(201)
        .json(new ApiResponse(201, payload, "Chat retrieved successfully"));
});

export const createAGroupChat = asyncHandler(async (req, res) => {
    const { name, participants } = req.body;
    if (participants.includes(req.user._id.toString())) {
        throw new ApiError(
            400,
            "Participants array should not contain the group creator"
        );
    }
    const members = [...new Set([...participants, req.user._id.toString()])];
    if (members.length < 3) {
        throw new ApiError(
            400,
            "Seems like you have passed duplicate participants."
        );
    }
    const groupChat = await Chat.create({
        name,
        isGroupChat: true,
        participants: members,
        admin: req.user._id
    })
    const chat = await Chat.aggregate([
        {
            $match: {
                _id: groupChat._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = chat[0];
    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }
    payload?.participants?.forEach((participant) => {
        if (participant._id.toString() === req.user._id.toString()) return;

        emitSocketEvent(
            req,
            participant._id?.toString(),
            ChatEventEnum.NEW_CHAT_EVENT,
            payload
        );
    });
    return res
        .status(201)
        .json(new ApiResponse(201, payload, "Group chat created successfully"));
})

export const getGroupChatDetails = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const groupChat = await Chat.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(chatId),
                isGroupChat: true,
            },
        },
        ...chatCommonAggregation(),
    ]);
    const chat = groupChat[0]
    if (!chat) {
        throw new ApiError(404, "Group chat does not exist");
    }
    return res.status(200).json(new ApiResponse(200, chat, "Group chat fetched successfully"));
})

export const renameGroupChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { name } = req.body;
    const groupChat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
    });

    if (!groupChat) {
        throw new ApiError(404, "Group chat does not exist");
    }
    if (groupChat.admin?.toString() !== req.user._id?.toString()) {
        throw new ApiError(404, "You are not an admin");
    }
    const updatedGroupchat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $set: {
                name
            },
        },
        { new: true }
    )
    const chat = await Chat.aggregate([
        {
            $match: {
                _id: updatedGroupchat._id,
            },
        },
        ...chatCommonAggregation(),
    ]);
    const payload = chat[0];

    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }
    payload?.participants?.forEach((participant) => {
        emitSocketEvent(req, participant._id?.toString(), ChatEventEnum.UPDATE_GROUP_NAME_EVENT, payload);
    });
    return res.status(200).json(new ApiResponse(200, chat[0], "Group chat name updated successfully"));
})

export const deleteGroupChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const groupChat = await Chat.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(chatId),
                isGroupChat: true,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const chat = groupChat[0];

    if (!chat) {
        throw new ApiError(404, "Group chat does not exist");
    }
    if (chat.admin?.toString() !== req.user._id?.toString()) {
        throw new ApiError(404, "Only admin can delete the group");
    }

    await Chat.findByIdAndDelete(chatId);

    await deleteCascadeChatMessages(chatId);

    chat?.participants?.forEach((participant) => {
        if (participant._id.toString() === req.user._id.toString()) return;
        emitSocketEvent(
            req,
            participant._id?.toString(),
            ChatEventEnum.LEAVE_CHAT_EVENT,
            chat
        );
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Group chat deleted successfully"));
});

export const deleteOneOnOneChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const chat = await Chat.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(chatId),
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = chat[0];

    if (!payload) {
        throw new ApiError(404, "Chat does not exist");
    }

    await Chat.findByIdAndDelete(chatId);

    await deleteCascadeChatMessages(chatId);

    const otherParticipant = payload?.participants?.find(
        (participant) => participant?._id.toString() !== req.user._id.toString()
    );


    emitSocketEvent(
        req,
        otherParticipant._id?.toString(),
        ChatEventEnum.LEAVE_CHAT_EVENT,
        payload
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Chat deleted successfully"));
});


export const leaveGroupChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const groupChat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
    })
    if (!groupChat) throw new ApiError(404, "Group chat does not exist");

    const existingParticipants = groupChat.participants;
    if (!existingParticipants.includes(req.user._id)) {
        throw new ApiError(400, "You are not a part of this group chat");
    }
    const updatedChat = await Chat.findByIdAndUpdate(chatId,
        {
            $pull: {
                participants: req.user?._id
            },
        },
        { new: true }
    );
    const chat = await Chat.aggregate([
        {
            $match: {
                _id: updatedChat._id
            },
        },
        ...chatCommonAggregation(),
    ])
    const payload = chat[0];
    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }
    return res.status(200).json(new ApiResponse(200, payload, "Left a group successfully"));

})


export const addNewParticipantInGroupChat = asyncHandler(async (req, res) => {
    const { chatId, participantId } = req.params;

    const groupChat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
    });

    if (!groupChat) {
        throw new ApiError(404, "Group chat does not exist");
    }

    if (groupChat.admin?.toString() !== req.user._id?.toString()) {
        throw new ApiError(404, "You are not an admin");
    }

    const existingParticipants = groupChat.participants;

    if (existingParticipants?.includes(participantId)) {
        throw new ApiError(409, "Participant already in a group chat");
    }

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {
                participants: participantId,
            },
        },
        { new: true }
    );

    const chat = await Chat.aggregate([
        {
            $match: {
                _id: updatedChat._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = chat[0];

    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }
    emitSocketEvent(req, participantId, ChatEventEnum.NEW_CHAT_EVENT, payload);

    return res.status(200).json(new ApiResponse(200, payload, "Participant added successfully"));
});

export const removeParticipantFromGroupChat = asyncHandler(async (req, res) => {
    const { chatId, participantId } = req.params;

    const groupChat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
    });

    if (!groupChat) {
        throw new ApiError(404, "Group chat does not exist");
    }
    if (groupChat.admin?.toString() !== req.user._id?.toString()) {
        throw new ApiError(404, "You are not an admin");
    }

    const existingParticipants = groupChat.participants;
    if (!existingParticipants?.includes(participantId)) {
        throw new ApiError(400, "Participant does not exist in the group chat");
    }

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: {
                participants: participantId, // remove participant id
            },
        },
        { new: true }
    );

  const chat = await Chat.aggregate([
        {
            $match: {
                _id: updatedChat._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = chat[0];

    if (!payload) {
        throw new ApiError(500, "Internal server error");
    }

    emitSocketEvent(req, participantId, ChatEventEnum.LEAVE_CHAT_EVENT, payload);

    return res.status(200).json(new ApiResponse(200, payload, "Participant removed successfully"));
});

export const getAllChats = asyncHandler(async (req, res) => {
    const chats = await Chat.aggregate([
        {
            $match: {
                participants: { $elemMatch: { $eq: req.user._id } }, 
            },
        },
        {
            $sort: {
                updatedAt: -1,
            },
        },
        ...chatCommonAggregation(),
    ]);

    return res.status(200).json(new ApiResponse(200, chats || [], "User chats fetched successfully!"));
});