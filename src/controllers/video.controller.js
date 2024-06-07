import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
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

    const videoCloudinary = await uploadOnCloudinary(videoLocalPath);
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

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
    const { videoId } = req.params
    //TODO: get video by id
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