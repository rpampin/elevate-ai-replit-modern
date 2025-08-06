import { Router } from "express";
import { SkillsController } from "../controllers";

const router = Router();

router.get("/", SkillsController.getAll);
router.get("/:id", SkillsController.getById);
router.post("/", SkillsController.create);
router.patch("/:id", SkillsController.update);
router.delete("/:id", SkillsController.delete);

export default router;