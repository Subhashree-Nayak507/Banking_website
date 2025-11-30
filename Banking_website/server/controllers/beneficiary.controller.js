import { createBeneficiaryManager, deleteBeneficiaryManager, getAllBEneficiariesManger, getBeneficiaryByIdManager,
   updateBeneficiaryManager } from "../managers/beneficiary.manger.js";

export const addBeneficiaryController = async (req, res) => {
  try {
    const { accountNumber, nickname, category } = req.body;
    const userId = req.user._id;  
    
    if (!accountNumber || !nickname  ) {
      return res.status(400).json({
        success: false,
        message: "Account number and nickname are required"
      });
    };
    const beneficiary = await createBeneficiaryManager({
        accountNumber,
        nickname,
        category:category || "other",
        userId
    })
    return res.status(201).json({
      success: true,
      message: "Beneficiary added successfully",
      beneficiary
    });
    
  } catch (error) {
    console.error("Add beneficiary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add beneficiary",
      error: error.message
    });
  }
};

export const getBeneficiariesController= async(req,res) =>{
    try{
      const userId= req.user._id;
      const beneficiary= await getAllBEneficiariesManger({
        userId
      });

      res.status(200).json({
        success:true,
        message:"all are beneficiaries",
        beneficiary
      })
    }catch (error) {
    console.error("retrieve beneficiary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add beneficiary",
      error: error.message
    });
  }
};

export const getBeneficiaryByIdController=async(req,res)=>{
    try{
        const userId= req.user._id;
        const  beneficiaryId  = req.params.id;
        if(!beneficiaryId){
            return res.status(400).json({
                success: false,
                message: "BeneficiaryId is not there"
        }) };
        const beneficiary= await getBeneficiaryByIdManager({
            userId,
            beneficiaryId
        });
        res.status(200).json({
            success:true,
            message:"retrieved successfully",
            beneficiary
        });
    }catch (error) {
    console.error("retrieve beneficiary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add beneficiary",
      error: error.message
    });
  }
};

export const updateBeneficiary = async (req, res) => {
  try {
    const  beneficiaryId  = req.params.id;
    const { nickname, category } = req.body;
    const userId = req.user._id;

    if (!beneficiaryId) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary ID is required"
      });
    }
    if (!nickname && !category) {
      return res.status(400).json({
        success: false,
        message: "At least one field (nickname or category) is required to update"
      });
    }

    const updatedBeneficiary = await updateBeneficiaryManager({
      beneficiaryId,
      userId,
      nickname,
      category
    });
    res.status(200).json({
      success: true,
      message: "Beneficiary updated successfully",
      data: updatedBeneficiary
    });

  } catch (error) {
    console.error('Update beneficiary error:', error);
    
    if (error.message === "Beneficiary not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export const deleteBeneficiary = async (req, res) => {
  try {
    const beneficiaryId  = req.params.id;
    const userId = req.user._id;
    if (!beneficiaryId) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary ID is required"
      });
    }

    const deletedBeneficiary = await deleteBeneficiaryManager({
      beneficiaryId,
      userId
    });
    res.status(200).json({
      success: true,
      message: "Beneficiary deleted successfully",
      data: deletedBeneficiary
    });

  } catch (error) {
    console.error('Delete beneficiary error:', error);
    
    if (error.message === "Beneficiary not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};