import { Router } from "express";
import { AnalyticsController } from "../controllers";

const router = Router();

router.get("/stats", AnalyticsController.getStats);
router.get("/company-strengths", AnalyticsController.getCompanyStrengths);
router.get("/skill-gaps", AnalyticsController.getSkillGaps);

export default router;