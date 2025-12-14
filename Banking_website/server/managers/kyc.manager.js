import { v4 as uuidv4 } from 'uuid';
import KYC from '../models/kyc.js';
import { deleteFromS3, uploadToS3 } from '../config/s3.js';
import { verifyDocument } from '../services/ocr.service.js';

export const processDocumentUpload = async (data) => {
    const {
        userId,
        documentType,
        category,
        documentNumber,
        fullName,
        file,
        ipAddress,
        userAgent
    } = data;

    const validDocuments = {
        identity: ['aadhaar'],  
        photo: ['photo']        
    };

    if (!validDocuments[category]?.includes(documentType)) {
        throw new Error(
            `Invalid document type for ${category}. Allowed: ${validDocuments[category].join(', ')}`
        );
    }

    let kyc = await KYC.findOne({ userId });
    if (!kyc) {
        kyc = new KYC({
            userId,
            kycStatus: 'incomplete',
            kycStartedAt: new Date()
        });
    }

    if (kyc.isBlocked) {
        throw new Error(
            `Account blocked until ${kyc.blockedUntil}. Reason: ${kyc.blockReason}`
        );
    }

    kyc.uploadAttempts++;
    const documentId = `${uuidv4()}-${Date.now()}`;
    const fileExtension = file.mimetype.split('/')[1];
    const s3Key = `kyc/${userId}/${category}/${documentId}.${fileExtension}`;

    let s3Url = null;
    let verificationResult = null;

    try {
        // Upload file to S3
        s3Url = await uploadToS3({
            key: s3Key,
            body: file.buffer,
            contentType: file.mimetype
        });

        console.log(`✅ File uploaded to S3: ${s3Url}`);

        // AUTO-VERIFY DOCUMENT using OCR
        console.log(`🔍 Starting automatic verification for ${documentType}...`);
        
        verificationResult = await verifyDocument({
            fileBuffer: file.buffer,
            documentType,
            category,
            expectedDocumentNumber: documentNumber,
            expectedFullName: fullName
        });

        console.log(`📋 Verification Result:`, verificationResult);

    } catch (uploadError) {
        console.error('Upload/Verification Error:', uploadError);
        throw new Error('Failed to process document');
    }

    // Determine status based on verification
    let documentStatus = 'pending';
    let rejectionReason = null;

    if (verificationResult.isValid) {
        documentStatus = 'verified';
        console.log(`✅ Document VERIFIED automatically`);
    } else {
        documentStatus = 'rejected';
        rejectionReason = verificationResult.reason;
        kyc.failedAttempts++;
        console.log(`❌ Document REJECTED: ${rejectionReason}`);
    }

    // Prepare document data for database
    const newDocument = {
        documentId,
        documentType,
        category,
        fileUrl: s3Url,
        fileName: file.originalname,
        fileSize: file.size,
        fileFormat: fileExtension,
        documentNumber: verificationResult.extractedData?.documentNumber || documentNumber,
        fullName: verificationResult.extractedData?.fullName || fullName,
        status: documentStatus,
        uploadedBy: userId,
        uploadedAt: new Date(),
        verifiedAt: documentStatus === 'verified' ? new Date() : null,
        rejectedAt: documentStatus === 'rejected' ? new Date() : null,
        rejectionReason,
        uploadMetadata: {
            ipAddress,
            userAgent
        },
        verificationData: {
            confidence: verificationResult.confidence,
            extractedText: verificationResult.extractedText,
            matchScore: verificationResult.matchScore,
            checks: verificationResult.checks
        }
    };

    // Add document to KYC record
    kyc.documents.push(newDocument);

    // Update category-specific status ONLY if verified
    if (documentStatus === 'verified') {
        if (category === 'identity') {
            // Aadhaar verification
            kyc.identityProof.uploaded = true;
            kyc.identityProof.verified = true;
            kyc.identityProof.documentType = documentType;
            kyc.identityProof.documentId = documentId;
            kyc.identityProof.uploadedAt = new Date();
            kyc.identityProof.verifiedAt = new Date();
        } 
        else if (category === 'photo') {
            // Photo verification
            kyc.photograph.uploaded = true;
            kyc.photograph.verified = true;
            kyc.photograph.documentType = documentType;
            kyc.photograph.documentId = documentId;
            kyc.photograph.uploadedAt = new Date();
            kyc.photograph.verifiedAt = new Date();
        }

        kyc.totalDocumentsVerified++;
        kyc.lastVerificationAt = new Date();
    }

    // Update counters
    kyc.totalDocumentsUploaded++;
    kyc.lastDocumentUploadedAt = new Date();

    // Check if KYC is complete (ONLY Aadhaar + Photo needed)
    const allVerified = 
        kyc.identityProof.verified &&   // Aadhaar verified
        kyc.photograph.verified;         // Photo verified

    if (allVerified) {
        // ✅ FULL KYC COMPLETED
        kyc.kycStatus = 'completed';
        kyc.kycLevel = 'full';
        kyc.kycCompletedAt = new Date();
        
        kyc.transactionLimits.dailyTransfer = 100000;
        kyc.transactionLimits.monthlyTransfer = 1000000;
        kyc.transactionLimits.perTransaction = 50000;
        kyc.transactionLimits.annualTransfer = null;

        kyc.features.canTransfer = true;
        kyc.features.canReceive = true;
        kyc.features.canAddBeneficiary = true;
        kyc.features.canApplyForCard = true;
    } 
    else {
        // ⚠️ PARTIAL KYC (Basic)
        kyc.kycStatus = 'incomplete';
        kyc.kycLevel = 'basic';
        
        kyc.transactionLimits.dailyTransfer = 10000;
        kyc.transactionLimits.monthlyTransfer = 50000;
        kyc.transactionLimits.perTransaction = 5000;
    }

    // Calculate completion percentage (50% each for Aadhaar and Photo)
    let completed = 0;
    if (kyc.identityProof.verified) completed += 50;  // Aadhaar
    if (kyc.photograph.verified) completed += 50;     // Photo
    kyc.completionPercentage = Math.round(completed);

    // Block if too many failed attempts
    if (kyc.failedAttempts >= 5) {
        kyc.isBlocked = true;
        kyc.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        kyc.blockReason = 'Too many failed verification attempts';
    }

    // Save to database
    await kyc.save();

    // Return result
    return {
        documentId,
        documentType,
        category,
        status: documentStatus,
        fileUrl: s3Url,
        verificationResult: {
            isValid: verificationResult.isValid,
            confidence: verificationResult.confidence,
            reason: verificationResult.reason,
            extractedData: verificationResult.extractedData
        },
        kyc: {
            kycStatus: kyc.kycStatus,
            kycLevel: kyc.kycLevel,
            completionPercentage: kyc.completionPercentage,
            documentsRequired: {
                aadhaar: kyc.identityProof.verified ? '✅ Verified' : '❌ Required',
                photo: kyc.photograph.verified ? '✅ Verified' : '❌ Required'
            },
            totalDocumentsUploaded: kyc.totalDocumentsUploaded,
            totalDocumentsVerified: kyc.totalDocumentsVerified,
            failedAttempts: kyc.failedAttempts,
            transactionLimits: kyc.transactionLimits,
            features: kyc.features
        }
    };
}; 

