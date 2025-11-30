import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    linkedAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true
    },
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true
    }, 
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    category: {
      type: String,
      enum: ["family", "friends", "business", "bills", "other"],
      default: "other"
    },
  createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

beneficiarySchema.index({ 
  userId: 1, 
  linkedAccountId: 1 
}, { 
  unique: true 
});

beneficiarySchema.index({ userId: 1, nickname: 1 });

const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);
export default Beneficiary;