import mongoose from "mongoose";

export const conn= async()=>{
    try{
        const conn= await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected: ${conn.connection.host}`)

    }catch(error){
        console.error('Database connection error:',error);
    }
}