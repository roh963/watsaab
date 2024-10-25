import mongoose,{Schema} from "mongoose";
import jwt  from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:[true,"user name will be required"],
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:[true,"email will be required"],
        unique:true,
        lowercase:true,
        trim:true
    },
    phoneNumber:{
        type:String,
        required:[true,"number will be required"],
        trim:true,
        index:true,
    }, 
    status: {
        type: String,
        default: "Hey there! I am using WhatsApp.",
        trim: true,
      },
    avatar:{
        type:String,
        default:null
    },
    contacts:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }]
    ,
    blockedContacts:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    password:{
        type:String,
        required:true
    },
    refreshToken:{
        String:true
    }
},{
 timestamps:true
});

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next()
})
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            phoneNumber:this.phoneNumber,
            username:this.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_SECRET_EX
        }
    );
}
 
const User = mongoose.model("User",userSchema)