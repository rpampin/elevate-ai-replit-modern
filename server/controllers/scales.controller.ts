import { Request, Response } from "express";
import { storage } from "../storage";
import { insertScaleSchema } from "@shared/schema";

export class ScalesController {
  static async getAll(req: Request, res: Response) {
    try {
      const scales = await storage.getScales();
      res.json(scales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scales" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const scale = await storage.getScale(id);
      if (!scale) {
        return res.status(404).json({ message: "Scale not found" });
      }
      res.json(scale);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scale" });
    }
  }

  static async getByCategory(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const scales = await storage.getScalesByCategory(categoryId);
      res.json(scales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scales for category" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validatedData = insertScaleSchema.parse(req.body);
      const scale = await storage.createScale(validatedData);
      res.status(201).json(scale);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertScaleSchema.partial().parse(req.body);
      const scale = await storage.updateScale(id, validatedData);
      if (!scale) {
        return res.status(404).json({ message: "Scale not found" });
      }
      res.json(scale);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteScale(id);
      if (!success) {
        return res.status(404).json({ message: "Scale not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting scale" });
    }
  }
}