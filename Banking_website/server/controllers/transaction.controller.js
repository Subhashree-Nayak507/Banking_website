import { getTransactionMangerById, getAllTransactionsManager, createTransaction } from '../managers/transaction.manager.js';

export const createTransactionController = async(req, res) => {
  try {
    const userId = req.user.id;
    const { type, amount, senderAccountId, receiverAccountId, description,referenceNumber } = req.body;

      if (!referenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Reference number is required',
        error: 'MISSING_REFERENCE_NUMBER'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type is required',
      });
    }
    
    const validTypes = ['transfer', 'deposit', 'withdraw'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type. Must be: transfer, deposit, or withdraw',
        error: 'INVALID_TYPE'
      });
    }
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
        error: 'MISSING_AMOUNT'
      });
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
        error: 'INVALID_AMOUNT'
      });
    }
    if (type === 'transfer') {
      if (!senderAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Sender account ID is required for transfer',
          error: 'MISSING_SENDER_ACCOUNT'
        });
      }
      if (!receiverAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver account ID is required for transfer',
          error: 'MISSING_RECEIVER_ACCOUNT'
        });
      }
      if (senderAccountId === receiverAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot transfer to the same account',
          error: 'SAME_ACCOUNT'
        });
      }
    } else if (type === 'deposit') {
      if (!receiverAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver account ID is required for deposit',
          error: 'MISSING_RECEIVER_ACCOUNT'
        });
      }
    } else if (type === 'withdraw') {
      if (!senderAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Sender account ID is required for withdrawal',
          error: 'MISSING_SENDER_ACCOUNT'
        });
      }
    }

    const result = await createTransaction({
      type,
      amount: parsedAmount,
      senderAccountId: senderAccountId || null,
      receiverAccountId: receiverAccountId || null,
      description: description || null,
      userId, 
      referenceNumber 
    });
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during transaction creating'
    });
  }
};

export const getAllTransactionsController = async(req, res) => {
    try{
        const userId = req.user._id;
        const transactions = await getAllTransactionsManager(userId);
        res.status(200).json({
            success: true,
            message: 'all transactions fetched successfully',
            transactions
        })  
    } catch (error) {
      console.error('transaction fetching error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during transaction fetching'
      });
    }
};

export const getTransactionByIdController = async(req, res) => {
    try{
        const userId = req.user._id;
        const transactionId = req.params.id;
        const result = await getTransactionMangerById(userId, transactionId);
        res.status(200).json({
            success: true,
            result
        })
    } catch (error) {
      console.error('transaction fetching error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during transaction fetching'
      });
    }
}