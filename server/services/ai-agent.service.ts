import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIAgentService {
  static async processQuery(userQuery: string) {
    try {
      // Get all data needed for context
      const [members, skills, skillCategories, knowledgeAreas, learningGoals] = await Promise.all([
        storage.getMembers(),
        storage.getSkills(),
        storage.getSkillCategories(),
        storage.getKnowledgeAreas(),
        storage.getLearningGoals()
      ]);

      // Create a structured context for the AI
      const context = {
        totalMembers: members.length,
        totalSkills: skills.length,
        skillCategories: skillCategories.map((cat: any) => cat.name),
        knowledgeAreas: knowledgeAreas.map((area: any) => area.name),
        memberCategories: Array.from(new Set(members.map((m: any) => m.category))),
        availableMembers: members.filter((m: any) => !m.currentClient).length,
        assignedMembers: members.filter((m: any) => m.currentClient).length
      };

      // Prepare member data for analysis (simplified for AI processing)
      const memberSummaries = members.map((member: any) => ({
        id: member.id,
        name: member.name,
        category: member.category,
        currentClient: member.currentClient || "Available",
        location: member.location,
        skillCount: member.skills?.length || 0,
        topSkills: member.skills?.slice(0, 5)?.map((s: any) => ({
          name: s.skill?.name,
          level: s.level
        })) || [],
        learningGoals: member.learningGoals?.length || 0
      }));

      // Create the AI prompt
      const prompt = `You are an AI assistant for a skills management system called "Techie Skills Radar" for Techie Talent company. 
      
Your role is to help users find information about team members, skills, and talent management insights.

SYSTEM CONTEXT:
- Total team members: ${context.totalMembers}
- Available for assignment: ${context.availableMembers}
- Currently assigned: ${context.assignedMembers}
- Total unique skills: ${context.totalSkills}
- Member categories: ${context.memberCategories.join(', ')}
- Knowledge areas: ${context.knowledgeAreas.join(', ')}
- Skill categories: ${context.skillCategories.join(', ')}

TEAM MEMBERS DATA:
${JSON.stringify(memberSummaries, null, 2)}

USER QUERY: "${userQuery}"

INSTRUCTIONS:
1. Analyze the user's query and provide relevant, specific information based on the actual data
2. If searching for people with specific skills, list names and their skill levels
3. If asked about availability, mention current client assignments
4. If asked about skills gaps or strengths, analyze the data and provide insights
5. Be conversational but professional
6. Include specific member names, numbers, and details when relevant
7. If the query is unclear, ask clarifying questions
8. Format your response in a clear, readable way

Respond with helpful, accurate information based on the real data provided. Be specific and include names, skills, and relevant details.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userQuery }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return {
        response: response.choices[0].message.content,
        queryProcessed: userQuery,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Agent error:', error);
      throw new Error('Failed to process query with AI agent');
    }
  }

  static async suggestQuestions() {
    try {
      const [members, skills] = await Promise.all([
        storage.getMembers(),
        storage.getSkills()
      ]);

      const context = {
        memberCount: members.length,
        skillCount: skills.length,
        topSkills: skills.slice(0, 10).map((s: any) => s.name),
        categories: Array.from(new Set(members.map((m: any) => m.category)))
      };

      const prompt = `Based on a skills management system with ${context.memberCount} team members and ${context.skillCount} skills, suggest 5 helpful questions users might ask. 

Top skills in the system: ${context.topSkills.join(', ')}
Team categories: ${context.categories.join(', ')}

Provide practical questions that would help with talent management, skill assessment, and team planning. Format as a JSON array of strings.

Example format: ["Who has the most experience with React?", "Which developers are available for new projects?"]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      return result.questions || [];

    } catch (error) {
      console.error('AI suggestion error:', error);
      return [
        "Who has the most JavaScript experience?",
        "Which team members are available for new projects?",
        "What are our strongest technical skills as a company?",
        "Who should I assign to a React project?",
        "What skills do we need to develop more?"
      ];
    }
  }
}