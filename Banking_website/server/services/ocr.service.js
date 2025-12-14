import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';

export const verifyDocument = async ({
    fileBuffer,
    documentType,
    category,
    expectedDocumentNumber,
    expectedFullName
}) => {
    try {
        console.log(`🔍 Verifying ${documentType}...`);

        // STEP 1: Preprocess image for better OCR accuracy
        const processedBuffer = await preprocessImage(fileBuffer);

        // STEP 2: Extract text using Tesseract OCR
        const extractedText = await extractTextFromImage(processedBuffer);
        
        console.log(`📄 Extracted Text:`, extractedText.substring(0, 200));

        // STEP 3: Verify based on document type
        let verificationResult;

        if (category === 'photo') {
            verificationResult =await  verifyPhoto(fileBuffer);
        } else if (documentType === 'aadhaar') {
            verificationResult =await verifyAadhaar(extractedText, expectedDocumentNumber, expectedFullName);
        } else {
            verificationResult = {
                isValid: false,
                reason: 'Unknown document type',
                confidence: 0
            };
        }

        return {
            ...verificationResult,
            extractedText,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('OCR Verification Error:', error);
        return {
            isValid: false,
            reason: `Verification failed: ${error.message}`,
            confidence: 0,
            extractedText: '',
            checks: {}
        };
    }
};

const preprocessImage = async (buffer) => {
    try {
        const image = await Jimp.read(buffer);
        
        // Enhance image quality
        image
            .greyscale()           // Convert to grayscale
            .contrast(0.3)         // Increase contrast
            .normalize();          // Normalize brightness
        
        // Resize - NEW JIMP API requires an object
        if (image.bitmap.height < 1000) {
            await image.resize({ h: 1000 }); // Resize height to 1000px, width auto
        }
        
        return await image.getBuffer(Jimp.MIME_PNG);
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        return buffer; // Return original if preprocessing fails
    }
};

const extractTextFromImage = async (buffer) => {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        logger: info => console.log(info)
    });
    
    return text.toUpperCase().replace(/\s+/g, ' ').trim();
};

const verifyAadhaar = (text, expectedAadhaar, expectedName) => {
    const checks = {
        aadhaarFound: false,
        nameFound: false,
        aadhaarFormat: false,
        govText: false
    };

    // Check 1: Aadhaar format (12 digits, may be masked: XXXX XXXX 1234)
    const aadhaarPattern = /\d{4}\s?\d{4}\s?\d{4}/g;
    const aadhaarMatches = text.match(aadhaarPattern);
    
    if (aadhaarMatches) {
        checks.aadhaarFound = true;
        const extractedAadhaar = aadhaarMatches[0].replace(/\s/g, '');
        checks.aadhaarFormat = expectedAadhaar.slice(-4) === extractedAadhaar.slice(-4);
    }

    // Check 2: Name matching
    const nameSimilarity = calculateSimilarity(text, expectedName.toUpperCase());
    checks.nameFound = nameSimilarity > 0.7;

    // Check 3: Government text
    checks.govText = text.includes('GOVERNMENT OF INDIA') || 
                     text.includes('UIDAI') ||
                     text.includes('UNIQUE IDENTIFICATION');

    const isValid = checks.aadhaarFormat && checks.nameFound && checks.govText;
    const confidence = calculateConfidence(checks);

    return {
        isValid,
        reason: isValid ? 'Aadhaar verified successfully' : getFailureReason(checks),
        confidence,
        checks,
        extractedData: {
            documentNumber: aadhaarMatches ? aadhaarMatches[0].replace(/\s/g, '') : null,
            fullName: expectedName
        },
        matchScore: nameSimilarity
    };
};

const verifyPhoto = async (buffer) => {
    try {
        const image = await Jimp.read(buffer);
        
        const checks = {
            validFormat: true,
            minSize: image.bitmap.width >= 200 && image.bitmap.height >= 200,
            aspectRatio: Math.abs((image.bitmap.width / image.bitmap.height) - 1) < 0.5
        };

        const isValid = checks.validFormat && checks.minSize && checks.aspectRatio;
        const confidence = calculateConfidence(checks);

        return {
            isValid,
            reason: isValid ? 'Photo verified successfully' : 'Photo does not meet requirements',
            confidence,
            checks,
            extractedData: {}
        };
    } catch (error) {
        return {
            isValid: false,
            reason: 'Invalid photo format',
            confidence: 0,
            checks: { validFormat: false }
        };
    }
};

const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
};

const calculateConfidence = (checks) => {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(v => v === true).length;
    return Math.round((passed / total) * 100);
};

const getFailureReason = (checks) => {
    const failed = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    return `Verification failed: ${failed.join(', ')} not found or invalid`;
};