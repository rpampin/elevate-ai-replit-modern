import { Request, Response } from "express";
import { storage } from "../storage";
import { insertKnowledgeAreaSchema } from "@shared/schema";

export class KnowledgeAreasController {
  static async getAll(req: Request, res: Response) {
    try {
      const knowledgeAreas = await storage.getKnowledgeAreas();
      res.json(knowledgeAreas);
    } catch (error) {
      res.status(500).json({ message: "Error fetching knowledge areas" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validatedData = insertKnowledgeAreaSchema.parse(req.body);
      const knowledgeArea = await storage.createKnowledgeArea(validatedData);
      res.status(201).json(knowledgeArea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertKnowledgeAreaSchema.partial().parse(req.body);
      const knowledgeArea = await storage.updateKnowledgeArea(id, validatedData);
      if (!knowledgeArea) {
        return res.status(404).json({ message: "Knowledge area not found" });
      }
      res.json(knowledgeArea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteKnowledgeArea(id);
      if (!success) {
        return res.status(404).json({ message: "Knowledge area not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting knowledge area" });
    }
  }
}