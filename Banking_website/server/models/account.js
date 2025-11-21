import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },    
    accountNumber: {
      type: String,
      required: true,
      unique: true,  
      trim: true,
    },  
    accountType: {
      type: String,
      enum: ["savings", "current"],  
      required: true,
      default: "savings"
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0  
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"]  
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active"
    },
    openedDate: {
      type: Date,
      default: Date.now
    },
    lastTransactionDate: {
      type: Date,
      default: null  
    },
    interestRate: {
      type: Number,
      default: 4.0
    }
  },
  { timestamps: true  }
);
accountSchema.index({ userId:1});

const Account = mongoose.model("Account", accountSchema);
export default Account;