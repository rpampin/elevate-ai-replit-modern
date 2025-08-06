import { Router } from "express";
import { LearningGoalsController } from "../controllers";

const router = Router();

// Learning goal statuses
router.get("/statuses", (req, res) => {
  const statuses = [
    { id: 1, name: "Pending", description: "Goal is pending approval or assignment", isActive: true },
    { id: 2, name: "Active", description: "Goal is currently being worked on", isActive: true },
    { id: 3, name: "On Hold", description: "Goal is temporarily paused", isActive: true },
    { id: 4, name: "Complete", description: "Goal has been achieved", isActive: true }
  ];
  res.json(statuses);
});

router.get("/", LearningGoalsController.getAll);
router.post("/", LearningGoalsController.create);
router.put("/:id", LearningGoalsController.update);
router.patch("/:id", LearningGoalsController.update);
router.delete("/:id", LearningGoalsController.delete);

export default router;