import express from "express";
import { protectRoute } from "../middlewares/auth.js";
import { createAccountController, getAllAccountController, getSpecificAccountController } from "../controllers/account.controller.js";

const router= express.Router();

router.get("/all",protectRoute,getAllAccountController);
router.get("/:id/specific",protectRoute,getSpecificAccountController);
router.post("/create",protectRoute,createAccountController);

export default router;