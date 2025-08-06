import { Request, Response } from "express";
import { storage } from "../storage";
import { insertLearningGoalSchema } from "@shared/schema";

export class LearningGoalsController {
  static async getAll(req: Request, res: Response) {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const goals = await storage.getLearningGoals(memberId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching learning goals" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validatedData = insertLearningGoalSchema.parse(req.body);
      const goal = await storage.createLearningGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Create learning goal error:', error);
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLearningGoalSchema.partial().parse(req.body);
      const goal = await storage.updateLearningGoal(id, validatedData);
      if (!goal) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error('Update learning goal error:', error);
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLearningGoal(id);
      if (!success) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting learning goal" });
    }
  }
}