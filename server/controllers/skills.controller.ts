import { Request, Response } from "express";
import { storage } from "../storage";
import { insertSkillSchema } from "@shared/schema";

export class SkillsController {
  static async getAll(req: Request, res: Response) {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const skill = await storage.getSkill(id);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSkillSchema.partial().parse(req.body);
      const skill = await storage.updateSkill(id, validatedData);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSkill(id);
      if (!success) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill" });
    }
  }
}