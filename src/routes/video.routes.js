import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
const videoRouter = Router();

videoRouter.route("/")
    .post(verifyJWT, upload.fields(
        [
            {
                name: "video",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]
    ), publishAVideo)
    .get(verifyJWT, getAllVideos);

videoRouter.route("/v/:videoId").get(verifyJWT,getVideoById)
                                .patch(verifyJWT,upload.single("thumbnail"),updateVideo)
                                .delete(verifyJWT,deleteVideo)

                                
videoRouter.route("/toggle/v/:videoId").patch(verifyJWT,togglePublishStatus)                                
export default videoRouter;