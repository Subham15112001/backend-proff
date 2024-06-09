import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { Subscription } from "../models/subscription.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, 
    if(sortType == asc){
        sortType = 1;
    }else{
        sortType = -1;
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id")
    }

    const getResponse = await Video.aggregate([
        {
            $search : {
                index:"search-videos",
                text : {
                    query:`${query}`,
                    path : ["title","description"]
                }
            },
            $match : {
                owner : ObjectId(userId) 
            },
            $sort : {
                [sortBy] : sortType
            },
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerVideos",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1,
                            fullname : 1,
                            videoFile : 1,
                            thumbnail : 1
                        }
                    }
                ]
            },           
        },    
        {
            $unwind : "$ownerVideos"
        },    
    ])

    if(!getResponse){
        throw new ApiError(500,"failed to get videos")
    }

    return res.status(200)
              .json(new ApiResponse(200,getResponse,"got all videos successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400,"video file is missing")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail file is missing")
    }


    const user = req.user;

    const videoCloudinary = await uploadonCloudinary(videoLocalPath);
    const thumbnailCloudinary = await uploadonCloudinary(thumbnailLocalPath);

    if(!videoCloudinaryPath || !thumbnailCloudinaryPath){
        throw new ApiError(400,"error in uploading files in cloudinary")
    }

    const uploadResponse = await Video.create({
        videoFile : videoCloudinary.url,
        thumbnail : thumbnailCloudinary.url,
        title : title,
        description : description,
        duration : videoCloudinary.duration,
        views : 0,
        isPublished : true,
        owner : user._id
    })

    if(!uploadResponse){
        throw new ApiError(400,"upload fail please try again")
    }

    return res.status(200)
              .json( new ApiResponse(200,uploadResponse,"video and thumbnail uploaded"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user;
    //TODO: get video by id
    if(!isValidObjectId(videoId) || !isValidObjectId(user._id)){
        throw new ApiError(400,"invalid video id")
    }

  
    // match video by id
    // use loopup to get all the likes of the video and count the likes 
    // use loopup to get all the owner of the video then add a pipeline to
    // lookup on subscription schema to all subscriber
    // create field username , issubscripted

    const video = await Video.aggregate([
        {
            $match : {
                _id : ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : " _id ",
                as : "ownerDetails",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "channel",
                            foreignField : "owner",
                            as : "subscribers"
                        },
                        $addFields : {
                            subscriberCount : {
                                $size : "$subscribers"
                            },
                        }
                    }
                ]
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likesDetails",
                pipeline : [
                    {
                        $addFields: {
                            $likesCount: {
                                $size: "$likesDetails"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                ownerDetails : "$ownerDetails" ,
                likesDetails : "$likesDetails"
            }
        },
        {
            $project : {
                ownerDetails : 1,
                likesDetails : 1,
                username : 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                videoFile : 1,

            }
        }
    ])

    if(!video){
        throw new ApiError(500,"error in fetching video by id")
    }

    return res.status(200)
              .json(new ApiResponse(200,video,"video fetch successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}