import { Request, Response } from "express";
import { storage } from "../storage";
import { insertMemberSchema, insertMemberProfileSchema, insertMemberSkillSchema } from "@shared/schema";

export class MembersController {
  static async getAll(req: Request, res: Response) {
    try {
      const { name, category, client, skills } = req.query;
      
      const filters: any = {};
      if (name) filters.name = name as string;
      if (category) filters.category = category as string;
      if (client) filters.client = client as string;
      if (skills) filters.skills = (skills as string).split(',');

      if (Object.keys(filters).length > 0) {
        const members = await storage.searchMembers(filters);
        return res.json(members);
      }

      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Error fetching members" });
    }
  }

  static async getById(req: Request, res: Response) {
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
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, email, profilePicture, hireDate, currentClient, category, location } = req.body;
      
      // Find or create client, category, and location IDs
      const clients = await storage.getClients();
      const categories = await storage.getCategories();
      const locations = await storage.getLocations();
      
      let currentClientId = null;
      if (currentClient) {
        const existingClient = clients.find(c => c.name === currentClient);
        if (existingClient) {
          currentClientId = existingClient.id;
        }
      }
      
      let categoryId = null;
      if (category) {
        const existingCategory = categories.find(c => c.name === category);
        if (existingCategory) {
          categoryId = existingCategory.id;
        }
      }
      
      let locationId = null;
      if (location) {
        const existingLocation = locations.find(l => l.name === location);
        if (existingLocation) {
          locationId = existingLocation.id;
        }
      }
      
      const memberData = {
        name,
        email,
        profilePicture: profilePicture || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        currentClientId,
        categoryId,
        locationId,
      };
      
      const validatedData = insertMemberSchema.parse(memberData);
      const member = await storage.createMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log(`===== UPDATE MEMBER ${id} START =====`);
      console.log(`Request method: ${req.method}`);
      console.log(`Request URL: ${req.url}`);
      console.log(`Request body:`, req.body);
      
      // Transform hireDate string to Date object if present
      const requestData = { ...req.body };
      if (requestData.hireDate && typeof requestData.hireDate === 'string') {
        requestData.hireDate = new Date(requestData.hireDate);
      }
      
      console.log('Transformed request data:', requestData);
      const validatedData = insertMemberSchema.partial().parse(requestData);
      console.log('Validated data:', validatedData);
      
      const member = await storage.updateMember(id, validatedData);
      if (!member) {
        console.log(`Member ${id} not found`);
        return res.status(404).json({ message: "Member not found" });
      }
      
