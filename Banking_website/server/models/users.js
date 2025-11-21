import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{ 
        type:String,
        required:function(){
            return !this.googleId;
        },

    },
    email:{
        type:String,
        required:true,
        unique:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Please provide a valid email"]
    },
    phone:{
        type:Number,
        unique:true
    },
    profilePic:{
        type: String,
        default:""
    },
    authMethods:{
        type: [String],
        default:[],
        enum: ["email", "google"]
    },
    emailVerified:{
        type: Boolean,
        default: false
    },
    googleId:{
        type: String,
        default: null
    },
    isActive:{
        type: Boolean,
        default: true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
}, {
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
});

userSchema.virtual('fullname').get(function() {
    return `${this.firstName} ${this.lastName}`;
});


const User = mongoose.model("User", userSchema); 
export default User;