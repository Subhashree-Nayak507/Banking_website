import  { upload } from "../config/multer.js";
import {  deleteDocument, getAllDocuments, getDocumentById, uploadDocument } from "../controllers/kyc.controller.js";
import { protectRoute } from "../middlewares/auth.js";
import express from "express";

const router = express.Router();

router.post('/upload',protectRoute, upload.single('document'),  uploadDocument);
router.get('/get',protectRoute ,getAllDocuments);
router.get('/:documentId/get',protectRoute, getDocumentById);
router.delete('/:documentId/delete',protectRoute, deleteDocument);

export default router;
