import express,{Router} from "express"
import verifyJwt from "../middlewares/athorized.middleware.js"
import { mongoIdPathVariableValidator } from "../validate/mongodb.validate.js";
import { validate } from "../validate/validate.js";
import { deleteMessage, getAllMessages, sendMessage } from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { sendMessageValidator } from "../validate/message.validate.js";


const  router = Router();

router.route("/chatId")
      .get(mongoIdPathVariableValidator("chatId"),validate,getAllMessages)
      .post(upload.fields([{ name: "attachments", maxCount: 5 }]),mongoIdPathVariableValidator("chatId"),sendMessageValidator(),validate,sendMessage);

router.route("/:chatId/:messageId").delete(mongoIdPathVariableValidator("chatId"),mongoIdPathVariableValidator("messageId"),validate,deleteMessage);



export default router;