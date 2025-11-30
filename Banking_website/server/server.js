import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";
dotenv.config();

import { conn } from "./config/db.js";
import redis from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import beneficiariesRoutes from "./routes/beneficiary.routes.js";

const app= express();
app.use(express.json());

app.use(cors());
app.use(cookieParser());

app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/account",accountRoutes);
app.use("/api/v1/transaction",transactionRoutes);
app.use("/api/v1/beneficiary",beneficiariesRoutes);

const PORT=process.env.PORT || 5000;
app.listen(PORT,async()=>{
    await redis.ping(); //Without redis.ping():Server starts immediately redis might still be connecting First requests might fail with "Redis not ready" error
    await conn();
    console.log(`server is running on port ${PORT}`)
})