      console.log('Updated member response:', JSON.stringify(member, null, 2));
      res.json(member);
    } catch (error) {
      console.error('Member update error:', error);
      if (error instanceof Error) {
        return res.status(400).json({ 
          message: "Invalid data provided", 
          error: error.message
        });
      }
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMember(id);
      if (!success) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting member" });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching member profile" });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const validatedData = insertMemberProfileSchema.parse(req.body);
      
      const existingProfile = await storage.getMemberProfile(memberId);
      if (existingProfile) {
        const updated = await storage.updateMemberProfile(existingProfile.id, validatedData);
        return res.json(updated);
      } else {
        const profile = await storage.createMemberProfile({ ...validatedData, memberId });
        return res.status(201).json(profile);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async getSkills(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const skills = await storage.getMemberSkills(memberId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching member skills" });
    }
  }

  static async addSkill(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const validatedData = insertMemberSkillSchema.parse({ ...req.body, memberId });
      const memberSkill = await storage.createMemberSkill(validatedData);
      res.status(201).json(memberSkill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async updateSkill(req: Request, res: Response) {
    try {
      const skillId = parseInt(req.params.skillId);
      const validatedData = insertMemberSkillSchema.partial().parse(req.body);
      const memberSkill = await storage.updateMemberSkill(skillId, validatedData);
      if (!memberSkill) {
        return res.status(404).json({ message: "Member skill not found" });
      }
      res.json(memberSkill);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  }

  static async deleteSkill(req: Request, res: Response) {
    try {
      const skillId = parseInt(req.params.skillId);
      const success = await storage.deleteMemberSkill(skillId);
      if (!success) {
        return res.status(404).json({ message: "Member skill not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting member skill" });
    }
  }

  // Assignment management endpoints
  static async addAssignment(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const { title, description, clientId, startDate, endDate, status } = req.body;
      
      // Validate required fields
      if (!title || !clientId || !startDate) {
        return res.status(400).json({ 
          message: "Title, client, and start date are required" 
        });
      }

      // Get or create member profile
      let profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        profile = await storage.createMemberProfile({ 
          memberId,
          assignments: [],
          roles: [],
          appreciations: [],
          feedbackComments: [],
          clientHistory: []
        });
      }

      // Create new assignment
      const newAssignment = {
        id: Date.now().toString(), // Simple ID generation
        title,
        description: description || '',
        clientId: parseInt(clientId),
        startDate,
        endDate: endDate || undefined,
        status: status || 'Active'
      };

      // Add assignment to profile
      const updatedAssignments = [...(profile.assignments || []), newAssignment];
      await storage.updateMemberProfile(profile.id, { 
        assignments: updatedAssignments 
      });

      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Add assignment error:', error);
      res.status(500).json({ message: "Error adding assignment" });
    }
  }

  static async updateAssignment(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const assignmentId = req.params.assignmentId;
      const { title, description, clientId, startDate, endDate, status } = req.body;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const assignments = profile.assignments || [];
      const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
      
      if (assignmentIndex === -1) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Update assignment
      assignments[assignmentIndex] = {
        ...assignments[assignmentIndex],
        title: title || assignments[assignmentIndex].title,
        description: description !== undefined ? description : assignments[assignmentIndex].description,
        clientId: clientId ? parseInt(clientId) : assignments[assignmentIndex].clientId,
        startDate: startDate || assignments[assignmentIndex].startDate,
        endDate: endDate !== undefined ? endDate : assignments[assignmentIndex].endDate,
        status: status || assignments[assignmentIndex].status
      };

      await storage.updateMemberProfile(profile.id, { assignments });
      res.json(assignments[assignmentIndex]);
    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(500).json({ message: "Error updating assignment" });
    }
  }

  static async deleteAssignment(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const assignmentId = req.params.assignmentId;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const assignments = profile.assignments || [];
      const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
      
      if (assignments.length === updatedAssignments.length) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      await storage.updateMemberProfile(profile.id, { 
        assignments: updatedAssignments 
      });

      res.status(204).send();
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ message: "Error deleting assignment" });
    }
  }

  // Role CRUD operations
  static async addRole(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const { title, description, skills } = req.body;

      let profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        profile = await storage.createMemberProfile({ 
          memberId,
          assignments: [],
          roles: [],
          appreciations: [],
          feedbackComments: [],
          clientHistory: []
        });
      }

      const newRole = {
        id: Date.now().toString(),
        title,
        description: description || '',
        skills: skills || []
      };

      const updatedRoles = [...(profile.roles || []), newRole];
      await storage.updateMemberProfile(profile.id, { roles: updatedRoles });

      res.json(newRole);
    } catch (error) {
      console.error('Add role error:', error);
      res.status(500).json({ message: "Error adding role" });
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const roleId = req.params.roleId;
      const { title, description, skills } = req.body;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const roles = profile.roles || [];
      const roleIndex = roles.findIndex(r => r.id === roleId);
      
      if (roleIndex === -1) {
        return res.status(404).json({ message: "Role not found" });
      }

      roles[roleIndex] = {
        ...roles[roleIndex],
        title: title || roles[roleIndex].title,
        description: description !== undefined ? description : roles[roleIndex].description,
        skills: skills !== undefined ? skills : roles[roleIndex].skills
      };

      await storage.updateMemberProfile(profile.id, { roles });
      res.json(roles[roleIndex]);
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ message: "Error updating role" });
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const roleId = req.params.roleId;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const roles = profile.roles || [];
      const updatedRoles = roles.filter(r => r.id !== roleId);
      
      if (roles.length === updatedRoles.length) {
        return res.status(404).json({ message: "Role not found" });
      }

      await storage.updateMemberProfile(profile.id, { roles: updatedRoles });
      res.status(204).send();
    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({ message: "Error deleting role" });
    }
  }

  // Appreciation CRUD operations
  static async addAppreciation(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const { clientId, author, message, date, rating } = req.body;

      let profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        profile = await storage.createMemberProfile({ 
          memberId,
          assignments: [],
          roles: [],
          appreciations: [],
          feedbackComments: [],
          clientHistory: []
        });
      }

      const newAppreciation = {
        id: Date.now().toString(),
        clientId,
        author,
        message,
        date,
        ...(rating && { rating })
      };

      const updatedAppreciations = [...(profile.appreciations || []), newAppreciation];
      await storage.updateMemberProfile(profile.id, { appreciations: updatedAppreciations });

      res.json(newAppreciation);
    } catch (error) {
      console.error('Add appreciation error:', error);
      res.status(500).json({ message: "Error adding appreciation" });
    }
  }

  static async updateAppreciation(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const appreciationId = req.params.appreciationId;
      const { clientId, author, message, date, rating } = req.body;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const appreciations = profile.appreciations || [];
      const appreciationIndex = appreciations.findIndex(a => a.id === appreciationId);
      
      if (appreciationIndex === -1) {
        return res.status(404).json({ message: "Appreciation not found" });
      }

      appreciations[appreciationIndex] = {
        ...appreciations[appreciationIndex],
        clientId: clientId || appreciations[appreciationIndex].clientId,
        author: author || appreciations[appreciationIndex].author,
        message: message || appreciations[appreciationIndex].message,
        date: date || appreciations[appreciationIndex].date,
        ...(rating && { rating })
      };

      await storage.updateMemberProfile(profile.id, { appreciations });
      res.json(appreciations[appreciationIndex]);
    } catch (error) {
      console.error('Update appreciation error:', error);
      res.status(500).json({ message: "Error updating appreciation" });
    }
  }

  static async deleteAppreciation(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const appreciationId = req.params.appreciationId;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const appreciations = profile.appreciations || [];
      const updatedAppreciations = appreciations.filter(a => a.id !== appreciationId);
      
      if (appreciations.length === updatedAppreciations.length) {
        return res.status(404).json({ message: "Appreciation not found" });
      }

      await storage.updateMemberProfile(profile.id, { appreciations: updatedAppreciations });
      res.status(204).send();
    } catch (error) {
      console.error('Delete appreciation error:', error);
      res.status(500).json({ message: "Error deleting appreciation" });
    }
  }

  // Feedback CRUD operations
  static async addFeedback(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const { author, comment, date, type } = req.body;

      let profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        profile = await storage.createMemberProfile({ 
          memberId,
          assignments: [],
          roles: [],
          appreciations: [],
          feedbackComments: [],
          clientHistory: []
        });
      }

      const newFeedback = {
        id: Date.now().toString(),
        author,
        comment,
        date,
        type
      };

      const updatedFeedback = [...(profile.feedbackComments || []), newFeedback];
      await storage.updateMemberProfile(profile.id, { feedbackComments: updatedFeedback });

      res.json(newFeedback);
    } catch (error) {
      console.error('Add feedback error:', error);
      res.status(500).json({ message: "Error adding feedback" });
    }
  }

  static async updateFeedback(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const feedbackId = req.params.feedbackId;
      const { author, comment, date, type } = req.body;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const feedback = profile.feedbackComments || [];
      const feedbackIndex = feedback.findIndex(f => f.id === feedbackId);
      
      if (feedbackIndex === -1) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      feedback[feedbackIndex] = {
        ...feedback[feedbackIndex],
        author: author || feedback[feedbackIndex].author,
        comment: comment || feedback[feedbackIndex].comment,
        date: date || feedback[feedbackIndex].date,
        type: type || feedback[feedbackIndex].type
      };

      await storage.updateMemberProfile(profile.id, { feedbackComments: feedback });
      res.json(feedback[feedbackIndex]);
    } catch (error) {
      console.error('Update feedback error:', error);
      res.status(500).json({ message: "Error updating feedback" });
    }
  }

  static async deleteFeedback(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const feedbackId = req.params.feedbackId;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const feedback = profile.feedbackComments || [];
      const updatedFeedback = feedback.filter(f => f.id !== feedbackId);
      
      if (feedback.length === updatedFeedback.length) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      await storage.updateMemberProfile(profile.id, { feedbackComments: updatedFeedback });
      res.status(204).send();
    } catch (error) {
      console.error('Delete feedback error:', error);
      res.status(500).json({ message: "Error deleting feedback" });
    }
  }

  // Client History CRUD operations
  static async addClientHistory(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const { clientId, startDate, endDate, role, status, projects } = req.body;

      let profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        profile = await storage.createMemberProfile({ 
          memberId,
          assignments: [],
          roles: [],
          appreciations: [],
          feedbackComments: [],
          clientHistory: []
        });
      }

      const newClientHistory = {
        id: Date.now().toString(),
        clientId,
        startDate,
        ...(endDate && { endDate }),
        role,
        status,
        ...(projects && { projects })
      };

      const updatedClientHistory = [...(profile.clientHistory || []), newClientHistory];
      await storage.updateMemberProfile(profile.id, { clientHistory: updatedClientHistory });

      res.json(newClientHistory);
    } catch (error) {
      console.error('Add client history error:', error);
      res.status(500).json({ message: "Error adding client history" });
    }
  }

  static async updateClientHistory(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const clientHistoryId = req.params.clientHistoryId;
      const { clientId, startDate, endDate, role, status, projects } = req.body;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const clientHistory = profile.clientHistory || [];
      const historyIndex = clientHistory.findIndex(h => h.id === clientHistoryId);
      
      if (historyIndex === -1) {
        return res.status(404).json({ message: "Client history not found" });
      }

      clientHistory[historyIndex] = {
        ...clientHistory[historyIndex],
        clientId: clientId || clientHistory[historyIndex].clientId,
        startDate: startDate || clientHistory[historyIndex].startDate,
        ...(endDate !== undefined && { endDate }),
        role: role || clientHistory[historyIndex].role,
        status: status || clientHistory[historyIndex].status,
        ...(projects !== undefined && { projects })
      };

      await storage.updateMemberProfile(profile.id, { clientHistory });
      res.json(clientHistory[historyIndex]);
    } catch (error) {
      console.error('Update client history error:', error);
      res.status(500).json({ message: "Error updating client history" });
    }
  }

  static async deleteClientHistory(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.id);
      const clientHistoryId = req.params.clientHistoryId;

      const profile = await storage.getMemberProfile(memberId);
      if (!profile) {
        return res.status(404).json({ message: "Member profile not found" });
      }

      const clientHistory = profile.clientHistory || [];
      const updatedClientHistory = clientHistory.filter(h => h.id !== clientHistoryId);
      
      if (clientHistory.length === updatedClientHistory.length) {
        return res.status(404).json({ message: "Client history not found" });
      }

      await storage.updateMemberProfile(profile.id, { clientHistory: updatedClientHistory });
      res.status(204).send();
    } catch (error) {
      console.error('Delete client history error:', error);
      res.status(500).json({ message: "Error deleting client history" });
    }
  }
}