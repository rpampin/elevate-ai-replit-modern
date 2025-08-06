import { Router } from "express";
import { AIAgentController } from "../controllers/ai-agent.controller";

const router = Router();

router.post("/query", AIAgentController.processQuery);
router.get("/suggestions", AIAgentController.getSuggestedQuestions);

export default router;