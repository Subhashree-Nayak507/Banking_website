import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    passwosrd:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Please provide a valid email"]
    },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    profilePic:{
        default:""
    },
    authMethods:
       ["email", "google"],
    isemailVerified:false,
    googleId:null,
    twofactorenabled:false,
    isActive:true,
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
});

const user = mongoose.model("User",userSchema);
export default User;