export const getAllDocumentsByUserId = async (userId) => {
    try {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) {
            throw new Error(`KYC record not found for user: ${userId}`);
        }

        let documents = kyc.documents || [];
        documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // Return structured response
        return {
            userId,
            totalDocuments: documents.length,
            kycStatus: kyc.kycStatus,
            kycLevel: kyc.kycLevel,
            completionPercentage: kyc.completionPercentage,
            filters: {
                applied: Object.keys(filters).length > 0,
                category: filters.category || 'all',
                status: filters.status || 'all',
                documentType: filters.documentType || 'all'
            },
            summary: {
                verified: documents.filter(doc => doc.status === 'verified').length,
                pending: documents.filter(doc => doc.status === 'pending').length,
                rejected: documents.filter(doc => doc.status === 'rejected').length,
                byCategory: {
                    identity: documents.filter(doc => doc.category === 'identity').length,
                    photo: documents.filter(doc => doc.category === 'photo').length
                }
            },
            documents: documents.map(doc => ({
                documentId: doc.documentId,
                documentType: doc.documentType,
                category: doc.category,
                status: doc.status,
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                fileFormat: doc.fileFormat,
                fileUrl: doc.fileUrl,
                documentNumber: doc.documentNumber,
                fullName: doc.fullName,
                uploadedAt: doc.uploadedAt,
                verifiedAt: doc.verifiedAt,
                rejectedAt: doc.rejectedAt,
                rejectionReason: doc.rejectionReason,
                verificationData: {
                    confidence: doc.verificationData?.confidence,
                    matchScore: doc.verificationData?.matchScore
                }
            }))
        };

    } catch (error) {
        console.error('Error in getAllDocumentsByUserId:', error);
        throw error;
    }
};

export const getDocumentById = async (userId, documentId) => {
    try {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) {
            throw new Error(`KYC record not found for user: ${userId}`);
        }

        const document = kyc.documents.find(doc => doc.documentId === documentId);
        if (!document) {
            throw new Error(`Document not found: ${documentId}`);
        }
        return {
            userId,
            kycStatus: kyc.kycStatus,
            kycLevel: kyc.kycLevel,
            document: {
                documentId: document.documentId,
                documentType: document.documentType,
                category: document.category,
                status: document.status,
                fileName: document.fileName,
                fileSize: document.fileSize,
                fileFormat: document.fileFormat,
                fileUrl: document.fileUrl,
                documentNumber: document.documentNumber,
                fullName: document.fullName,
                uploadedBy: document.uploadedBy,
                uploadedAt: document.uploadedAt,
                verifiedAt: document.verifiedAt,
                rejectedAt: document.rejectedAt,
                rejectionReason: document.rejectionReason,
                uploadMetadata: {
                    ipAddress: document.uploadMetadata?.ipAddress,
                    userAgent: document.uploadMetadata?.userAgent
                },
                verificationData: {
                    confidence: document.verificationData?.confidence,
                    extractedText: document.verificationData?.extractedText,
                    matchScore: document.verificationData?.matchScore,
                    checks: document.verificationData?.checks
                }
            }
        };

    } catch (error) {
        console.error('Error in getDocumentById:', error);
        throw error;
    }
};

