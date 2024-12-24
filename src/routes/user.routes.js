import express,{Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"

import { assignRole, changePassword, deleteUserAccount, forgotPasswordRequest, getUserProfile, login, logoutUser, refreshAccessToken, resendEmailVerification, resetForgottenPassword, signUp, updateUserAvatar, updateUserProfile, verifyEmail } from "../controllers/user.controller.js";
import  { verifyJWT } from "../middlewares/authentication.middleware.js"
import { validate } from './../validate/validate.js';
import { userAssignRoleValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator, userResetForgottenPasswordValidator } from "../validate/user.validate.js";
import { mongoIdPathVariableValidator } from "../validate/mongodb.validate.js";


const  router = Router();

router.route('/signup').post( upload.single('avatar'),userRegisterValidator(), signUp);  
router.route("/login").post(userLoginValidator(), validate, login);    
router.route("/logout").post(verifyJWT, logoutUser);  

router.get("/verify-email/:token",verifyEmail);    
router.post("/resend-verification", verifyJWT, resendEmailVerification); 

router.post("/refresh-token", refreshAccessToken); 

router.route('/profiles').get(verifyJWT,getUserProfile)  
router.route('/profiles/update').put(verifyJWT,upload.single("avatar"),updateUserProfile)  

router.post("/forgot-password",userForgotPasswordValidator(),validate,forgotPasswordRequest);
router.post("/reset-password/:token",userResetForgottenPasswordValidator(),validate,resetForgottenPassword); 

router.route('/profiles/change-password').post(verifyJWT,userChangeCurrentPasswordValidator(),validate,changePassword)
router.put("/assign-role",verifyJWT,userAssignRoleValidator(),validate,assignRole); 
router.route('/profiles/delete-account').delete(verifyJWT,validate,deleteUserAccount)
router.put("/update-avatar",verifyJWT,upload.single("avatar"),updateUserAvatar);



export default router;