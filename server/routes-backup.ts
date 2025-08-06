import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertKnowledgeAreaSchema, insertSkillCategorySchema, insertSkillSchema, 
  insertScaleSchema, insertMemberSchema, insertMemberProfileSchema,
  insertMemberSkillSchema, insertLearningGoalSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Knowledge Areas
  app.get("/api/knowledge-areas", async (req, res) => {
    try {
      const knowledgeAreas = await storage.getKnowledgeAreas();
      res.json(knowledgeAreas);
    } catch (error) {
      res.status(500).json({ message: "Error fetching knowledge areas" });
    }
  });

  app.post("/api/knowledge-areas", async (req, res) => {
    try {
      const validatedData = insertKnowledgeAreaSchema.parse(req.body);
      const knowledgeArea = await storage.createKnowledgeArea(validatedData);
      res.status(201).json(knowledgeArea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/knowledge-areas/:id", async (req, res) => {
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
  });

  app.delete("/api/knowledge-areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteKnowledgeArea(id);
      if (!deleted) {
        return res.status(404).json({ message: "Knowledge area not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting knowledge area" });
    }
  });

  // Skill Categories
  app.get("/api/skill-categories", async (req, res) => {
    try {
      const categories = await storage.getSkillCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill categories" });
    }
  });

  app.post("/api/skill-categories", async (req, res) => {
    try {
      const validatedData = insertSkillCategorySchema.parse(req.body);
      const category = await storage.createSkillCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/skill-categories/:id", async (req, res) => {
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
  });

  app.delete("/api/skill-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSkillCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Skill category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill category" });
    }
  });

  // Skills
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.patch("/api/skills/:id", async (req, res) => {
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
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSkill(id);
      if (!deleted) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill" });
    }
  });

  // Scales
  app.get("/api/scales", async (req, res) => {
    try {
      const scales = await storage.getScales();
      res.json(scales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scales" });
    }
  });

  app.post("/api/scales", async (req, res) => {
    try {
      const validatedData = insertScaleSchema.parse(req.body);
      const scale = await storage.createScale(validatedData);
      res.status(201).json(scale);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/scales/:id", async (req, res) => {
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
  });

  app.delete("/api/scales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteScale(id);
      if (!deleted) {
        return res.status(404).json({ message: "Scale not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting scale" });
    }
  });

  // Get scales by category
  app.get("/api/scales/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const scales = await storage.getScalesByCategory(categoryId);
      res.json(scales);
    } catch (error) {
      console.error("Failed to get scales by category:", error);
      res.status(500).json({ error: "Failed to get scales by category" });
    }
  });

  // Members
  app.get("/api/members", async (req, res) => {
    try {
      const { name, knowledgeArea, category, skill, client } = req.query;
      const filters = {
        name: name as string,
        knowledgeArea: knowledgeArea as string,
        category: category as string,
        skill: skill as string,
        client: client as string,
      };
      
      const members = await storage.searchMembers(filters);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Error fetching members" });
    }
  });

  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Error fetching member" });
    }
  });

  app.post("/api/members", async (req, res) => {
    try {
      console.log("Creating member with data:", req.body);
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : null,
        location: req.body.location || null,
        currentClient: req.body.currentClient || null,
      };
      
      const validatedData = insertMemberSchema.parse(transformedData);
      console.log("Validated data:", validatedData);
      const member = await storage.createMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Member creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating member with data:", req.body);
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : null,
        location: req.body.location || null,
        currentClient: req.body.currentClient || null,
      };
      
      const validatedData = insertMemberSchema.partial().parse(transformedData);
      console.log("Validated data:", validatedData);
      const member = await storage.updateMember(id, validatedData);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Member update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.patch("/api/members/:id", async (req, res) => {
    try {
      console.log("Updating member with data:", req.body);
      const id = parseInt(req.params.id);
      
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : null,
        location: req.body.location || null,
        currentClient: req.body.currentClient || null,
      };
      
      const validatedData = insertMemberSchema.partial().parse(transformedData);
      console.log("Validated update data:", validatedData);
      const member = await storage.updateMember(id, validatedData);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      console.log("Updated member:", member);
      res.json(member);
    } catch (error) {
      console.error("Member update error:", error);
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMember(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting member" });
    }
  });

  // Member Skills
  app.get("/api/members/:memberId/skills", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const skills = await storage.getMemberSkills(memberId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching member skills" });
    }
  });

  app.post("/api/member-skills", async (req, res) => {
    try {
      const validatedData = insertMemberSkillSchema.parse(req.body);
      const memberSkill = await storage.createMemberSkill(validatedData);
      res.status(201).json(memberSkill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/member-skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMemberSkillSchema.partial().parse(req.body);
      const memberSkill = await storage.updateMemberSkill(id, validatedData);
      if (!memberSkill) {
        return res.status(404).json({ message: "Member skill not found" });
      }
      res.json(memberSkill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.delete("/api/member-skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMemberSkill(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member skill not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting member skill" });
    }
  });

  // Member Skills
  app.post("/api/members/:memberId/skills", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid member ID" });
      }
      
      const validatedData = insertMemberSkillSchema.parse({
        ...req.body,
        memberId
      });
      
      const memberSkill = await storage.createMemberSkill(validatedData);
      res.status(201).json(memberSkill);
    } catch (error) {
      console.error("Failed to add member skill:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  // Learning Goals
  app.get("/api/learning-goals", async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const goals = await storage.getLearningGoals(memberId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching learning goals" });
    }
  });

  app.post("/api/learning-goals", async (req, res) => {
    try {
      const validatedData = insertLearningGoalSchema.parse(req.body);
      const goal = await storage.createLearningGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.put("/api/learning-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLearningGoalSchema.partial().parse(req.body);
      const goal = await storage.updateLearningGoal(id, validatedData);
      if (!goal) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.delete("/api/learning-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLearningGoal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting learning goal" });
    }
  });

  // Member Profiles
  app.get("/api/member-profiles/:memberId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching member profile" });
    }
  });

  app.post("/api/member-profiles", async (req, res) => {
    try {
      const validatedData = insertMemberProfileSchema.parse(req.body);
      const profile = await storage.createMemberProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.patch("/api/member-profiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMemberProfileSchema.partial().parse(req.body);
      const profile = await storage.updateMemberProfile(id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.delete("/api/member-profiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMemberProfile ? await storage.deleteMemberProfile(id) : false;
      if (!deleted) {
        return res.status(404).json({ message: "Member profile not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting member profile" });
    }
  });

  // Analytics
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  app.get("/api/analytics/company-strengths", async (req, res) => {
    try {
      const strengths = await storage.getCompanyStrengths();
      res.json(strengths);
    } catch (error) {
      res.status(500).json({ message: "Error fetching company strengths" });
    }
  });

  app.get("/api/analytics/skill-gaps", async (req, res) => {
    try {
      const gaps = await storage.getSkillGaps();
      res.json(gaps);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill gaps" });
    }
  });

  // Excel Import
  app.post("/api/members/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Basic Excel import simulation - in real implementation would use ExcelJS
      res.json({ message: "Import functionality would be implemented here with ExcelJS" });
    } catch (error) {
      res.status(500).json({ message: "Error importing file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
