import mongoose from "mongoose";
import Account from "../models/account.js";
import Transaction from "../models/transaction.js";

export async function createTransaction({
  type,
  amount,
  senderAccountId,
  receiverAccountId,
  description,
  referenceNumber ,userId 
}) {

  const existingTransaction = await Transaction.findOne({ referenceNumber });
  if (existingTransaction) {
    return {
      success: true,
      message: 'Transaction already processed',
      data: existingTransaction,
      isIdempotent: true
    };
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let result;
    switch (type) {
      case 'transfer':
        result = await executeTransfer({
          senderAccountId,
          receiverAccountId,
          amount,
          description,
          userId,
          referenceNumber,  
          session
        });
        break;
        
      case 'deposit':
        result = await executeDeposit({
          receiverAccountId,
          amount,
          description,
          userId,
          referenceNumber,  
          session
        });
        break;
        
      case 'withdraw':
        result = await executeWithdraw({
          senderAccountId,
          amount,
          description,
          userId,
          referenceNumber,  
          session
        });
        break; 
      default:
        throw new Error('Invalid transaction type');
    }

    await session.commitTransaction();
    
    return {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} completed successfully`,
      data: result
    };
    
  } catch (error) {
    await session.abortTransaction();
  
    throw {
      success: false,
      message: error.message || 'Transaction failed',
      error: error.code || 'TRANSACTION_FAILED'
    };
    
  } finally {
    session.endSession();
  }
}

async function executeTransfer({
  senderAccountId,
  receiverAccountId,
  amount,
  description,
  userId,
  referenceNumber,  
  session
}) {

  const senderAccount = await Account.findById(senderAccountId).session(session);
  const receiverAccount = await Account.findById(receiverAccountId).session(session);

  if (!senderAccount) {
    const error = new Error('Sender account not found');
    error.code = 'SENDER_NOT_FOUND';
    throw error;
  }

  if (senderAccount.userId.toString() !== userId.toString()) {
    const error = new Error('You do not have permission to transfer from this account');
    error.code = 'UNAUTHORIZED_SENDER';
    throw error;
  }
  if (!receiverAccount) {
    const error = new Error('Receiver account not found');
    error.code = 'RECEIVER_NOT_FOUND';
    throw error;
  }
  if (senderAccount.status !== 'active') {
    const error = new Error('Sender account is not active');
    error.code = 'SENDER_ACCOUNT_INACTIVE';
    throw error;
  }

  if (receiverAccount.status !== 'active') {
    const error = new Error('Receiver account is not active');
    error.code = 'RECEIVER_ACCOUNT_INACTIVE';
    throw error;
  }
  if (senderAccount.balance < amount) {
    const error = new Error('Insufficient balance');
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  senderAccount.balance -= amount;
  receiverAccount.balance += amount;

  await senderAccount.save({ session });
  await receiverAccount.save({ session });

  const transaction = new Transaction({
    type: 'transfer',
    amount,
    senderAccountId,
    senderUserId: userId,  
    receiverAccountId,
    receiverUserId: receiverAccount.userId,  
    description,
    referenceNumber, 
    status: 'completed',
    balanceAfter: senderAccount.balance 
  });

  await transaction.save({ session });

  return {
    transactionId: transaction._id,
    type: 'transfer',
    amount,
    senderAccount: {
      id: senderAccount._id,
      accountNumber: senderAccount.accountNumber,
      balanceAfter: senderAccount.balance
    },
    receiverAccount: {
      id: receiverAccount._id,
      accountNumber: receiverAccount.accountNumber,
      balanceAfter: receiverAccount.balance
    },
    description,
    referenceNumber,  
    createdAt: transaction.createdAt
  };
}

async function executeDeposit({
  receiverAccountId,
  amount,
  description,
  userId,
  referenceNumber,  
  session
}) {

  const receiverAccount = await Account.findById(receiverAccountId).session(session);
  if (!receiverAccount) {
    const error = new Error('Account not found');
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  if (receiverAccount.userId.toString() !== userId.toString()) {
    const error = new Error('You do not have permission to deposit to this account');
    error.code = 'UNAUTHORIZED_ACCOUNT';
    throw error;
  }
  if (receiverAccount.status !== 'active') {
    const error = new Error('Account is not active');
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  receiverAccount.balance += amount;
  await receiverAccount.save({ session });

  const transaction = new Transaction({
    type: 'deposit',
    amount,
    receiverAccountId,
    receiverUserId: userId,
    description,
    referenceNumber, 
    status: 'completed',
    balanceAfter: receiverAccount.balance  
  });

  await transaction.save({ session });
  return {
    transactionId: transaction._id,
    type: 'deposit',
    amount,
    account: {
      id: receiverAccount._id,
      accountNumber: receiverAccount.accountNumber,
      balanceAfter: receiverAccount.balance
    },
    description,
    referenceNumber, 
    createdAt: transaction.createdAt
  };
}

async function executeWithdraw({
  senderAccountId,
  amount,
  description,
  userId,
  referenceNumber,  
  session
}) {
  
  const senderAccount = await Account.findById(senderAccountId).session(session);
  if (!senderAccount) {
    const error = new Error('Account not found');
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }
  if (senderAccount.userId.toString() !== userId.toString()) {
    const error = new Error('You do not have permission to withdraw from this account');
    error.code = 'UNAUTHORIZED_ACCOUNT';
    throw error;
  }
  if (senderAccount.status !== 'active') {
    const error = new Error('Account is not active');
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }
  if (senderAccount.balance < amount) {
    const error = new Error('Insufficient balance');
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  senderAccount.balance -= amount;
  await senderAccount.save({ session });

  const transaction = new Transaction({
    type: 'withdraw',
    amount,
    senderAccountId,
    senderUserId: userId,  
    description,
    referenceNumber,  
    status: 'completed',
    balanceAfter: senderAccount.balance  
  });

  await transaction.save({ session });
  return {
    transactionId: transaction._id,
    type: 'withdraw',
    amount,
    account: {
      id: senderAccount._id,
      accountNumber: senderAccount.accountNumber,
      balanceAfter: senderAccount.balance
    },
    description,
    referenceNumber, 
    createdAt: transaction.createdAt
  };
}

export const getAllTransactionsManager = async(userId)=>{
  try{
       const transactions = await Transaction.find({ $or: [
           { senderUserId: userId },
           { receiverUserId: userId }
         ]}).sort({createdAt:-1});
       return{
        success:true,
        transactions
       }
  }catch (error) {
    console.error('transaction fetching error:', error);
  }
};

export const getTransactionMangerById= async(userId,transactionId)=>{
  try{
      const transaction = await Transaction.findOne({_id:transactionId, $or: [
           { senderUserId: userId },
           { receiverUserId: userId }
         ]});
      if(!transaction){
        throw new Error ("transaction not found")
      };
      return transaction;
  }catch (error) {
    console.error('transaction fetching error:', error);
  }
}