import { deleteOTP, generateOTP, sendOTPEmail, sendWelcomeEmail } from "../config/email.js";
import bcrypt from "bcryptjs";
import { storeRefreshToken,generateTokenAndSetCookie, generateRefreshToken, getRefreshToken, deleteRefreshToken } from "../utils/token.js";
import User from "../models/users.js";

export const otpStore = new Map();

export const registermanager = async (userData) => {
  try {
    const { username, email, password, phone,fullname } = userData;
    const nameParts = fullname.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    const hashpassword = await bcrypt.hash(password, 10);
    const otp = generateOTP(); 
    const expiresAt = Date.now() + 5 * 60 * 1000; 
    otpStore.set(email, {
      otp,
      expiresAt,
      userData: {
        firstName,
        lastName,
        username,
        email,
        password: hashpassword, 
        phone,
        emailVerified: false,
        authMethods: ['email'],
        isActive: 'false'
      }
    });
    
    await sendOTPEmail(email, otp, username);
    
    console.log(`Registration initiated for ${email}`);
    return {
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
      expiresIn: '10 minutes'
    };

  } catch (error) {
    console.error('Registration manager error:', error);
    throw new Error('Failed to process registration');
  }
};

export const verifyOTP = async ({email,otp,res}) => {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return{ 
        success: false, 
        message: 'OTP expired or not found' 
      };
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return { 
        success: false, 
        message: 'OTP has expired' 
      };
    }

    if (storedData.otp !== otp) {
      return { 
        success: false, 
        message: 'Invalid OTP' 
      };
    }

    const userData = storedData.userData;
    userData.emailVerified = true;
    userData.isActive = 'true';
    
    const newUser = new User(userData);
    await newUser.save();

    await deleteOTP(email);

    console.log(` User created: ${email}`);
    sendWelcomeEmail(email, userData.username).catch(err => 
      console.error('Welcome email failed:', err)
    );

    await generateTokenAndSetCookie(newUser._id,res);

    const refreshToken = generateRefreshToken(newUser._id);
    await storeRefreshToken(newUser._id, refreshToken);
    console.log("refresh token setup successfully");
    
    return {
      success: true,
      message: 'Registration successful',
      user: {
       // id: newUser._id,
        username: newUser.username,
        email: newUser.email
      },
    };

  } catch (error) {
    console.error('OTP verification error:', error);
    throw new Error('Failed to process registration');
  }
};

export const loginManager = async ({ email, password ,res}) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    };

    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Please verify your email before logging in'
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    await generateTokenAndSetCookie(user._id, res);
    const refreshToken = generateRefreshToken(user._id);
    await storeRefreshToken(user._id, refreshToken);

    user.isActive="true";
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User logged in successfully: ${email}`);

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive
      }
    };

  } catch (error) {
    console.error('Login manager error:', error);
    throw error;
  }
};

export const refreshManger = async(token,res)=>{
  try{
    const userId= token.userId;
    if(!userId){
      return {
        message:"unauthorized"
      }
    };
     const storedRefreshToken = await getRefreshToken(userId);
    if (!storedRefreshToken) {
      return {
        success: false,
        message: 'Refresh token not found. Please login again.',
        code: 'REFRESH_TOKEN_NOT_FOUND'
      };
    };
    let refreshDecoded;
    try {
    const  refreshDecoded = jwt.verify(
        storedRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch (error) {
      await deleteRefreshToken(userId);
      return {
        success: false,
        message: 'Refresh token expired. Please login again.',
        code: 'REFRESH_TOKEN_EXPIRED'
      };
    }
    if (refreshDecoded.userId !== userId) {
      return {
        success: false,
        message: 'Token mismatch'
      };
    };

    await generateTokenAndSetCookie(newUser._id,res);
    await deleteRefreshToken(userId);
    console.log('previous token delted');
    const refreshToken = generateRefreshToken(newUser._id);
    await storeRefreshToken(newUser._id, refreshToken);

   console.log(`✅ Tokens refreshed for user: ${userId}`);

    return {
      success: true,
      message: 'Access token refreshed successfully'
    };
  }catch (error) {
    console.error('refresh manager error:', error);
    throw error;
  }
}
