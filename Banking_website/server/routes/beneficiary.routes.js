import express from "express";
import { protectRoute } from "../middlewares/auth.js";
import { addBeneficiaryController, deleteBeneficiary, getBeneficiariesController, getBeneficiaryByIdController, updateBeneficiary } from "../controllers/beneficiary.controller.js";


const router= express.Router();

router.post("/create",protectRoute,addBeneficiaryController);
router.get("/:id/all",protectRoute,getBeneficiaryByIdController);
router.get("/all",protectRoute,getBeneficiariesController);
router.put("/:id/update",protectRoute,updateBeneficiary);
router.delete("/:id/delete",protectRoute,deleteBeneficiary);

export default router;