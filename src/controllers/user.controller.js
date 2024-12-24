
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import fs from 'fs';
import { User } from '../models/user.model.js';
import { getLocalPath, getStaticFilePath, removeLocalFile } from './../utils/helpers.js';
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from '../utils/mail.js';
import { NODE_ENV, REFRESH_TOKEN_SECRET, FORGOT_PASSWORD_REDIRECT_URL } from '../../config.js';
import cookie from 'cookie';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../logger/winston.logger.js';
import  crypto  from 'crypto';
import { ApiError } from './../utils/ApiError.js';


const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId);

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;

      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating the access token");
   }
}
export const signUp = async (req, res) => {
   try {

      const { username, email, phoneNumber, password, role = 'user' } = req.body;
      console.log(username, email, phoneNumber, password, role);
      
      if ([username, email, phoneNumber, password].some((field) => field?.trim() === "")) {
         return res.status(400).json(new ApiResponse(400, null, "all field are required"))
      }
      //user find
      const existingUser = await User.findOne({
         $or: [{ email }, { username }, { phoneNumber }]
      });
      // already exit
      if (existingUser) {
         return res.status(409).json(new ApiResponse(409, null, "user already exist"))
      }


      

      logger.info("Uploaded File:", req.files);
      const avatarLocalPath = req.files?.avatar[0]?.path;
      logger.info("Avatar File Path:", avatarLocalPath);
      
      let avatarUrl = ""
      if(avatarLocalPath){
         const clouDinary= await uploadOnCloudinary(avatarLocalPath);
         if (!clouDinary) {
            return res.status(500).json(new ApiResponse(500, null, "Image upload failed, please try again"));
         }
         logger.info("Cloudinary Response:",clouDinary);
         avatarUrl=clouDinary;
      }  
  
    
      const newUser = new User({
         username: username.toLowerCase(),
         email,
         phoneNumber,
         password,
         avatar:avatarUrl.url||'',
         isEmailVerified: false,
         role: role 
      })


      const { unHashedToken, hashedToken, tokenExpiry } = newUser.generateTemporaryToken();
      if (!unHashedToken || !hashedToken || !tokenExpiry) {
            logger.error("error on generating tempory token",unHashedToken, hashedToken, tokenExpiry);
      }
      newUser.emailVerificationToken = hashedToken;
      newUser.emailVerificationExpiry= tokenExpiry;
      

      await newUser.save({ validateBeforeSave: false });

      await sendEmail({
         email: newUser?.email,
         subject: "Please verify your email",
         mailgenContent: emailVerificationMailgenContent(
            newUser.username,
            `${req.protocol}://${req.get("host")}/api/users/verify-email/${unHashedToken}`
         ),
      });
        
      const createduser = await User.findById(newUser._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

      if (!createduser) {
         return res.status(400).json(new ApiResponse(400, null, " something is wrong in create in user"))
      }
      res.status(200).json(new ApiResponse(200, {newUser:createduser}, " user are register succesfully"))

   } catch (error) {
      logger.error(`Error in signUp: ${error.message}`);
      res.status(500).json(new ApiResponse(500, error, "error on creating user"));
   }
};

export const login = asyncHandler(async (req, res) => {
   try {

      const { email, password, phoneNumber } = req.body
      if (!email && !phoneNumber) {
         return res.status(400).json(new ApiResponse(400, null, "email or phone number field are required"))
      }
      const user = await User.findOne({
         $or: [{ email }, { phoneNumber }]
      })

      if (!user) {
         return res.status(400).json(new ApiResponse(404, null, "user not find please sigin up if are not register"))
      }

      const isPasswordValid = await user.isPasswordCorrect(password.trim())
      if (!isPasswordValid) {
         return res.status(400).json(new ApiResponse(404, null, "password not correct"))
      }


      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


      const loggedInUser = await User.findById(user._id).select(
         "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      const options = {
         httpOnly: true,
         secure: NODE_ENV === "production",
         sameSite: "Strict",
         maxAge: 24 * 60 * 60 * 1000, // 1 day
      };

      res.status(200).cookie("accessToken", accessToken).cookie("refreshToken", refreshToken).json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, " user are login succesfully"))

   } catch (error) {
      res.status(500).json(new ApiResponse(500, null, "error on logging user"));
   }
});

export const logoutUser = asyncHandler(async (req, res) => {
   const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: '',
         },
      },
      { new: true }
   );

   if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
   }

   const options = {
      httpOnly: true,
      secure: NODE_ENV === "production",
   };
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out"));

})

export const getUserProfile = asyncHandler(async (req, res) => {
   try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
         return res.status(400).json(new ApiResponse(400, null, "user not found check it again in data base"));

      }
      return res.status(200).json(new ApiResponse(200, user, "user are successfully get"))

   } catch (error) {
      return res.status(500).json(new ApiResponse(400, error, "error in fetching in user"));
   }
})

