import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccoutDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter =  Router();

userRouter.post('/register',
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

userRouter.post('/login',loginUser)

userRouter.post('/logout',verifyJWT, logoutUser)

userRouter.post('/refresh-token',refreshAccessToken)

userRouter.route('/change-password').post(verifyJWT,changeCurrentPassword)

userRouter.route("/current-user").get(verifyJWT,getCurrentUser)

userRouter.route("/update-account").patch(verifyJWT,updateAccoutDetails)

userRouter.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

userRouter.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

userRouter.route("/c/:username").get(verifyJWT,getUserChannelProfile)

userRouter.route("/history").get(verifyJWT,getWatchHistory)
export default userRouter