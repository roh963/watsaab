
import { bcrypt } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiResponse } from "../utils/ApiResponse"
import { uploadOnCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";
import { fs } from 'fs';
import { User } from '../models/user.model';

export const signUp = async (req, res) => {
   try {
      //request the client
      const { username, email, phoneNumber, password } = req.body;
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

      //hash the password
      const hashPassword = await bcrypt.hash(password, 10);


      //upload the image
      const cloudinaryres = await uploadOnCloudinary(req.file.path);
      if (!cloudinaryres) {
         return res.status(500).json(new ApiResponse(500, null, "image are send proper"))
      }
      const newUser = new User({
         username: username.toLowercase(),
         email,
         phoneNumber,
         password: hashPassword,
         avatar: cloudinaryres.secure_url
      })
      const createduser = await User.findById(User._id).select("-password ")

      if (!createduser) {
         return res.status(400).json(new ApiResponse(400, null, " something is wrong in create in user"))
      }
      res.status(200).json(new ApiResponse(200, createduser, " user are register succesfully"))
      newUser.save();
   } catch (error) {
      res.status(500).json(new ApiResponse(500, null, "error on creating user"));
   }
}


export const login = async (req, res) => {
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

      const isPasswordValid = await user.isPasswordCorrect(password)
      if (!isPasswordValid) {
         return res.status(400).json(new ApiResponse(404, null, "password not correct"))
      }
      const token = user.generateAccessToken();
      if (!token) {
         return res.status(400).json(new ApiResponse(404, null, "token not generate"))
      }
      res.status(200).json(new ApiResponse(200, token, " user are login succesfully"))

   } catch (error) {
      res.status(500).json(new ApiResponse(500, null, "error on logging user"));
   }
}

export const getUserProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
         return res.status(400).json(new ApiResponse(400, null, "user not found check it again in data base"));

      }
      return res.status(200).json(new ApiResponse(200, user, "user are successfully get"))

   } catch (error) {
      return res.status(500).json(new ApiResponse(400, error, "error in fetching in user"));
   }
}

export const updateUserProfile = async (req, res) => {
   try {

      const userId = req.user._id;
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
      }
      fs.unlinkSync(req.file.path);
      const updateUser = await User.findByIdAndUpdate(userId,
         { $set: updatedata }
         , {
            new: true, runValidators: true
         }).select("-password ")

      if (!updateUser) {
         return res.status(400).json(new ApiResponse(400, null, "user is not found in update !...."));
      }
      return res.status(200).json(new ApiResponse(200, updateUser, "user successfully update !...."));
   } catch (error) {
      return res.status(500).json(new ApiResponse(500, error, "Error in update  found !...."));
   }
}

export const changePassword = async (req, res) => {
   try {
      const {currentPassword , newPassword} = req.body;
      const userId= req.user._id;
      const user = await User.findById(userId)

      if(! user)   return res.status(400).json(new ApiResponse(400, null, "user not found !...."));

      const isMatch = await bcrypt.compare(currentPassword,user.password);
      if(!isMatch)  return res.status(500).json(new ApiResponse(500, null, "incorrect current password  try again!...."));
      
      if (currentPassword === newPassword) {
         return res.status(500).json(new ApiResponse(500, null, "current password and new password same try again!...."));
      }
      const hashPassword = await bcrypt.hash(newPassword,10)
      user.password = hashPassword
       await user.save();
   } catch (error) {
      return res.status(500).json(new ApiResponse(500, error, "something went wrong in change password...."));
   }
}
export const deleteUserAccount = async (req, res) => {
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
};