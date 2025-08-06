import { Request, Response } from "express";
import { storage } from "../storage";

export class AnalyticsController {
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics stats" });
    }
  }

  static async getCompanyStrengths(req: Request, res: Response) {
    try {
      const strengths = await storage.getCompanyStrengths();
      res.json(strengths);
    } catch (error) {
      res.status(500).json({ message: "Error fetching company strengths" });
    }
  }

  static async getSkillGaps(req: Request, res: Response) {
    try {
      const gaps = await storage.getSkillGaps();
      res.json(gaps);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill gaps" });
    }
  }
}