import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment } from "../controllers/comment.controller.js";

const commentRouter =  Router();

commentRouter.route("/addComment/:videoId").post(verifyJWT,addComment);

export default commentRouter