export const deleteDocumentById = async (userId, documentId) => {
    try {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) {
            throw new Error(`KYC record not found for user: ${userId}`);
        }

        const documentIndex = kyc.documents.findIndex(
            doc => doc.documentId === documentId
        );

        if (documentIndex === -1) {
            throw new Error(`Document not found: ${documentId}`);
        }

        const document = kyc.documents[documentIndex];
        const s3Key = extractS3KeyFromUrl(document.fileUrl);
        try {
            await deleteFromS3(s3Key);
            console.log(`File deleted from S3: ${s3Key}`);
        } catch (s3Error) {
            console.error(' S3 deletion failed, but continuing with database cleanup:', s3Error);
           
        }
        const deletedDocument = {
            documentId: document.documentId,
            documentType: document.documentType,
            category: document.category,
            status: document.status,
            fileName: document.fileName,
            uploadedAt: document.uploadedAt
        };

        kyc.documents.splice(documentIndex, 1);

        // STEP 8: Update category-specific status if this was a verified document
        if (document.status === 'verified') {
            if (document.category === 'identity') {
                // Reset Aadhaar verification
                kyc.identityProof.uploaded = false;
                kyc.identityProof.verified = false;
                kyc.identityProof.documentType = null;
                kyc.identityProof.documentId = null;
                kyc.identityProof.uploadedAt = null;
                kyc.identityProof.verifiedAt = null;
            } 
            else if (document.category === 'photo') {
                // Reset Photo verification
                kyc.photograph.uploaded = false;
                kyc.photograph.verified = false;
                kyc.photograph.documentType = null;
                kyc.photograph.documentId = null;
                kyc.photograph.uploadedAt = null;
                kyc.photograph.verifiedAt = null;
            }
            kyc.totalDocumentsVerified = Math.max(0, kyc.totalDocumentsVerified - 1);
        };
        kyc.totalDocumentsUploaded = Math.max(0, kyc.totalDocumentsUploaded - 1);
        const allVerified = 
            kyc.identityProof.verified &&   // Aadhaar verified
            kyc.photograph.verified;         // Photo verified

        if (allVerified) {
            // Full KYC still complete
            kyc.kycStatus = 'completed';
            kyc.kycLevel = 'full';
            
            kyc.transactionLimits.dailyTransfer = 100000;
            kyc.transactionLimits.monthlyTransfer = 1000000;
            kyc.transactionLimits.perTransaction = 50000;
            kyc.transactionLimits.annualTransfer = null;

            kyc.features.canTransfer = true;
            kyc.features.canReceive = true;
            kyc.features.canAddBeneficiary = true;
            kyc.features.canApplyForCard = true;
        } else {
            // KYC incomplete now
            kyc.kycStatus = 'incomplete';
            kyc.kycLevel = 'basic';
            kyc.kycCompletedAt = null; // Clear completion date
            
            kyc.transactionLimits.dailyTransfer = 10000;
            kyc.transactionLimits.monthlyTransfer = 50000;
            kyc.transactionLimits.perTransaction = 5000;

            kyc.features.canTransfer = true;
            kyc.features.canReceive = true;
            kyc.features.canAddBeneficiary = false;
            kyc.features.canApplyForCard = false;
        }

        // STEP 11: Recalculate completion percentage
        let completed = 0;
        if (kyc.identityProof.verified) completed += 50;  // Aadhaar
        if (kyc.photograph.verified) completed += 50;     // Photo
        kyc.completionPercentage = Math.round(completed);

        // STEP 12: Save updated KYC record
        await kyc.save();

        // STEP 13: Return result
        return {
            success: true,
            message: 'Document deleted successfully',
            deletedDocument,
            kyc: {
                kycStatus: kyc.kycStatus,
                kycLevel: kyc.kycLevel,
                completionPercentage: kyc.completionPercentage,
                documentsRequired: {
                    aadhaar: kyc.identityProof.verified ? '✅ Verified' : '❌ Required',
                    photo: kyc.photograph.verified ? '✅ Verified' : '❌ Required'
                },
                totalDocumentsUploaded: kyc.totalDocumentsUploaded,
                totalDocumentsVerified: kyc.totalDocumentsVerified,
                transactionLimits: kyc.transactionLimits,
                features: kyc.features
            }
        };

    } catch (error) {
        console.error('Error in deleteDocumentById:', error);
        throw error;
    }
};

const extractS3KeyFromUrl = (fileUrl) => {
    try {
   
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); 
        
        return key;
    } catch (error) {
        const parts = fileUrl.split('.amazonaws.com/');
        if (parts.length > 1) {
            return parts[1];
        }
        throw new Error(`Invalid S3 URL format: ${fileUrl}`);
    }
};