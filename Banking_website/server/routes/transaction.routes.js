import express from "express";
import { protectRoute } from "../middlewares/auth.js";
import { createTransactionController, getAllTransactionsController,  getTransactionByIdController } from "../controllers/transaction.controller.js";

const router= express.Router();

router.post("/create",protectRoute,createTransactionController);
router.get("/all",protectRoute,getAllTransactionsController);
router.get("/:id/all",protectRoute,getTransactionByIdController);

export default router;