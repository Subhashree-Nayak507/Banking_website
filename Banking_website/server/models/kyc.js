import mongoose from "mongoose";

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
  
    kycStatus: {
        type: String,
        enum: ['not_started', 'incomplete', 'completed'],
        default: 'not_started',
        index: true
    },
    
    kycLevel: {
        type: String,
        enum: ['none', 'basic', 'full'],
        default: 'none'
    },
    
    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
 
    // Aadhaar (Identity Proof - REQUIRED)
    identityProof: {
        uploaded: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        documentType: {
            type: String,
            enum: ['aadhaar', null],
            default: null
        },
        documentId: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
        verifiedAt: { type: Date, default: null }
    },

    // Photograph (REQUIRED)
    photograph: {
        uploaded: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        documentType: {
            type: String,
            enum: ['photo', null],
            default: null
        },
        documentId: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
        verifiedAt: { type: Date, default: null }
    },
    
    // ========================================
    // DOCUMENTS ARRAY (Store all uploaded docs)
    // ========================================
    documents: [{
        documentId: {
            type: String,
            required: true,
            unique: true 
        },
        documentType: {
            type: String,
            required: true,
            enum: ['aadhaar', 'photo']  // Only Aadhaar and Photo
        },
        category: {
            type: String,
            required: true,
            enum: ['identity', 'photo']  // Only these two categories
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        fileFormat: {
            type: String,
            required: true,
            enum: ['jpg', 'jpeg', 'png', 'pdf']
        },
        documentNumber: {
            type: String,
            required: true,
            uppercase: true
        },
        fullName: {
            type: String,
            required: true,
            uppercase: true
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },
        rejectionReason: {
            type: String,
            default: null
        },
        uploadMetadata: {
            ipAddress: String,
            userAgent: String
        },
        verificationData: {
            confidence: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            },
            extractedText: {
                type: String,
                default: ''
            },
            matchScore: {
                type: Number,
                min: 0,
                max: 1,
                default: 0
            },
            checks: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            }
        }
    }],
    
    // ========================================
    // TRANSACTION LIMITS
    // ========================================
    transactionLimits: {
        dailyTransfer: { type: Number, default: 0 },
        monthlyTransfer: { type: Number, default: 0 },
        perTransaction: { type: Number, default: 0 },
        annualTransfer: { type: Number, default: null }
    },
    
    // ========================================
    // FEATURES
    // ========================================
    features: {
        canTransfer: { type: Boolean, default: false },
        canReceive: { type: Boolean, default: false },
        canAddBeneficiary: { type: Boolean, default: false },
        canApplyForCard: { type: Boolean, default: false }
    },
    
    // ========================================
    // COUNTERS
    // ========================================
    totalDocumentsUploaded: { type: Number, default: 0 },
    totalDocumentsVerified: { type: Number, default: 0 },
    
    // ========================================
    // TIMELINE
    // ========================================
    kycStartedAt: { type: Date, default: null },
    kycCompletedAt: { type: Date, default: null },
    lastDocumentUploadedAt: { type: Date, default: null },
    lastVerificationAt: { type: Date, default: null },
    
    // ========================================
    // FRAUD PREVENTION
    // ========================================
    uploadAttempts: { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedUntil: { type: Date, default: null },
    blockReason: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

kycSchema.index({ kycStatus: 1 });
kycSchema.index({ kycLevel: 1 });


kycSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const KYC = mongoose.model("KYC", kycSchema);
export default KYC;