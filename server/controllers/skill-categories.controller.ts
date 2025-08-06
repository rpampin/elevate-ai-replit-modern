import { Request, Response } from "express";
import { storage } from "../storage";
import { insertSkillCategorySchema } from "@shared/schema";

export class SkillCategoriesController {
  static async getAll(req: Request, res: Response) {
    try {
      const categories = await storage.getSkillCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill categories" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validatedData = insertSkillCategorySchema.parse(req.body);
      const category = await storage.createSkillCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSkillCategorySchema.partial().parse(req.body);
      const category = await storage.updateSkillCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Skill category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSkillCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Skill category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill category" });
    }
  }
}