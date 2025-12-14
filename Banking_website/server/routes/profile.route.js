import express from 'express';
import { protectRoute } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';
import { getProfileBulkData, updateProfileBulkData } from '../controllers/profile.controller.js';

const router = express.Router();

router.get('/bulk-data', protectRoute,getProfileBulkData);
router.put( '/bulk-update', protectRoute, upload.single('profilePic'), updateProfileBulkData);

export default router;