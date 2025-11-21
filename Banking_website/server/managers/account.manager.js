import Account from "../models/account.js";
import { generateAccountNumber } from "../utils/utils.js";

export const getAllAccountsManger= async(userId)=>{
    try{
    const accounts = await Account.find({ userId ,status:{ $ne :"closed"}}).sort({createdAt :-1});
    if(!accounts){
        throw new Error("No accounts found ")
    };
    return accounts;
    }catch(error){
        throw error;
    }
};

export const getSpecificAccountManger = async(userId,accountId)=>{
    try{
       const account = await Account.findOne({
      _id: accountId,
      userId: userId,
      status:{ $ne :"closed"}
    });
    if (!account) {
      throw new Error("Account not found ");
    };
    return account;
    }catch(error){
         throw error;
    }
};

export const createAccountManger = async(userId,accountType,balance,currency)=>{
    try{
        const check= await Account.findOne({userId,accountType:accountType,status:{$ne:"closed"}});
        if(check){
            throw new Error ("account already exists for you with type")
        };
         if (accountType === "current") {
            const hasSavings = await Account.findOne({ 
                userId, 
                accountType: "savings",
                status: { $ne: "closed" }
            });
            
            if (!hasSavings) {
                throw new Error("You must have a savings account before opening a current account");
            }
        };
        const accountNumber= await generateAccountNumber();
        const newAccount = new Account({
            userId,
            accountNumber,
            accountType,
            balance,
            currency,
            openedDate:new Date(),
            status:"active"
        });
        await newAccount.save();
    }catch(error){
        throw error;
    }
}

