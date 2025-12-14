import {dashboardManager}  from "../managers/dashboard.manager.js";

export const dashboard= async(req,res)=>{
    try{
        const userId= req.user._id;
        const data= await dashboardManager(userId);
        return res.status(200).json({
            success:true,
            message:"retreved successfully",
            data
        })
    }catch (error) {
      console.error('Controller Error:', error);
      return res.status(500).json({
      success: false,
      message: 'Server error during dashboard data retrieving'
    });
    }
};

