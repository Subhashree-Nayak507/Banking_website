import jwt from 'jsonwebtoken';
import { REFRESH_TOKEN_PREFIX, REFRESH_TOKEN_EXPIRY } from '../config/constants.js';


export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "2d",
	});

	res.cookie("jwt", token, {
		maxAge: 1 * 24 * 60 * 60 * 1000, 
		httpOnly: true, 
		sameSite: "strict", 
		secure: process.env.NODE_ENV !== "development",
	});
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

export const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
    
    // Store token with automatic expiry (SETEX command)
    await redis.setex(key, REFRESH_TOKEN_EXPIRY, refreshToken);
    console.log(`✅ Refresh token stored in Redis for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error storing refresh token in Redis:', error);
    throw new Error('Failed to store refresh token');
  }
};

export const getRefreshToken = async (userId) => {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
    const token = await redis.get(key);
    
    if (token) {
      console.log(`✅ Refresh token retrieved for user: ${userId}`);
    } else {
      console.log(`⚠️  No refresh token found for user: ${userId}`);
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error retrieving refresh token from Redis:', error);
    throw new Error('Failed to retrieve refresh token');
  }
};

export const deleteRefreshToken = async (userId) => {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
    await redis.del(key);
    
    console.log(`✅ Refresh token deleted for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting refresh token from Redis:', error);
    throw new Error('Failed to delete refresh token');
  }
};