export const updateUserProfile = asyncHandler(async (req, res) => {
   try {
      console.log(req.user);
      const userId = req.user._id;
      console.log(req.user._id);
      if (!userId) {
         return res.status(400).json(new ApiResponse(400, null, "user id not found !...."));
      }
      const { username, email, phoneNumber, password, status } = req.body;
      const updatedata = {}

      if (email) updatedata.email = email
      if (phoneNumber) updatedata.phoneNumber = phoneNumber
      if (username) updatedata.username = username
      if (status) updatedata.status = status


      if (req.file) {
         const cloudinaryResponse = await uploadOnCloudinary(req.file.path)
         if (cloudinaryResponse) {
            updatedata.avatar = cloudinaryResponse.secure_url;
         }
         fs.unlink(req.file.path);
      }
     
      const updateUser = await User.findByIdAndUpdate(userId,
         { $set: updatedata }
         , {
            new: true, runValidators: true
         }).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

      if (!updateUser) {
         return res.status(400).json(new ApiResponse(400, null, "user is not found in update !...."));
      }
      return res.status(200).json(new ApiResponse(200, updateUser, "user successfully update !...."));
   } catch (error) {
      return res.status(500).json(new ApiResponse(500, error, "Error in update  found !...."));
   }
});

export const changePassword = asyncHandler(async (req, res) => {
   try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;
      const user = await User.findById(userId)

      if (!user) return res.status(400).json(new ApiResponse(400, null, "user not found !...."));

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(500).json(new ApiResponse(500, null, "incorrect current password  try again!...."));

      if (currentPassword === newPassword) {
         return res.status(500).json(new ApiResponse(500, null, "current password and new password same try again!...."));
      }
      const hashPassword = await bcrypt.hash(newPassword, 10)
      user.password = hashPassword
      await user.save();
   } catch (error) {
      return res.status(500).json(new ApiResponse(500, error, "something went wrong in change password...."));
   }
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
   try {
      const userId = req.user._id;
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
         return res.status(404).json(new ApiResponse(404, null, "User not found"));
      }

      res.status(200).json(new ApiResponse(200, null, "User account deleted successfully"));
   } catch (error) {
      res.status(500).json(new ApiResponse(500, error, "Error deleting user account"));
   }
});
export const assignRole = asyncHandler(async (req, res) => {
   const { userId } = req.params;
   const { role } = req.body;
   const user = await User.findById(userId);

   if (!user) {
      throw new ApiError(404, "User does not exist");
   }
   user.role = role;
   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Role changed for the user"));
});
export const updateUserAvatar = asyncHandler(async (req, res) => {
   if (!req.file?.filename) {
      throw new ApiError(400, "Avatar image is required");
   }

   const avatarUrl = getStaticFilePath(req, req.file?.filename);
   const avatarLocalPath = getLocalPath(req.file?.filename);

   const user = await User.findById(req.user._id);

   let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            avatar: {
               url: avatarUrl,
               localPath: avatarLocalPath,
            },
         },
      },
      { new: true }
   ).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
   );

   removeLocalFile(user.avatar.localPath);

   return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

export const verifyEmail = async (req, res) => {
   const { token } = req.params;
   console.log("Token from params:", req.params.token);
   if (!token) {
      throw new ApiError(400, "Email verification token is missing");
   }
   let hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

   const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
   });

   if (!user) {
      throw new ApiError(489, "Token is invalid or expired");
   }

   user.emailVerificationToken = undefined;
   user.emailVerificationExpiry = undefined;
   user.isEmailVerified = true;
   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
};

export const resendEmailVerification = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user?._id);

   if (!user) {
      throw new ApiError(404, "User does not exists", []);
   }

   if (user.isEmailVerified) {
      throw new ApiError(409, "Email is already verified!");
   }

   const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken(); // generate email verification creds

   user.emailVerificationToken = hashedToken;
   user.emailVerificationExpiry = tokenExpiry;
   await user.save({ validateBeforeSave: false });

   await sendEmail({
      email: user?.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
         user.username,
         `${req.protocol}://${req.get(
            "host"
         )}/api/v1/users/verify-email/${unHashedToken}`
      ),
   });
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"));
});


export const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
   }

   try {
      const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id);
      if (!user) {
         throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or used");
      }
      const options = {
         httpOnly: true,
         secure: NODE_ENV === "production",
      };

      const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

      return res.status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
   } catch (error) {
      console.error("Error in Refresh Token: ", error.message);
      throw new ApiError(401, error?.message || "Invalid refresh token");
   }
});




export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  try {
   
   const { email } = req.body;

   const user = await User.findOne({ email });

   if (!user) {
      throw new ApiError(404, "User does not exists", []);
   }
   const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();


   user.forgetPasswordToken = hashedToken;
   user.forgetPasswordExpiry = tokenExpiry;
   await user.save({ validateBeforeSave: false });

   await sendEmail({
      email: user?.email,
      subject: "Password reset request",
      mailgenContent: forgotPasswordMailgenContent(
         user.username,
         `${FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
      ),
   });
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {},
            "Password reset mail has been sent on your mail id"
         )
      );
  } catch (error) {
   throw new ApiError(401, error?.message || " mail not send proper");
  }
});


export const resetForgottenPassword = asyncHandler(async (req, res) => {
   const { resetToken } = req.params;
   const { newPassword } = req.body;

   let hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");


   const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
   });

   if (!user) {
      throw new ApiError(489, "Token is invalid or expired");
   }

   user.forgetPasswordToken = undefined;
   user.forgetPasswordExpiry = undefined;

   user.password = newPassword;
   await user.save({ validateBeforeSave: false });
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
});


