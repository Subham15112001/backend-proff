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
   

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }


    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { tweetId, isLiked: false }));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // this give a list of videos like by user

    const aggerationResponse = await Like.aggregate([
        {
            $match :  ObjectId(req.user?._id)
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "likeVideoDetails",
                pipeline : [
                    {
                        $lookup: {
                            from: "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "ownerDetails"
                        }
                    },
                    {
                        $unwind : "ownerDetails"
                    },
                ]
            }
        },
        {
            $unwind : "likeVideoDetails"
        },
        {
            $project : {
                _id : 0,
                likeVideoDetails : {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                },
                ownerDetails : {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                }
            }
        }
    ])

    if(!aggerationResponse){
        throw new ApiError(500,"unable to fetch like videos")
    }

    return res.status(200)
              .json(new ApiResponse(200,aggerationResponse,"fetch like videos successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}