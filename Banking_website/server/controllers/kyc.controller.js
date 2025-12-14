import * as kycManager from '../managers/kyc.manager.js';

export const uploadDocument= async (req, res) => {
    try {
        const userId= req.user._id;
        const {
            documentType,   
            category,        // 'identity', 'address', 'photo'
            documentNumber,  // Document number (PAN: ABCDE1234F)
            fullName         // Full name on document
        } = req.body;

        if (!userId || !documentType || !category || !documentNumber || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, documentType, category, documentNumber, fullName'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document uploaded'
            });
        };
        const result = await kycManager.processDocumentUpload({
            userId,
            documentType,
            category,
            documentNumber: documentNumber.toUpperCase(),
            fullName: fullName.toUpperCase(),
            file: req.file,                    // File buffer from Multer
            ipAddress: req.ip,                 // Client IP for audit
            userAgent: req.headers['user-agent'] // Client browser info
        });
        return res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: result
        });

    } catch (error) {
        console.error('Controller Error:', error);
    }
};

export const getAllDocuments = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await kycManager.getAllDocumentsByUserId(userId);

        return res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: error.message
        });
    }
};

export const getDocumentById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'Document ID is required'
            });
        }
        const result = await kycManager.getDocumentById(userId, documentId);
        return res.status(200).json({
            success: true,
            message: 'Document retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error('Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve document',
            error: error.message
        });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const userId = req.user._id;

        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'Document ID is required'
            });
        }

        const result = await kycManager.deleteDocumentById(userId, documentId);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                deletedDocument: result.deletedDocument,
                updatedKYC: result.kyc
            }
        });

    } catch (error) {
        console.error('Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
};