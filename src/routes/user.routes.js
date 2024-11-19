import express,{Router} from "express"
import {upload} from "../middlewares/multer.middleware"
import verifyJwt from "../middlewares/athorized.middleware.js"
import { assignRole, changePassword, deleteUserAccount, forgotPasswordRequest, getUserProfile, login, logoutUser, resendEmailVerification, resetForgottenPassword, signUp, updateUserAvatar, updateUserProfile, verifyEmail } from "../controllers/user.controller";
import authenticationUser from "../middlewares/authentication.middleware"
import { validate } from './../validate/validate';
import { userAssignRoleValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, userRegisterValidator, userResetForgottenPasswordValidator } from "../validate/user.validate";
import { mongoIdPathVariableValidator } from "../validate/mongodb.validate.js";


const  router = Router();

router.route('/signup').post(upload.single('avatar'),userRegisterValidator(), validate, signUp);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/logout").post(verifyJwt, logoutUser);

router.get("/verify-email/:token",mongoIdPathVariableValidator,validate,verifyEmail);
router.post("/resend-verification", verifyJwt, resendEmailVerification);

router.post("/refresh-token", refreshAccessToken);

router.route('/profiles').get(verifyJwt,authenticationUser,getUserProfile)
router.route('/profiles/update').put(authenticationUser,upload.single("avatar"),updateUserProfile)

router.post("/forgot-password",userForgotPasswordValidator,validate,forgotPasswordRequest);
router.post("/reset-password/:token",userResetForgottenPasswordValidator,validate,resetForgottenPassword); 

router.route('/profiles/change-password').post(verifyJwt,userChangeCurrentPasswordValidator,validate,authenticationUser,changePassword)
router.put("/assign-role",verifyJwt,userAssignRoleValidator,validate,assignRole); 
router.route('/profiles/delete-account').delete(verifyJwt,validate,deleteUserAccount)
router.put("/update-avatar",verifyJwt,upload.single("avatar"),updateUserAvatar);



export default router;