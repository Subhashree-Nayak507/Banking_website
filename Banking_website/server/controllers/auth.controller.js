import User from "../models/user.model.js";
import { loginManager, registermanager, verifyOTP } from "../manager/auth.manager.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    
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

    const result = await registermanager({ username, email, password, phone }); 
    
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
    const responseData= verifyOTP({email,otp});
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
    res.clearCookie('accessToken');
    await deleteRefreshToken(req,user.id);
    return res.status(200).json({
      "message":"Logout successfully"
    })
  }catch(error){
      console.error('Registration error:', error);
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
    const result = await loginManager({email,password});
    return res.status(200).json(result);
  }catch(error){
      console.error('Login error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });

    }
};