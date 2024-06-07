import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    // http://localhost:8000/api/v1/comments/:videoId?page=1&limit=10

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const comment = req.body?.comment;
    const userId = req.user?._id;
    const videoId = req.params?.videoId;

    // check for proper info
    if(!comment || !userId || !videoId){
        throw new ApiError(400,"error in inputs comment , id or videoid")
    }
    
    const responseOfInsert = await Comment.create({
        owner : userId,
        video : videoId,
        content : content
    })

    if(!responseOfInsert){
        throw new ApiError(500,"error in creating comment")
    }

    return res.status(201)
              .ApiResponse(201,responseOfInsert,"created comment successfully")
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }