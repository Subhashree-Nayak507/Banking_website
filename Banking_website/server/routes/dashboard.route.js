import express from "express";
import { protectRoute } from "../middlewares/auth.js";
import { dashboard } from "../controllers/dashboard.controller.js"

const router= express.Router();

router.get("/stats",protectRoute,dashboard);


export default router;