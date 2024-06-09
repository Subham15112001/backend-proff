import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadonCloudinary ,deleteCloudinary} from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';
import mongoose,{isValidObjectId} from "mongoose";
import { ObjectId } from "mongodb";
const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        
        // get user by id
        const user = await  User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken; // insert refreshtoken

        await user.save({ validateBeforeSave : false}); // validateBeforeSave : false , important or else all info will ve needed in current user 

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"something went wrong when creating new refresh token and access token")
    }
}

//------------------
const registerUser = asyncHandler(async (req,res,next) => {
    //get user data fron front end
    //validate the data
    //check if user already exist : username and email
    //check images and avatar
    //upload them in cloudinary 
    //create a user object and upload it in db
    //remove password and refresh token from response 
    //check for user creation
    //return res

    const {fullname,username,email,password} = req.body;


    if([fullname,username,email].some((value) => value.trim() === "" )){
        throw new ApiError(400,"all field are neccessary")
    }

    const existedUser = await User.findOne({
        $or:[
            {username:username},
            {email:email}
        ]
    })
 
    if(existedUser){
        throw new ApiError(409,"User with email and name already exist")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)
 
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage.url,
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register successfully")
    )
})

//--------------------
const loginUser = asyncHandler(async (req,res,next) => {
    // req body -> user data
    // username or email
    // find the usename or email from db
    // password check
    //access token and refresh token 
    // send cookie

    const {email,username,password} = req.body;

    if(!email && !username){
        throw new ApiError(400,"send username or email")
    }

    const user = await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }
   
    const isPasswordValid =  await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404,"password is incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(user._id);

    const loginUser = await User.findById(user._id).select("-password -refreshToken");
    
    // so cookines to frontend cant be modified
    const option = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
               .cookie("accessToken",accessToken,option)
               .cookie("refreshToken",refreshToken,option)
               .json(new ApiResponse(200,{
                user:loginUser,
                accessToken,
                refreshToken
               },
               "user login successfully"
            ))
})

//-------------------------
const logoutUser = asyncHandler(async (req,res,next) => {
    await User.findByIdAndUpdate(
        {_id:req.user._id},
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
              .clearCookie("accessToken",option)
              .clearCookie("refreshToken",option)
              .json(new ApiResponse(200,{},"user successfully logout"))
})

// ---------------------------------
const refreshAccessToken = asyncHandler( async (req,res,next) => {
   try {
    const incomingRefreshToken = req?.cookie?.refreshToken || req.body?.refreshToken;
 
     if(!incomingRefreshToken){
         throw new ApiError(401,"Unauthorised request")
     }
 
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id);
 
     if(!user){
         throw new ApiError(401,"invalid refresh token")
     }
     
     if(incomingRefreshToken !== user.refreshToken){
         throw new ApiError(401,"refresh token is expire")
     }
 
     const {refreshToken,accessToken} = await generateAccessTokenandRefreshToken(user._id);
   
     const option = {
         htmlOnly : true,
         secure: true
     }
 
     return res.status(200)
               .cookie("refreshToken",refreshToken,option)
               .cookie("accessToken",accessToken,option)
               .json(new ApiResponse(200,{accessToken,refreshToken},"accessToken and refreshToken send successfully"))
   } catch (error) {
    throw new ApiError(401,error?.message || " invalid refresh token")
   }
})

// ---------------------------------------
const changeCurrentPassword = asyncHandler(async (req,res,next) => {

    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid oldPassword")
    }
    
    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200)
              .json(new ApiResponse(200,{},"successfully updated password"))
})

//---------------------------------------------
const getCurrentUser = asyncHandler(async (req,res,next) => {
    return res.status(200)
              .json(new ApiResponse(200,req.user,"current user fetched"))
})

// --------------------------------------------------
const updateAccoutDetails = asyncHandler(async (req,res,next) => {
    const {fullname,email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400,"all field are required")
    }
    //console.log(fullname,email)
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    return res.status(200)
              .json(new ApiResponse(200,user,"account details change successfully"))
})

// ------------------------------------------------------
const updateAvatar = asyncHandler( async (req,res,next) => {

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"error while uploading on cloudinary")
    }
    // todo delete old image on 
    const oldAvatarPath = req?.user?.avatar;

    await deleteCloudinary(oldAvatarPath)

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200)
              .json(new ApiResponse(200,user,"updated successfully"))
})

// -----------------------------------------------------------
const updateCoverImage = asyncHandler(async (req,res,next) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const coverImage = await uploadonCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading on cloudinary")
    }
    const oldCoverImagePath = req?.user?.coverImage;

    await deleteCloudinary(oldCoverImagePath)
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200)
              .json(new ApiResponse(200,user,"updated successfully"))
})

// -----------------------------------------------------------
const getUserChannelProfile = (asyncHandler((req,res,next) => {

    const {username} = req.params;

    if(!username.trim()){
         throw new ApiError(400,"username is missing")
    }

    const channel = User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subcribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subcribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{ $in:[ req.user._id , "$subscribers.subscriber" ] },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullname:1,
                email:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res.status(200)
              .json(new ApiResponse(200,channel[0],"user channel fetched"))
}))

const getWatchHistory = asyncHandler (async (req,res) => {

    const user = await User.aggregate([
        {
            $match : {
                _id :  ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup : {
                            from : "users",
                            localField: "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username: 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
              .json(new ApiResponse(200 , user[0].watchHistory , "watch history fetch successfully" ))
})


export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccoutDetails,
        updateAvatar,
        updateCoverImage,
        getUserChannelProfile,
        getWatchHistory
    }
