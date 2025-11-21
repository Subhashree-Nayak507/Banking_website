import { createAccountManger, getAllAccountsManger, getSpecificAccountManger } from "../managers/account.manager.js";

export const  getAllAccountController = async(req,res)=>{
    try{
        const userId = req.user._id; 
        const accounts = await getAllAccountsManger(userId);
        return res.status(200).json({
            sucess:true,
            count:accounts.length,
            accounts
        })
    }catch (error) {
    console.error('Account fetching error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Account fetching'
    });
  }
};

export const getSpecificAccountController = async(req,res)=>{
  try{
      const userId = req.user._id; 
      const accountId = req.params.id;
      const accounts = await getSpecificAccountManger(userId,accountId);
     return res.status(200).json({
            sucess:true,
            message:"Account of specific id fetched successfully",
            accounts
        });
  }catch (error) {
    console.error('Account fetching error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Account fetching'
    });
  }
};

export const createAccountController = async(req,res)=>{
  try{
    const { accountType ,balance,currency} = req.body;

    if(balance <500){
      return res.status(400).json({
        message:"Initial value must be at least 500"
      })
    };
    if(!accountType || !currency){
      return res.status(400).json({
        message:"All fields are required"
      })
    };
    const userId= req.user._id;
    await createAccountManger(userId,accountType,balance,currency);
    return res.status(201).json({
      success:true,
      message:"Account created successfully"
    })
  }catch (error) {
    console.error('Account creating error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Account creating'
    });
  }
};

