import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    
    sender:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    receiver:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required:true,
        trim:true
    },
    attachments:{
        type:[{
            url:String,
            localPath:String
        }],
        default:[],
    },
    status:{
        type:String ,
        enum:["sent","delivered"],
        default:"sent"
    },
    chat:{
        type:Schema.Types.ObjectId,
        ref:"Chat"
    },
},{
    timestamps:true
})

export const Message = mongoose.model("Message",messageSchema);