import User from "../models/users.js";
import Account from "../models/account.js";
import Transaction from "../models/transaction.js";
import mongoose from "mongoose";

export const dashboardManager = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      'firstName lastName username email phone profilePic emailVerified'
    );
    if (!user) {
      throw new Error('User not found');
    }

    const accounts = await Account.find({ 
      userId: userId,
      status: { $ne: 'closed' }
    }).select(
      'accountNumber accountType balance currency status openedDate lastTransactionDate'
    );

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + account.balance;
    }, 0);

    const accountsData = accounts.map(account => ({
      accountId: account._id,
      accountType: account.accountType,
      accountNumber: '****' + account.accountNumber.slice(-4),
      balance: account.balance,
      currency: account.currency,
      status: account.status,
      openedDate: account.openedDate,
      lastTransactionDate: account.lastTransactionDate
    }));

    const recentTransactions = await Transaction.find({
      $or: [
        { senderUserId: userId },
        { receiverUserId: userId }
      ]
    })
    .sort({ createdAt: -1 }) 
    .limit(5)
    .populate('senderUserId', 'firstName lastName username') 
    .populate('receiverUserId', 'firstName lastName username')
    .populate('senderAccountId', 'accountNumber accountType')
    .populate('receiverAccountId', 'accountNumber accountType');

    const transactionsData = recentTransactions.map(txn => {
      const isSender = txn.senderUserId?._id.toString() === userId.toString();
      return {
        transactionId: txn._id,
        type: txn.type,
        amount: isSender ? -txn.amount : txn.amount, 
        displayAmount: txn.amount, 
        direction: isSender ? 'sent' : 'received',
        otherParty: isSender 
          ? (txn.receiverUserId?.fullname || txn.receiverUserId?.username || 'Unknown')
          : (txn.senderUserId?.fullname || txn.senderUserId?.username || 'Unknown'),
        otherPartyUsername: isSender 
          ? txn.receiverUserId?.username 
          : txn.senderUserId?.username,
        accountNumber: isSender
          ? '****' + txn.senderAccountId?.accountNumber?.slice(-4)
          : '****' + txn.receiverAccountId?.accountNumber?.slice(-4),
        status: txn.status,
        description: txn.description || 'No description',
        referenceNumber: txn.referenceNumber,
        timestamp: txn.createdAt,
        currency: txn.currency
      };
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthStats = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { senderUserId: userId },
            { receiverUserId: userId }
          ],
          createdAt: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd
          },
          status: 'completed'
        }
      },
      {
        $addFields: {
          isSender: {
            $eq: ['$senderUserId',new mongoose.Types.ObjectId(userId)]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: {
            $sum: {
              $cond: ['$isSender', '$amount', 0]
            }
          },
          totalReceived: {
            $sum: {
              $cond: [{ $not: '$isSender' }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    const monthData = currentMonthStats[0] || {
      totalSpent: 0,
      totalReceived: 0,
      transactionCount: 0
    };

    const quickStats = {
      spent: monthData.totalSpent,
      received: monthData.totalReceived,
      savings: monthData.totalReceived - monthData.totalSpent,
      transactionCount: monthData.transactionCount
    };
    return {
      user: {
        userId: user._id,
        name: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePic || null,
        emailVerified: user.emailVerified
      },
      accounts: accountsData,
      totalBalance,
      recentTransactions: transactionsData,
      quickStats
    };

  } catch (error) {
    throw error;
  }
};