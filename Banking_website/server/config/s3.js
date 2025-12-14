import { S3Client, DeleteObjectCommand  } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
    region: process.env.AWS_S3_BUCKET_REGION ,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,     
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
    },
    endpoint: 'https://s3.eu-north-1.amazonaws.com',
    forcePathStyle: false
});

console.log('🔍 AWS Region from env:', process.env.AWS_S3_BUCKET_REGION);
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

export const uploadToS3 = async ({ key, body, contentType }) => {
    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,        // S3 bucket name
                Key: key,                   // File path in S3 (kyc/user123/identity/abc.jpg)
                Body: body,                 // File buffer (actual file data)
                ContentType: contentType,   // MIME type (image/jpeg, application/pdf)
                
                // Optional: Add metadata for tracking
                Metadata: {
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'kyc-service'
                }
            }
        });
        const result = await upload.done();
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_REGION}.amazonaws.com/${key}`;

        console.log(`✅ S3 Upload Success: ${fileUrl}`);

        return fileUrl;

    } catch (error) {
        console.error('❌ S3 Upload Error:', error);
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

export const deleteFromS3 = async (key) => {
    try {
        // Create delete command
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        // Execute delete
        await s3Client.send(command);

        console.log(`✅ S3 Delete Success: ${key}`);
        return true;

    } catch (error) {
        console.error('❌ S3 Delete Error:', error);
        throw new Error(`S3 delete failed: ${error.message}`);
    }
};