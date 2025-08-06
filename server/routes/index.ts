import { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";

import knowledgeAreasRoutes from "./knowledge-areas.routes";
import skillCategoriesRoutes from "./skill-categories.routes";
import skillsRoutes from "./skills.routes";
import scalesRoutes from "./scales.routes";
import { clientsRouter } from "./clients.routes";
import categoriesRoutes from "./categories";
import locationsRoutes from "./locations";
import membersRoutes from "./members.routes";
import learningGoalsRoutes from "./learning-goals.routes";
import analyticsRoutes from "./analytics.routes";
import aiAgentRoutes from "./ai-agent.routes";
import dataUpdateRoutes from "./data-update.routes";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all route modules
  app.use("/api/knowledge-areas", knowledgeAreasRoutes);
  app.use("/api/skill-categories", skillCategoriesRoutes);
  app.use("/api/skills", skillsRoutes);
  app.use("/api/scales", scalesRoutes);
  app.use("/api/clients", clientsRouter);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/locations", locationsRoutes);
  app.use("/api/members", membersRoutes);
  app.use("/api/learning-goals", learningGoalsRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/ai-agent", aiAgentRoutes);
  app.use("/api/data-update", dataUpdateRoutes);

  // File upload endpoint (if needed in the future)
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ message: "File uploaded successfully", filename: req.file.originalname });
  });

  const httpServer = createServer(app);
  return httpServer;
}