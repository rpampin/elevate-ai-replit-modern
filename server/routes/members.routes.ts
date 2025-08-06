import { Router } from "express";
import { MembersController } from "../controllers";

const router = Router();

// Debug middleware to log all member requests
router.use((req, res, next) => {
  console.log(`[MEMBERS ROUTE] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

// Member CRUD operations
router.get("/", MembersController.getAll);
router.get("/:id", MembersController.getById);
router.post("/", MembersController.create);
router.put("/:id", MembersController.update);
router.patch("/:id", MembersController.update);
router.delete("/:id", MembersController.delete);

// Member profile operations
router.get("/:id/profile", MembersController.getProfile);
router.post("/:id/profile", MembersController.updateProfile);
router.put("/:id/profile", MembersController.updateProfile);
router.patch("/:id/profile", MembersController.updateProfile);

// Member skills operations
router.get("/:id/skills", MembersController.getSkills);
router.post("/:id/skills", MembersController.addSkill);
router.put("/:id/skills/:skillId", MembersController.updateSkill);
router.delete("/:id/skills/:skillId", MembersController.deleteSkill);

// Member assignment operations
router.post("/:id/assignments", MembersController.addAssignment);
router.patch("/:id/assignments/:assignmentId", MembersController.updateAssignment);
router.delete("/:id/assignments/:assignmentId", MembersController.deleteAssignment);

// Member role operations
router.post("/:id/roles", MembersController.addRole);
router.patch("/:id/roles/:roleId", MembersController.updateRole);
router.delete("/:id/roles/:roleId", MembersController.deleteRole);

// Member appreciation operations
router.post("/:id/appreciations", MembersController.addAppreciation);
router.patch("/:id/appreciations/:appreciationId", MembersController.updateAppreciation);
router.delete("/:id/appreciations/:appreciationId", MembersController.deleteAppreciation);

// Member feedback operations
router.post("/:id/feedback", MembersController.addFeedback);
router.patch("/:id/feedback/:feedbackId", MembersController.updateFeedback);
router.delete("/:id/feedback/:feedbackId", MembersController.deleteFeedback);

// Member client history operations
router.post("/:id/client-history", MembersController.addClientHistory);
router.patch("/:id/client-history/:clientHistoryId", MembersController.updateClientHistory);
router.delete("/:id/client-history/:clientHistoryId", MembersController.deleteClientHistory);

export default router;