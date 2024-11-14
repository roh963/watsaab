import express, { Router } from "express"

import verifyJwt from "../middlewares/athorized.middleware.js"
import { addNewParticipantInGroupChat, createAGroupChat, createOrGetAOneOnOneChat, deleteGroupChat, deleteOneOnOneChat, getAllChats, getGroupChatDetails, leaveGroupChat, removeParticipantFromGroupChat, renameGroupChat, searchAvailableUsers } from "../controllers/chat.controller";
import { mongoIdPathVariableValidator } from "../validate/mongodb.validate.js";
import { validate } from "../validate/validate.js";
import { createAGroupChatValidator, updateGroupChatNameValidator } from "../validate/chat.validate.js";


const router = Router();
router.use(verifyJwt);

router.route("/").get(getAllChats)
router.route("/user").get(searchAvailableUsers)

router.route("/c/:receiverId").post(mongoIdPathVariableValidator("receiverId"), validate, createOrGetAOneOnOneChat)

router.route("/group").post(createAGroupChatValidator(), validate, createAGroupChat)
router.route("/group/:chatId")
    .get(mongoIdPathVariableValidator("chatId"), validate, getGroupChatDetails)
    .patch(mongoIdPathVariableValidator("chatId"), updateGroupChatNameValidator(), validate, renameGroupChat)
    .delete(mongoIdPathVariableValidator("chatId"), validate, deleteGroupChat)
router
    .route("/group/:chatId/:participantId")

    .post(mongoIdPathVariableValidator("chatId"), mongoIdPathVariableValidator("participantId"), validate, addNewParticipantInGroupChat)

    .delete(
        mongoIdPathVariableValidator("chatId"), mongoIdPathVariableValidator("participantId"), validate,
        removeParticipantFromGroupChat);

router
    .route("/leave/group/:chatId")
    .delete(mongoIdPathVariableValidator("chatId"), validate, leaveGroupChat);
router
    .route("/remove/:chatId")
    .delete(mongoIdPathVariableValidator("chatId"), validate, deleteOneOnOneChat);

    
export default router;