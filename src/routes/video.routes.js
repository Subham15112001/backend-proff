import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { publishAVideo } from "../controllers/video.controller.js";
const videoRouter = Router();

videoRouter.route("/publish-video").post(verifyJWT,upload.fields(
    [
        {
            name : "video",
            maxCount : 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]
),publishAVideo)

export default videoRouter;