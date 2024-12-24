import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET } from "../../config.js";
import { AvailableUserRoles, UserRolesEnum } from "../../constant.js";



const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "user name will be required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "email will be required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phoneNumber: {
        type: String,
        required: [true, "number will be required"],
        trim: true,
        index: true,
        match: [/^\d{10}$/, 'Please provide a valid phone number']

    },
    status: {
        type: String,
        default: "Hey there! I am using WhatsApp.",
        trim: true,
    },
    avatar: {
       type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://via.placeholder.com/200x200.png`,
        localPath: "",
      },
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.USER,
      required: true,
    },
    refreshToken: {
        type: String,
        default:null
    },
    contacts: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
    ,
    blockedContacts: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    password: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    forgetPasswordToken: {
        type: String,
        default: null
    },
    forgetPasswordExpiry: {
        type: Date,
        default: null
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    console.log("Plain password during signup:", this.password);
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Hashed password during signup:", this.password);

    next()
})
userSchema.methods.isPasswordCorrect= async function (password) {
    console.log("Plain password:", password);
    console.log("Hashed password from DB:", this.password);
    const isValid= await bcrypt.compare(password, this.password)
    console.log("Password valid:", isValid);
    return isValid
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            phoneNumber: this.phoneNumber,
            email: this.email,
            username: this.username
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    );
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY}
    );
};


userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")
    const tokenExpiry = Date.now() + 20 * 60 * 1000;
    return { unHashedToken, hashedToken, tokenExpiry }
}
userSchema.post("save", async function (user, next) {
    if (!user.isEmailVerified) {
      console.log(`User ${user.username} created, but email is not verified.`);
    }
    next();
  });
export const User = mongoose.model("User", userSchema)