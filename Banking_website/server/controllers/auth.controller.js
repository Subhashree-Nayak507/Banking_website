import User from "../models/users.js";
import { loginManager, registermanager, verifyOTP, requestOTPForExistingUser,
  verifyOTPForExistingUser,googleAuthManager  } from "../managers/auth.manager.js";
import jwt from "jsonwebtoken";
import { deleteRefreshToken } from "../utils/token.js";
import { googleClient } from "../config/google.js";

export const register = async (req, res) => {
  try {
    const {fullname, username, email, password, phone } = req.body;
    
    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    const result = await registermanager({ username, email, password, phone,fullname }); 
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

export const verifyotp= async(req,res)=>{
  try{
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    const responseData= await verifyOTP({email,otp,res});
     return res.status(200).json(responseData);


    }catch(error){
      console.error('Registration error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
    }
};

export const logout= async(req,res)=>{
  try{
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token found. Already logged out.'
      });
    };

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if(!decoded || !decoded.userId){
      return res.status(401).json({
        success:false,
        message:"invalid token"
      })
    };

    const userId = decoded.userId;
     const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'Invalid user'
      };
    }
      
      res.clearCookie('jwt');
      console.log("cookie cleared");

      await deleteRefreshToken(userId);
      console.log("refresh token delted");

    user.isActive = false; 
    await user.save();
    console.log("User status updated to inactive");
    
    return res.status(200).json({
      "message":"Logout successfully"
    })
  }catch(error){
      console.error('logout error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });

    }
};

export const login = async(req,res)=>{
  try{
    const {email,password} = req.body;
    if(!email || !password){
      return res.status(400).json({
        message:"all fields are requireed"
      })
    };
    const result = await loginManager({email,password,res});
    return res.status(200).json(result);
  }catch(error){
      console.error('Login error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
    }
};

export const refreshToken = async(req,res)=>{
  try{
    const token = req.cookies.token;
    if(!token){
      return res.status(401).json({
        message:"token not found"
      })
    };

    const response= await refreshManger({token,res});
    return res.status(200).json(response)
  }catch(error){
      console.error('Login error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during refreshing token'
    });
    }
};

export const initiateGoogleAuth = async (req, res) => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      scope: [
        'email',
        'profile'
      ]
    });
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate Google authentication'
    });
  }
};

export const googleAuthCallback= async(req,res)=>{
  try{
    const { code } = req.query;
    if(!code){
      return res.status(400).json({
        message:"no code provided"
      })
    };

    const { tokens} = await googleClient.getToken(code);

     const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleUserData = {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || 'User',
      lastName: payload.family_name || '',
      profilePic: payload.picture || ''
    };

    const result = await googleAuthManager({
      ...googleUserData,
      res
    });
    return res.status(200).json(result);
  }catch (error) {
    console.error('Google callback error:', error);
    
    return res.status(500).json({
      messgae:"google auth failed"
    })
  }
};

export const requestOTPLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    };
    const result = await requestOTPForExistingUser({ email });
    return res.status(200).json(result);
  } catch (error) {
    console.error('OTP request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while requesting OTP'
    });
  }
};

export const verifyOTPLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const result = await verifyOTPForExistingUser({ email, otp, res });
    return res.status(200).json(result);

  } catch (error) {
    console.error('OTP login verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};
