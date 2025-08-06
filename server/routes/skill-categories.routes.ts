import { Router } from "express";
import { SkillCategoriesController } from "../controllers";

const router = Router();

router.get("/", SkillCategoriesController.getAll);
router.post("/", SkillCategoriesController.create);
router.patch("/:id", SkillCategoriesController.update);
router.delete("/:id", SkillCategoriesController.delete);

export default router;