import Beneficiary from "../models/beneficiary.js";
import Account from "../models/account.js";

export const createBeneficiaryManager = async ({ 
  accountNumber, 
  nickname, 
  category, 
  userId 
}) => {
  try {
    const recipientAccount = await Account.findOne({ 
      accountNumber 
    }).populate('userId', 'username email');

    if (!recipientAccount) {
      throw new Error("Account not found. User must be registered in our system.");
    };
    if (recipientAccount.userId._id.toString() === userId.toString()) {
      throw new Error("You cannot add your own account as beneficiary");
    };

    const exists = await Beneficiary.findOne({
      userId,
      linkedAccountId: recipientAccount._id
    });
    if (exists) {
      throw new Error("This beneficiary already exists");
    }
    
    const beneficiary = new Beneficiary({
      userId,
      linkedAccountId: recipientAccount._id,
      linkedUserId: recipientAccount.userId._id,
      accountNumber: recipientAccount.accountNumber,
      accountHolderName: recipientAccount.userId.username,
      nickname,
      category: category || "other"
    });
    await beneficiary.save();
    return beneficiary;
  } catch (error) {
    console.error('benficiary error:', error);
  }
};

export const getAllBEneficiariesManger= async({userId})=>{
  try{
     const beneficiaries = await Beneficiary.find({userId})
      .populate('linkedUserId', 'name email')
      .populate('linkedAccountId', 'accountNumber accountType balance')
      .sort({ createdAt: -1 });
      return beneficiaries;
  }catch (error) {
    console.error('not found error:', error);
  }
}

export const getBeneficiaryByIdManager = async ({ beneficiaryId, userId }) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: beneficiaryId,
      userId
    })
    .populate('linkedUserId', 'username email firstName lastName')
    .populate('linkedAccountId', 'accountNumber accountType balance');
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    return beneficiary;
  } catch (error) {
    console.error('not found error:', error);
  }
};

export const updateBeneficiaryManager = async ({ 
  beneficiaryId, 
  userId, 
  nickname, 
  category 
}) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: beneficiaryId,
      userId
    });
    
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }  
    
    if (nickname) beneficiary.nickname = nickname;
    if (category) beneficiary.category = category;
    beneficiary.updatedAt = Date.now();
    
    await beneficiary.save();
    return beneficiary;
  
  } catch (error) {
    throw error;
  }
};

export const deleteBeneficiaryManager = async ({ beneficiaryId, userId }) => {
  try {
    const beneficiary = await Beneficiary.findOneAndDelete({
      _id: beneficiaryId,
      userId
    });
    
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    
    return beneficiary;
    
  } catch (error) {
    throw error;
  }
};