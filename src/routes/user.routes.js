import express,{Router} from "express"
import {upload} from "../middlewares/multer.middleware"
import { changePassword, deleteUserAccount, getUserProfile, login, signUp, updateUserProfile } from "../controllers/user.controller";
import authenticationUser from "../middlewares/authentication.middleware"

const  router = Router();

router.post('/signup',upload.single('avatar'),signUp)
router.post('/login',login)
// router.get('/profile',)
router.route('/profiles').get(authenticationUser,getUserProfile)
router.route('/profiles/update').put(authenticationUser,upload.single("avatar"),updateUserProfile)
router.route('/profiles/change-password').post(authenticationUser,changePassword)
router.route('/profiles/deleteaccount').delete(authenticationUser,deleteUserAccount)



export default router;