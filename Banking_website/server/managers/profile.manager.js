import User from "../models/users.js";
import Account from "../models/account.js";
import mongoose from "mongoose";
import { uploadToS3, deleteFromS3 } from "../config/s3.js";

export const getProfileDataManager = async (userId) => {
  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Fetch user and accounts in parallel (faster!)
    const [user, accounts] = await Promise.all([
      User.findById(userId).select('-password'),
      Account.find({ 
        userId: userId,
        status: { $ne: 'closed' }
      })
    ]);

    // Check if user exists
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Format and return data
    return {
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        authMethods: user.authMethods,
        createdAt: user.createdAt
      },
      
      accounts: accounts.map(acc => ({
        accountId: acc._id,
        accountNumber: acc.accountNumber,
        maskedAccountNumber: '****' + acc.accountNumber.slice(-4),
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        status: acc.status,
        interestRate: acc.interestRate,
        openedDate: acc.openedDate,
        lastTransactionDate: acc.lastTransactionDate
      })),
      
      summary: {
        totalAccounts: accounts.length,
        totalBalance: totalBalance,
        activeAccounts: accounts.filter(a => a.status === 'active').length,
        savingsAccounts: accounts.filter(a => a.accountType === 'savings').length,
        currentAccounts: accounts.filter(a => a.accountType === 'current').length
      }
    };

  } catch (error) {
    console.error('❌ Manager - Get Profile Data Error:', error);
    throw error;
  }
};

export const updateProfileDataManager = async (userId, userData,  file) => {
    
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    const results = {
      user: null,
      profilePicture: null
    };

    if (userData && Object.keys(userData).length > 0) {
      const allowedFields = ['firstName', 'lastName', 'phone'];
      const updates = {};

      for (const field of allowedFields) {
        if (userData[field] !== undefined) {
          if (field === 'phone') {
            const phoneNum = Number(userData[field]);
            if (isNaN(phoneNum) || phoneNum < 1000000000 || phoneNum > 9999999999) {
              throw new Error('Phone number must be 10 digits');
            }
            updates[field] = phoneNum;
          }
          else if (field === 'firstName' || field === 'lastName') {
            if (!userData[field] || userData[field].trim().length < 2) {
              throw new Error(`${field} must be at least 2 characters`);
            }
            updates[field] = userData[field].trim();
        }
          else {
            updates[field] = userData[field];
          }
        }
      }

      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: updates },
          { 
            new: true, 
            session,
            runValidators: true,
            select: '-password'
          }
        );

        if (!updatedUser) {
          throw new Error('User not found');
        }

        results.user = {
          status: 'success',
          message: 'Profile updated successfully',
          data: {
            userId: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            updatedAt: updatedUser.updatedAt
          }
        };
      }
    }

    if (file) {
      try {
        const currentUser = await User.findById(userId).session(session);
        const oldProfilePic = currentUser.profilePic;

        const timestamp = Date.now();
        const fileExtension = file.originalname.split('.').pop();
        const s3Key = `profiles/${userId}/${timestamp}.${fileExtension}`;

        // Upload to S3
        const fileUrl = await uploadToS3({
          key: s3Key,
          body: file.buffer,
          contentType: file.mimetype
        });

        await User.findByIdAndUpdate(
          userId,
          { 
            $set: { 
              profilePic: fileUrl,
              updatedAt: new Date()
            }
          },
          { session }
        );

        // Delete old profile pic from S3 (if exists)
        if (oldProfilePic && oldProfilePic.includes('s3')) {
          try {
            const oldKey = oldProfilePic.split('.com/')[1];
            await deleteFromS3(oldKey);
          } catch (deleteError) {
            console.warn('Failed to delete old profile pic:', deleteError.message);
          }
        }

        results.profilePicture = {
          status: 'success',
          message: 'Profile picture uploaded successfully',
          oldUrl: oldProfilePic,
          newUrl: fileUrl
        };

      } catch (uploadError) {
        console.error(' Profile picture upload failed:', uploadError);
        results.profilePicture = {
          status: 'failed',
          error: uploadError.message
        };
      }
    }
    await session.commitTransaction();

    const totalOperations = 
      (results.user ? 1 : 0) +
      (results.profilePicture ? 1 : 0) 
    return {
      summary: {
        totalOperations,
        successful: totalOperations,
      },
      results
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Update Profile Data Error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};