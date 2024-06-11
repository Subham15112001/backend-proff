import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const user = req.user;
    if(!isValidObjectId(videoId) || !isValidObjectId(!user._id)){
       throw new ApiError(400,"invalid video id or user id")
    }

    const getVideoLike = await Like.findOne({
      video : videoId,
      likedBy : user._id
    })

    if(getVideoLike){
        
        const deleteLike = await Like.findByIdAndDelete({_id : getVideoLike?._id})
        
        if(!deleteLike){
            throw new ApiError(500,"error when deleting like")
        }
        return res.status(200)
                  .json(new ApiResponse(200,deleteLike,"like toggle successfully"))
    }

    const createLike = await Like.create({
        video : videoId,
        likedBy : user?._id
    })

    if(!createLike){
        throw new ApiError(500,"failed to create like")
    }

    return res.status(200)
              .json(new ApiResponse(200,createLike,"like created successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    const likeExist = await Like.findOne({
        $and : [
            {
                comment :commentId
            },
            {
                likedBy : req.user?._id
            }
        ]
    })

    if(likeExist){
        const like = await Like.findOneAndDelete(
            {
                $and : [
                    {
                        comment :commentId
                    },
                    {
                        likedBy : req.user?._id
                    }
                ]
            }
        )

        if(!like){
            throw new ApiError(500,"unable to delete like")
        }

        return res.status(200)
                  .json(new ApiResponse(200,like,"like deleted successfully"))
    }

    const createLike = await Like.create({
        comment : commentId,
        likedBy : req.user?._id
    })
    
    if(!createLike){
        throw new ApiError(500,"unable to create like try again")
    }

    return res.status(200)
              .json(new ApiResponse(200,createLike,"liked created successfully"))
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}