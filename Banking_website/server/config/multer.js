import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'));
        }
    }
});