import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteCloudinary, uploadonCloudinary} from "../utils/cloudinary.js"
import { Subscription } from "../models/subscription.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"


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
    
    // search for text , written in query
    // lookup with user to get details of owner
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

    const option = {
        page : parseInt(page,10),
        limit : parseInt(limit,10) // base 10
    }

    const video = await  Video.aggregatePaginate(getResponse,option);

    return res.status(200)
              .json(new ApiResponse(200,video,"got all videos successfully"))
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
    const {title,description} = req.body;
    const user = req.user;

    
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"video not found")
    }

    if(user?._id.toString() !== video.owner.toString()){
        throw new ApiError(400,"you are not the owner of the video")
    }

    if(!title || !description ){
        throw new ApiError(400,"title , thumbnail and description all are required")
    }

    const thumbnailLocalFilePath = req.files?.path;
    const oldThumbnailUrl = video.thumbnail;

    if(!thumbnailLocalFilePath){
        throw new ApiError(400,"thumbnail file is required")
    }

    const thumbnailCloudinaryUrl = await uploadonCloudinary(thumbnailLocalFilePath);

    if(!thumbnailCloudinaryUrl){
        throw new ApiError(500,"uploading in cloudinary fail , tru again")
    }

    const videoUpdate = await Video.findByIdAndUpdate(videoId,
        {
            $set : {
                thumbnail : thumbnailCloudinaryUrl.url,
                description,
                title
            }
        },
        {
            new : true
        }
    )
    
    if(!videoUpdate){
        throw new ApiError(500,"failed to update")
    }

    if(videoUpdate){
        await deleteCloudinary(oldThumbnailUrl)
    }

    return res.status(200)
              .json(new ApiResponse(200,videoUpdate,"video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id invalid")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(500,"error in fetching video data")
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"the current user is not the owner")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId);
    const deleteComment = await Comment.deleteMany({video : videoId});
    const deleteLike = await Like.deleteMany({video : videoId});

    if(deleteVideo){
        await deleteCloudinary(video.videoFile)
        await deleteCloudinary(video.thumbnail)
    }else{
        throw new ApiError(500,"error in deleting video")
    }

    return res.status(200)
              .json(new ApiResponse(200,{deleteComment,deleteLike,deleteVideo},"video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }
    const video = Video.findById(videoId)

    if(!video){
        throw new ApiError(500,"error in fetching video details")
    }

    const updateResponse = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: (!video.isPublished)
            }
        },
        {
            new: true
        }
    )

    if(!updateResponse){
        throw new ApiError(500,"unable to toggle isPublished")
    }

    return res.status(200)
              .json(new ApiResponse(200,updateResponse,"toggle isPublished successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}