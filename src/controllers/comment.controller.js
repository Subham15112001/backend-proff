import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    // http://localhost:8000/api/v1/comments/:videoId?page=1&limit=10

    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is invalid")
    }
    // $project: {
    //     content: 1,
    //     createdAt: 1,
    //     likesCount: 1,
    //     owner: {
    //         username: 1,
    //         fullName: 1,
    //         "avatar.url": 1
    //     },
    //     isLiked: 1
    // }
    const fetchComments = await Comment.aggregate([
        {
            $match:{
                video : Object(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails"
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "likeDetails",
                pipeline : [
                    {
                        $addFields : {
                            likeCount : {
                                $size : "$likeDetails"
                            },
                            ownerDetails : {
                                $first : "$ownerDetails"
                            },
                            isLiked : {
                                $cond : {
                                    $if : {
                                        $in : [req?.user?._id,"$likeDetails.likedBy"]
                                    },
                                    then : true,
                                    else : false
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $project : {
                content : 1,
                createdAt : 1,
                ownerDetails : {
                    username : 1,
                    fullname : 1,
                    email : 1,
                    avatar : 1
                },
                likeCount : 1,
                isLiked : 1,
            }
        }
    ])

    const option = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comment = await Comment.aggregatePaginate(
        fetchComments,
        option
    )

    if(!comment){
        throw new ApiError(500,"unable to fetch comments")
    }

    return res.status(200)
              .json(new ApiResponse(200,comment,"comments fetch successfully"))
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
    const {commentId} = req.params;
    const {content} = req.body;
    const userId = req?.user?._id;

    if(!isValidObjectId(commentId) || !isValidObjectId(userId)){
        throw new ApiError(400,"invalid id")
    }

    const oldComment = await Comment.findById(commentId);

    if(!oldComment){
        throw new ApiError(500,"error in fetching old comment")
    }

    if(userId.toString() !== oldComment.owner?.toString()){
        throw new ApiError(400,"you are not the owner")
    }

    const newComment = await Comment.findByIdAndUpdate(commentId,
        {
            "content" : content
        },
        {
            new:true
        }
    )

    if(!newComment){
        throw new ApiError(500,"error in updating comment")
    }

    return res.status(200)
              .json(new ApiResponse(200,newComment,"comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    const userId = req.user?._id;

    const comment = await Comment.findById(commentId);

    if(comment.owner?.toString() !== userId){
        throw new ApiError(400,"user is not the owner")
    }

    const deleteResponse = await Comment.findByIdAndDelete(commentId);

    if(!deleteResponse){
        throw new ApiError(500,"error in deleting comment")
    }

    const deleteLikes = await Like.deleteMany({
        comment : commentId
    })

    if(!deleteLikes){
        throw new ApiError(500,"unable to delete likes")
    }
    return res.status(200)
              .json(new ApiResponse(500,deleteResponse,"deleted comment and associated likes successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }