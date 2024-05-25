import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        
        // get user by id
        const user = await  User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken; // insert refreshtoken

        await user.save({ validateBeforeSave : false}); // validateBeforeSave : false important or else in current user 

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"something went wrong when creating new refresh token and access token")
    }
}
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

    const user = User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid =  await user.isCorrectPassword(password);

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
export {registerUser,loginUser}