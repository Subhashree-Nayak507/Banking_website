import express from "express";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import { conn } from "./config/db.js";
import redis from "./config/redis.js";

const app= express();

app.use(cors());


const PORT=process.env.PORT || 3000;
app.listen(PORT,async()=>{
    await redis.ping(); //Without redis.ping():Server starts immediately redis might still be connecting First requests might fail with "Redis not ready" error
    await conn();
    console.log(`server is running on port ${PORT}`)
})