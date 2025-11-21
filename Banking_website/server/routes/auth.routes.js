import express from "express";
import { googleAuthCallback, initiateGoogleAuth, login, logout, refreshToken, register, requestOTPLogin, verifyotp, verifyOTPLogin }
 from "../controllers/auth.controller.js";

const router= express.Router();

router.post("/register",register);
router.post("/verify-otp",verifyotp);
router.post("/login",login);
router.post("/logout",logout);
router.post("/refresh-token",refreshToken);
router.get("/auth/google", initiateGoogleAuth);         
router.get("/auth/google/callback", googleAuthCallback);
router.post("/auth/relogin/otp",requestOTPLogin);
router.post("/auth/relogin/verify",verifyOTPLogin);

export default router;