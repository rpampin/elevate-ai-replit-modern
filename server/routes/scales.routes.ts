import { Router } from "express";
import { ScalesController } from "../controllers";

const router = Router();

router.get("/", ScalesController.getAll);
router.get("/:id", ScalesController.getById);
router.get("/category/:categoryId", ScalesController.getByCategory);
router.post("/", ScalesController.create);
router.patch("/:id", ScalesController.update);
router.delete("/:id", ScalesController.delete);

export default router;