import { sendOTPEmail } from "../config/email";
import bcrypt from "bcryptjs";
import { storeRefreshToken,generateTokenAndSetCookie } from "../utils/token";
import User from "../models/user.model.js";

const otpStore = new Map();

const deleteOTP = (email) => {
  otpStore.delete(email);
  console.log(`✅ OTP deleted for: ${email}`);
};

export const verifyOTP = async ({email,otp}) => {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired or not found' 
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    const userData = storedData.userData;
    userData.emailVerified = true;
    userData.accountStatus = 'active';
    
    const newUser = new User(userData);
    await newUser.save();

    await deleteOTP(email);

    console.log(`✅ User created: ${email}`);

    // 7. Send welcome email (async)
    sendWelcomeEmail(email, username).catch(err => 
      console.error('Welcome email failed:', err)
    );

    // 8. Generate JWT tokens
    await generateTokenAndSetCookie(newUser._id, newUser.email);
    const refreshToken = generateRefreshToken(newUser._id);
    await storeRefreshToken(newUser._id, refreshToken);
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      },
      accessToken,
      refreshToken
    };

  } catch (error) {
    console.error('OTP verification error:', error);
  }
};

export const registermanager = async (userData) => {
  try {
    const { username, email, password, phone } = userData;
    
    const hashpassword = await bcrypt.hash(password, 10);
    const otp = generateOTP(); 
    const expiresAt = Date.now() + 5 * 60 * 1000; 
    otpStore.set(email, {
      otp,
      expiresAt,
      userData: {
        username,
        email,
        password: hashpassword, 
        phone,
        emailVerified: false,
        authMethods: ['email'],
        accountStatus: 'pending'
      }
    });
    
    await sendOTPEmail(email, otp, username);
    
    console.log(`✅ Registration initiated for ${email}`);
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

export const loginManager = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    if (user.accountStatus !== 'active') {
      return {
        success: false,
        message: 'Account is not active. Please verify your email first.'
      };
    }

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

    await generateTokenAndSetCookie(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

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
        accountStatus: user.accountStatus
      },
      accessToken,
      refreshToken
    };

  } catch (error) {
    console.error('Login manager error:', error);
    throw error;
  }
};
