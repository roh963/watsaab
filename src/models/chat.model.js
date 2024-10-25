import mongoose, {Schema} from "mongoose";

const chatSchema = new Schema ({
    name:{
        type:String,
        required: function () {
            return this.isGroupChat;
        }
    },
    isGroupChat:{
        type:Boolean,
        default:false
    },
    lastMessage:{
        type:Schema.Types.ObjectId,
        ref:"Chat"
    },
    
     participants:[
        { type:Schema.Types.ObjectId,
            ref:"User"

        }
     ],
     admin:{
        type:Schema.Types.ObjectId,
        ref:"User"
     },
    
},{timestamps:true})

const Chat = mongoose.model("Chat",chatSchema)