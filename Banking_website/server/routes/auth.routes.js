import express from "express";
import { login, logout, refreshToken, register, verifyotp } from "../controllers/auth.controller.js";

const router= express.Router();

router.post("/register",register);
router.post("/verify-otp",verifyotp);
router.post("/login",login);
router.post("/logout",logout);
router.post("/refresh-token",refreshToken);

export default router;