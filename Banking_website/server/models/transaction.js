import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["transfer", "withdraw", "deposit"]
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    senderAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: function() {
            return this.type == "transfer" || this.type == "withdraw";
        }
    },
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() {
            return this.type == "transfer" || this.type == "withdraw";
        }
    },
    receiverAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account", 
        required: function() {
            return this.type == "transfer" || this.type == "deposit";
        }
    },
    receiverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() {
            return this.type == "transfer" || this.type == "deposit";
        }
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['completed', 'failed']
    },
    description: {
        type: String,
        maxlength: 200
    },
    referenceNumber: {
        type: String,
        required: true,
        unique: true
    },
    balanceAfter: {
        type: Number,
        required: true
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

transactionSchema.index({ senderUserId: 1, createdAt: -1 });
transactionSchema.index({ receiverUserId: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;