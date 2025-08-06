import { Request, Response } from "express";
import { AIAgentService } from "../services/ai-agent.service";
import { z } from "zod";

const querySchema = z.object({
  query: z.string().min(1, "Query cannot be empty").max(500, "Query too long")
});

export class AIAgentController {
  static async processQuery(req: Request, res: Response) {
    try {
      const { query } = querySchema.parse(req.body);
      
      const result = await AIAgentService.processQuery(query);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid query", 
          errors: error.errors 
        });
      }
      
      console.error('AI Agent query error:', error);
      res.status(500).json({ 
        message: "Failed to process your question. Please try again." 
      });
    }
  }

  static async getSuggestedQuestions(req: Request, res: Response) {
    try {
      const suggestions = await AIAgentService.suggestQuestions();
      res.json({ suggestions });
    } catch (error) {
      console.error('AI suggestions error:', error);
      res.status(500).json({ 
        message: "Failed to get suggested questions",
        suggestions: [
          "Who has the most JavaScript experience?",
          "Which team members are available for new projects?",
          "What are our strongest technical skills?",
          "Who should I assign to a React project?",
          "What skills do we need to develop?"
        ]
      });
    }
  }
}