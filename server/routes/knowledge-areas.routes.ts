import { Router } from "express";
import { KnowledgeAreasController } from "../controllers";

const router = Router();

router.get("/", KnowledgeAreasController.getAll);
router.post("/", KnowledgeAreasController.create);
router.patch("/:id", KnowledgeAreasController.update);
router.delete("/:id", KnowledgeAreasController.delete);

export default router;