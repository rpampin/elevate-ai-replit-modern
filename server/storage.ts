import {
  knowledgeAreas, skillCategories, skills, scales, members, memberProfiles, 
  memberSkills, learningGoals,
  type KnowledgeArea, type InsertKnowledgeArea,
  type SkillCategory, type InsertSkillCategory,
  type Skill, type InsertSkill,
  type Scale, type InsertScale,
  type Member, type InsertMember,
  type MemberProfile, type InsertMemberProfile,
  type MemberSkill, type InsertMemberSkill,
  type LearningGoal, type InsertLearningGoal,
  type MemberWithSkills, type SkillWithDetails
} from "@shared/schema";

export interface IStorage {
  // Knowledge Areas
  getKnowledgeAreas(): Promise<KnowledgeArea[]>;
  getKnowledgeArea(id: number): Promise<KnowledgeArea | undefined>;
  createKnowledgeArea(data: InsertKnowledgeArea): Promise<KnowledgeArea>;
  updateKnowledgeArea(id: number, data: Partial<InsertKnowledgeArea>): Promise<KnowledgeArea | undefined>;
  deleteKnowledgeArea(id: number): Promise<boolean>;

  // Skill Categories
  getSkillCategories(): Promise<SkillCategory[]>;
  getSkillCategory(id: number): Promise<SkillCategory | undefined>;
  createSkillCategory(data: InsertSkillCategory): Promise<SkillCategory>;
  updateSkillCategory(id: number, data: Partial<InsertSkillCategory>): Promise<SkillCategory | undefined>;
  deleteSkillCategory(id: number): Promise<boolean>;

  // Skills
  getSkills(): Promise<SkillWithDetails[]>;
  getSkill(id: number): Promise<SkillWithDetails | undefined>;
  createSkill(data: InsertSkill): Promise<Skill>;
  updateSkill(id: number, data: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;

  // Scales
  getScales(): Promise<Scale[]>;
  getScale(id: number): Promise<Scale | undefined>;
  getScalesByCategory(categoryId: number): Promise<Scale[]>;
  createScale(data: InsertScale): Promise<Scale>;
  updateScale(id: number, data: Partial<InsertScale>): Promise<Scale | undefined>;
  deleteScale(id: number): Promise<boolean>;

  // Members
  getMembers(): Promise<MemberWithSkills[]>;
  getMember(id: number): Promise<MemberWithSkills | undefined>;
  createMember(data: InsertMember): Promise<Member>;
  updateMember(id: number, data: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<boolean>;

  // Member Profiles
  getMemberProfile(memberId: number): Promise<MemberProfile | undefined>;
  createMemberProfile(data: InsertMemberProfile): Promise<MemberProfile>;
  updateMemberProfile(id: number, data: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined>;
  deleteMemberProfile(id: number): Promise<boolean>;

  // Member Skills
  getMemberSkills(memberId: number): Promise<(MemberSkill & { skill: Skill })[]>;
  createMemberSkill(data: InsertMemberSkill): Promise<MemberSkill>;
  updateMemberSkill(id: number, data: Partial<InsertMemberSkill>): Promise<MemberSkill | undefined>;
  deleteMemberSkill(id: number): Promise<boolean>;

  // Learning Goals
  getLearningGoals(memberId?: number): Promise<(LearningGoal & { skill: Skill; member: Member })[]>;
  createLearningGoal(data: InsertLearningGoal): Promise<LearningGoal>;
  updateLearningGoal(id: number, data: Partial<InsertLearningGoal>): Promise<LearningGoal | undefined>;
  deleteLearningGoal(id: number): Promise<boolean>;

  // Analytics
  getCompanyStrengths(): Promise<{ name: string; count: number; percentage: number }[]>;
  getSkillGaps(): Promise<{ name: string; count: number; percentage: number }[]>;
  getStats(): Promise<{
    totalMembers: number;
    activeSkills: number;
    talentPool: number;
    learningGoals: number;
  }>;

  // Search and filtering
  searchMembers(filters: {
    name?: string;
    knowledgeArea?: string;
    category?: string;
    skill?: string;
    client?: string;
  }): Promise<MemberWithSkills[]>;
}

export class MemStorage implements IStorage {
  private knowledgeAreasData: Map<number, KnowledgeArea> = new Map();
  private skillCategoriesData: Map<number, SkillCategory> = new Map();
  private skillsData: Map<number, Skill> = new Map();
  private scalesData: Map<number, Scale> = new Map();
  private membersData: Map<number, Member> = new Map();
  private memberProfilesData: Map<number, MemberProfile> = new Map();
  private memberSkillsData: Map<number, MemberSkill> = new Map();
  private learningGoalsData: Map<number, LearningGoal> = new Map();
  
  private currentKnowledgeAreaId = 1;
  private currentSkillCategoryId = 1;
  private currentSkillId = 1;
  private currentScaleId = 1;
  private currentMemberId = 1;
  private currentMemberProfileId = 1;
  private currentMemberSkillId = 1;
  private currentLearningGoalId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize Scales
    const scales = [
      { id: 1, name: "Experience Level", type: "qualitative" as const, values: ["Beginner", "Intermediate", "Advanced", "Expert"] },
      { id: 2, name: "Skill Proficiency", type: "numeric" as const, values: ["1", "2", "3", "4", "5"] },
      { id: 3, name: "Project Complexity", type: "qualitative" as const, values: ["Simple", "Moderate", "Complex", "Enterprise"] },
      { id: 4, name: "Teaching Ability", type: "qualitative" as const, values: ["Learner", "Helper", "Mentor", "Expert Trainer"] }
    ];
    scales.forEach(scale => this.scalesData.set(scale.id, scale));
    this.currentScaleId = 5;

    // Initialize Knowledge Areas
    const knowledgeAreas = [
      { id: 1, name: "Programming & Development", description: "Software development, coding languages, and programming paradigms" },
      { id: 2, name: "Data Engineering & Analytics", description: "Data processing, analytics, and business intelligence" },
      { id: 3, name: "Cloud Computing & Infrastructure", description: "Cloud platforms, infrastructure as code, and distributed systems" },
      { id: 4, name: "DevOps & Site Reliability", description: "Continuous integration, deployment, monitoring, and system reliability" },
      { id: 5, name: "Cybersecurity", description: "Information security, threat analysis, and security implementation" },
      { id: 6, name: "Mobile Development", description: "Mobile application development for iOS, Android, and cross-platform" },
      { id: 7, name: "Web Development", description: "Frontend, backend, and full-stack web application development" },
      { id: 8, name: "Database Management", description: "Database design, administration, and optimization" },
      { id: 9, name: "Artificial Intelligence & ML", description: "Machine learning, deep learning, and AI implementation" },
      { id: 10, name: "Project Management", description: "Project planning, execution, and team coordination" },
      { id: 11, name: "Business Analysis", description: "Requirements gathering, process improvement, and business strategy" },
      { id: 12, name: "User Experience Design", description: "UX/UI design, user research, and design thinking" }
    ];
    knowledgeAreas.forEach(area => this.knowledgeAreasData.set(area.id, area));
    this.currentKnowledgeAreaId = 13;

    // Initialize Skill Categories
    const categories = [
      { id: 1, name: "Language", criteria: "Programming languages and scripting languages" },
      { id: 2, name: "Framework", criteria: "Development frameworks and libraries" },
      { id: 3, name: "Tool", criteria: "Development tools, IDEs, and productivity software" },
      { id: 4, name: "Database", criteria: "Database systems and data storage technologies" },
      { id: 5, name: "Cloud Platform", criteria: "Cloud service providers and platforms" },
      { id: 6, name: "Methodology", criteria: "Development methodologies and processes" },
      { id: 7, name: "Architecture", criteria: "System architecture and design patterns" },
      { id: 8, name: "Testing", criteria: "Testing frameworks, tools, and methodologies" },
      { id: 9, name: "Security", criteria: "Security tools, practices, and frameworks" },
      { id: 10, name: "DevOps", criteria: "DevOps tools and practices" },
      { id: 11, name: "Communication", criteria: "Communication and collaboration skills" },
      { id: 12, name: "Leadership", criteria: "Leadership and management capabilities" }
    ];
    categories.forEach(category => this.skillCategoriesData.set(category.id, category));
    this.currentSkillCategoryId = 13;

    // Initialize Skills
    const skills = [
      // Programming Languages
      { id: 1, name: "JavaScript", purpose: "Web development and full-stack applications", categoryId: 1, knowledgeAreaId: 7 },
      { id: 2, name: "Python", purpose: "Backend development, data science, and automation", categoryId: 1, knowledgeAreaId: 1 },
      { id: 3, name: "Java", purpose: "Enterprise applications and backend systems", categoryId: 1, knowledgeAreaId: 1 },
      { id: 4, name: "TypeScript", purpose: "Type-safe JavaScript development", categoryId: 1, knowledgeAreaId: 7 },
      { id: 5, name: "C#", purpose: ".NET development and enterprise applications", categoryId: 1, knowledgeAreaId: 1 },
      { id: 6, name: "Go", purpose: "High-performance backend services", categoryId: 1, knowledgeAreaId: 1 },
      { id: 7, name: "Rust", purpose: "System programming and performance-critical applications", categoryId: 1, knowledgeAreaId: 1 },
      { id: 8, name: "Swift", purpose: "iOS and macOS application development", categoryId: 1, knowledgeAreaId: 6 },
      { id: 9, name: "Kotlin", purpose: "Android development and JVM applications", categoryId: 1, knowledgeAreaId: 6 },

      // Frameworks
      { id: 10, name: "React", purpose: "Frontend user interface development", categoryId: 2, knowledgeAreaId: 7 },
      { id: 11, name: "Angular", purpose: "Enterprise frontend applications", categoryId: 2, knowledgeAreaId: 7 },
      { id: 12, name: "Vue.js", purpose: "Progressive frontend development", categoryId: 2, knowledgeAreaId: 7 },
      { id: 13, name: "Node.js", purpose: "Server-side JavaScript applications", categoryId: 2, knowledgeAreaId: 7 },
      { id: 14, name: "Django", purpose: "Python web application development", categoryId: 2, knowledgeAreaId: 1 },
      { id: 15, name: "Spring Boot", purpose: "Java enterprise application development", categoryId: 2, knowledgeAreaId: 1 },
      { id: 16, name: "React Native", purpose: "Cross-platform mobile development", categoryId: 2, knowledgeAreaId: 6 },
      { id: 17, name: "Flutter", purpose: "Cross-platform mobile and web development", categoryId: 2, knowledgeAreaId: 6 },

      // Cloud Platforms
      { id: 18, name: "AWS", purpose: "Amazon Web Services cloud platform", categoryId: 5, knowledgeAreaId: 3 },
      { id: 19, name: "Azure", purpose: "Microsoft Azure cloud platform", categoryId: 5, knowledgeAreaId: 3 },
      { id: 20, name: "Google Cloud Platform", purpose: "Google's cloud computing services", categoryId: 5, knowledgeAreaId: 3 },

      // Databases
      { id: 21, name: "PostgreSQL", purpose: "Advanced relational database management", categoryId: 4, knowledgeAreaId: 8 },
      { id: 22, name: "MongoDB", purpose: "NoSQL document database", categoryId: 4, knowledgeAreaId: 8 },
      { id: 23, name: "Redis", purpose: "In-memory data structure store", categoryId: 4, knowledgeAreaId: 8 },
      { id: 24, name: "MySQL", purpose: "Popular relational database system", categoryId: 4, knowledgeAreaId: 8 },

      // DevOps Tools
      { id: 25, name: "Docker", purpose: "Containerization and deployment", categoryId: 10, knowledgeAreaId: 4 },
      { id: 26, name: "Kubernetes", purpose: "Container orchestration", categoryId: 10, knowledgeAreaId: 4 },
      { id: 27, name: "Jenkins", purpose: "Continuous integration and deployment", categoryId: 10, knowledgeAreaId: 4 },
      { id: 28, name: "GitLab CI/CD", purpose: "Integrated DevOps platform", categoryId: 10, knowledgeAreaId: 4 },

      // Development Tools
      { id: 29, name: "Git", purpose: "Version control and collaboration", categoryId: 3, knowledgeAreaId: 1 },
      { id: 30, name: "VS Code", purpose: "Code editor and development environment", categoryId: 3, knowledgeAreaId: 1 },
      { id: 31, name: "IntelliJ IDEA", purpose: "Java and multi-language IDE", categoryId: 3, knowledgeAreaId: 1 },
      { id: 32, name: "Figma", purpose: "UI/UX design and prototyping", categoryId: 3, knowledgeAreaId: 12 },

      // Testing
      { id: 33, name: "Jest", purpose: "JavaScript testing framework", categoryId: 8, knowledgeAreaId: 7 },
      { id: 34, name: "Cypress", purpose: "End-to-end testing", categoryId: 8, knowledgeAreaId: 7 },
      { id: 35, name: "JUnit", purpose: "Java unit testing framework", categoryId: 8, knowledgeAreaId: 1 },

      // Methodologies
      { id: 36, name: "Agile", purpose: "Iterative software development methodology", categoryId: 6, knowledgeAreaId: 10 },
      { id: 37, name: "Scrum", purpose: "Agile project management framework", categoryId: 6, knowledgeAreaId: 10 },
      { id: 38, name: "DevOps", purpose: "Development and operations integration", categoryId: 6, knowledgeAreaId: 4 },

      // Architecture
      { id: 39, name: "Microservices", purpose: "Distributed system architecture", categoryId: 7, knowledgeAreaId: 1 },
      { id: 40, name: "RESTful APIs", purpose: "Web service architecture", categoryId: 7, knowledgeAreaId: 7 },
      { id: 41, name: "GraphQL", purpose: "Query language for APIs", categoryId: 7, knowledgeAreaId: 7 },

      // AI/ML
      { id: 42, name: "TensorFlow", purpose: "Machine learning framework", categoryId: 2, knowledgeAreaId: 9 },
      { id: 43, name: "PyTorch", purpose: "Deep learning framework", categoryId: 2, knowledgeAreaId: 9 },
      { id: 44, name: "Scikit-learn", purpose: "Machine learning library for Python", categoryId: 2, knowledgeAreaId: 9 },

      // Soft Skills
      { id: 45, name: "Technical Communication", purpose: "Explaining technical concepts clearly", categoryId: 11, knowledgeAreaId: 10 },
      { id: 46, name: "Team Leadership", purpose: "Leading and motivating development teams", categoryId: 12, knowledgeAreaId: 10 },
      { id: 47, name: "Mentoring", purpose: "Guiding junior developers", categoryId: 12, knowledgeAreaId: 10 },
      { id: 48, name: "Client Presentation", purpose: "Presenting solutions to stakeholders", categoryId: 11, knowledgeAreaId: 11 },

      // Security
      { id: 49, name: "OAuth 2.0", purpose: "Authentication and authorization", categoryId: 9, knowledgeAreaId: 5 },
      { id: 50, name: "OWASP", purpose: "Web application security practices", categoryId: 9, knowledgeAreaId: 5 }
    ];
    skills.forEach(skill => this.skillsData.set(skill.id, skill));
    this.currentSkillId = 51;

    // Add sample members with diverse backgrounds
    const members = [
      {
        id: 1,
        fullName: "Ana García López",
        email: "ana.garcia@techietalent.com",
        category: "Builder",
        hireDate: new Date("2023-01-15"),
        currentClient: "Lunavi",
        location: "Madrid, Spain"
      },
      {
        id: 2,
        fullName: "Carlos Rodríguez Martín",
        email: "carlos.rodriguez@techietalent.com",
        category: "Solver",
        hireDate: new Date("2022-06-10"),
        currentClient: "TechCorp",
        location: "Barcelona, Spain"
      },
      {
        id: 3,
        fullName: "María Fernández Silva",
        email: "maria.fernandez@techietalent.com",
        category: "Wizard",
        hireDate: new Date("2021-03-20"),
        currentClient: "InnovateLab",
        location: "Valencia, Spain"
      },
      {
        id: 4,
        fullName: "David Moreno Cruz",
        email: "david.moreno@techietalent.com",
        category: "Starter",
        hireDate: new Date("2024-01-08"),
        currentClient: "Talent Pool",
        location: "Sevilla, Spain"
      }
    ];
    members.forEach(member => this.membersData.set(member.id, member));
    this.currentMemberId = 5;

    // Add member profiles
    const profiles = [
      {
        id: 1,
        memberId: 1,
        assignments: ["Frontend Development", "UI/UX Consulting", "React Migration"],
        roles: ["Senior Frontend Developer", "Technical Lead"],
        appreciations: ["Outstanding Q1 Performance", "Client Satisfaction Award", "Innovation Champion"],
        feedbackComments: ["Excellent technical skills in React", "Great mentor for junior developers", "Strong problem-solving abilities"],
        talentPoolPeriods: ["2023-Q1"]
      },
      {
        id: 2,
        memberId: 2,
        assignments: ["Backend API Development", "Database Optimization", "Cloud Migration"],
        roles: ["Senior Backend Developer", "DevOps Specialist"],
        appreciations: ["Performance Optimization Expert", "Team Player Award"],
        feedbackComments: ["Deep knowledge of cloud architecture", "Reliable and efficient", "Excellent debugging skills"],
        talentPoolPeriods: []
      },
      {
        id: 3,
        memberId: 3,
        assignments: ["Technical Architecture", "Team Leadership", "Strategic Planning"],
        roles: ["Tech Lead", "Solution Architect", "Delivery Manager"],
        appreciations: ["Leadership Excellence", "Strategic Vision Award", "Client Trust Builder"],
        feedbackComments: ["Outstanding leadership capabilities", "Excellent client relationship management", "Strategic thinking"],
        talentPoolPeriods: []
      },
      {
        id: 4,
        memberId: 4,
        assignments: ["Junior Development", "Learning Program", "Code Reviews"],
        roles: ["Junior Developer", "Trainee"],
        appreciations: ["Fast Learner Award", "Best Newcomer"],
        feedbackComments: ["Eager to learn", "Great potential", "Collaborative attitude"],
        talentPoolPeriods: ["2024-Q1"]
      }
    ];
    profiles.forEach(profile => this.memberProfilesData.set(profile.id, profile));
    this.currentMemberProfileId = 5;

    // Add member skills with realistic distributions
    const memberSkills = [
      // Ana García (React Frontend Expert)
      { id: 1, memberId: 1, skillId: 1, level: "Expert", scaleId: 1 }, // JavaScript
      { id: 2, memberId: 1, skillId: 4, level: "Advanced", scaleId: 1 }, // TypeScript
      { id: 3, memberId: 1, skillId: 10, level: "Expert", scaleId: 1 }, // React
      { id: 4, memberId: 1, skillId: 32, level: "Advanced", scaleId: 1 }, // Figma
      { id: 5, memberId: 1, skillId: 45, level: "Advanced", scaleId: 1 }, // Technical Communication

      // Carlos Rodríguez (Backend & DevOps)
      { id: 6, memberId: 2, skillId: 2, level: "Expert", scaleId: 1 }, // Python
      { id: 7, memberId: 2, skillId: 3, level: "Advanced", scaleId: 1 }, // Java
      { id: 8, memberId: 2, skillId: 18, level: "Advanced", scaleId: 1 }, // AWS
      { id: 9, memberId: 2, skillId: 25, level: "Expert", scaleId: 1 }, // Docker
      { id: 10, memberId: 2, skillId: 21, level: "Advanced", scaleId: 1 }, // PostgreSQL

      // María Fernández (Full-stack Architect)
      { id: 11, memberId: 3, skillId: 39, level: "Expert", scaleId: 1 }, // Microservices
      { id: 12, memberId: 3, skillId: 46, level: "Expert", scaleId: 1 }, // Team Leadership
      { id: 13, memberId: 3, skillId: 36, level: "Expert", scaleId: 1 }, // Agile
      { id: 14, memberId: 3, skillId: 1, level: "Expert", scaleId: 1 }, // JavaScript
      { id: 15, memberId: 3, skillId: 2, level: "Advanced", scaleId: 1 }, // Python

      // David Moreno (Junior Developer)
      { id: 16, memberId: 4, skillId: 1, level: "Intermediate", scaleId: 1 }, // JavaScript
      { id: 17, memberId: 4, skillId: 10, level: "Beginner", scaleId: 1 }, // React
      { id: 18, memberId: 4, skillId: 29, level: "Intermediate", scaleId: 1 }, // Git
      { id: 19, memberId: 4, skillId: 30, level: "Intermediate", scaleId: 1 } // VS Code
    ];
    memberSkills.forEach(skill => this.memberSkillsData.set(skill.id, skill));
    this.currentMemberSkillId = 20;

    // Add learning goals
    const learningGoals = [
      {
        id: 1,
        memberId: 1,
        skillId: 42, // TensorFlow
        targetLevel: "Intermediate",
        description: "Learn machine learning fundamentals to enhance UX with AI-driven features",
        status: "in_progress",
        createdAt: new Date("2024-01-15")
      },
      {
        id: 2,
        memberId: 2,
        skillId: 26, // Kubernetes
        targetLevel: "Expert",
        description: "Master container orchestration for enterprise-scale deployments",
        status: "in_progress",
        createdAt: new Date("2024-01-20")
      },
      {
        id: 3,
        memberId: 4,
        skillId: 10, // React
        targetLevel: "Advanced",
        description: "Become proficient in React for frontend development projects",
        status: "in_progress",
        createdAt: new Date("2024-02-01")
      },
      {
        id: 4,
        memberId: 4,
        skillId: 4, // TypeScript
        targetLevel: "Intermediate",
        description: "Learn TypeScript to write more maintainable JavaScript code",
        status: "planned",
        createdAt: new Date("2024-02-15")
      }
    ];
    learningGoals.forEach(goal => this.learningGoalsData.set(goal.id, goal));
    this.currentLearningGoalId = 5;
  }

  // Knowledge Areas
  async getKnowledgeAreas(): Promise<KnowledgeArea[]> {
    return Array.from(this.knowledgeAreasData.values());
  }

  async getKnowledgeArea(id: number): Promise<KnowledgeArea | undefined> {
    return this.knowledgeAreasData.get(id);
  }

  async createKnowledgeArea(data: InsertKnowledgeArea): Promise<KnowledgeArea> {
    const id = this.currentKnowledgeAreaId++;
    const knowledgeArea: KnowledgeArea = { ...data, id };
    this.knowledgeAreasData.set(id, knowledgeArea);
    return knowledgeArea;
  }

  async updateKnowledgeArea(id: number, data: Partial<InsertKnowledgeArea>): Promise<KnowledgeArea | undefined> {
    const existing = this.knowledgeAreasData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.knowledgeAreasData.set(id, updated);
    return updated;
  }

  async deleteKnowledgeArea(id: number): Promise<boolean> {
    return this.knowledgeAreasData.delete(id);
  }

  // Skill Categories
  async getSkillCategories(): Promise<SkillCategory[]> {
    return Array.from(this.skillCategoriesData.values());
  }

  async getSkillCategory(id: number): Promise<SkillCategory | undefined> {
    return this.skillCategoriesData.get(id);
  }

  async createSkillCategory(data: InsertSkillCategory): Promise<SkillCategory> {
    const id = this.currentSkillCategoryId++;
    const category: SkillCategory = { ...data, id };
    this.skillCategoriesData.set(id, category);
    return category;
  }

  async updateSkillCategory(id: number, data: Partial<InsertSkillCategory>): Promise<SkillCategory | undefined> {
    const existing = this.skillCategoriesData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.skillCategoriesData.set(id, updated);
    return updated;
  }

  async deleteSkillCategory(id: number): Promise<boolean> {
    return this.skillCategoriesData.delete(id);
  }

  // Skills
  async getSkills(): Promise<SkillWithDetails[]> {
    return Array.from(this.skillsData.values()).map(skill => ({
      ...skill,
      category: skill.categoryId ? this.skillCategoriesData.get(skill.categoryId) : undefined,
      knowledgeArea: skill.knowledgeAreaId ? this.knowledgeAreasData.get(skill.knowledgeAreaId) : undefined,
    }));
  }

  async getSkill(id: number): Promise<SkillWithDetails | undefined> {
    const skill = this.skillsData.get(id);
    if (!skill) return undefined;
    return {
      ...skill,
      category: skill.categoryId ? this.skillCategoriesData.get(skill.categoryId) : undefined,
      knowledgeArea: skill.knowledgeAreaId ? this.knowledgeAreasData.get(skill.knowledgeAreaId) : undefined,
    };
  }

  async createSkill(data: InsertSkill): Promise<Skill> {
    const id = this.currentSkillId++;
    const skill: Skill = { ...data, id };
    this.skillsData.set(id, skill);
    return skill;
  }

  async updateSkill(id: number, data: Partial<InsertSkill>): Promise<Skill | undefined> {
    const existing = this.skillsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.skillsData.set(id, updated);
    return updated;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skillsData.delete(id);
  }

  // Scales
  async getScales(): Promise<Scale[]> {
    return Array.from(this.scalesData.values());
  }

  async getScale(id: number): Promise<Scale | undefined> {
    return this.scalesData.get(id);
  }

  async getScalesByCategory(categoryId: number): Promise<Scale[]> {
    const scales = Array.from(this.scalesData.values());
    return scales.filter(scale => scale.categoryId === categoryId);
  }

  async createScale(data: InsertScale): Promise<Scale> {
    const id = this.currentScaleId++;
    const scale: Scale = { ...data, id };
    this.scalesData.set(id, scale);
    return scale;
  }

  async updateScale(id: number, data: Partial<InsertScale>): Promise<Scale | undefined> {
    const existing = this.scalesData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.scalesData.set(id, updated);
    return updated;
  }

  async deleteScale(id: number): Promise<boolean> {
    return this.scalesData.delete(id);
  }

  // Members
  async getMembers(): Promise<MemberWithSkills[]> {
    return Promise.all(
      Array.from(this.membersData.values()).map(async (member) => {
        const profile = Array.from(this.memberProfilesData.values()).find(p => p.memberId === member.id);
        const skills = await this.getMemberSkills(member.id);
        const learningGoals = Array.from(this.learningGoalsData.values())
          .filter(lg => lg.memberId === member.id)
          .map(lg => ({
            ...lg,
            skill: this.skillsData.get(lg.skillId!)!
          }))
          .filter(lg => lg.skill);

        return {
          ...member,
          profile,
          skills,
          learningGoals
        };
      })
    );
  }

  async getMember(id: number): Promise<MemberWithSkills | undefined> {
    const member = this.membersData.get(id);
    if (!member) return undefined;

    const profile = Array.from(this.memberProfilesData.values()).find(p => p.memberId === id);
    const skills = await this.getMemberSkills(id);
    const learningGoals = Array.from(this.learningGoalsData.values())
      .filter(lg => lg.memberId === id)
      .map(lg => ({
        ...lg,
        skill: this.skillsData.get(lg.skillId!)!
      }))
      .filter(lg => lg.skill);

    return {
      ...member,
      profile,
      skills,
      learningGoals
    };
  }

  async createMember(data: InsertMember): Promise<Member> {
    const id = this.currentMemberId++;
    const member: Member = { ...data, id };
    this.membersData.set(id, member);
    return member;
  }

  async updateMember(id: number, data: Partial<InsertMember>): Promise<Member | undefined> {
    const existing = this.membersData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.membersData.set(id, updated);
    return updated;
  }

  async deleteMember(id: number): Promise<boolean> {
    return this.membersData.delete(id);
  }

  // Member Profiles
  async getMemberProfile(memberId: number): Promise<MemberProfile | undefined> {
    return Array.from(this.memberProfilesData.values()).find(p => p.memberId === memberId);
  }

  async createMemberProfile(data: InsertMemberProfile): Promise<MemberProfile> {
    const id = this.currentMemberProfileId++;
    const profile: MemberProfile = { ...data, id };
    this.memberProfilesData.set(id, profile);
    return profile;
  }

  async updateMemberProfile(id: number, data: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined> {
    const existing = this.memberProfilesData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.memberProfilesData.set(id, updated);
    return updated;
  }

  async deleteMemberProfile(id: number): Promise<boolean> {
    return this.memberProfilesData.delete(id);
  }

  // Member Skills
  async getMemberSkills(memberId: number): Promise<(MemberSkill & { skill: Skill })[]> {
    return Array.from(this.memberSkillsData.values())
      .filter(ms => ms.memberId === memberId)
      .map(ms => ({
        ...ms,
        skill: this.skillsData.get(ms.skillId!)!
      }))
      .filter(ms => ms.skill);
  }

  async createMemberSkill(data: InsertMemberSkill): Promise<MemberSkill> {
    const id = this.currentMemberSkillId++;
    const memberSkill: MemberSkill = { ...data, id };
    this.memberSkillsData.set(id, memberSkill);
    return memberSkill;
  }

  async updateMemberSkill(id: number, data: Partial<InsertMemberSkill>): Promise<MemberSkill | undefined> {
    const existing = this.memberSkillsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.memberSkillsData.set(id, updated);
    return updated;
  }

  async deleteMemberSkill(id: number): Promise<boolean> {
    return this.memberSkillsData.delete(id);
  }

  // Learning Goals
  async getLearningGoals(memberId?: number): Promise<(LearningGoal & { skill: Skill; member: Member })[]> {
    return Array.from(this.learningGoalsData.values())
      .filter(lg => !memberId || lg.memberId === memberId)
      .map(lg => ({
        ...lg,
        skill: this.skillsData.get(lg.skillId!)!,
        member: this.membersData.get(lg.memberId!)!
      }))
      .filter(lg => lg.skill && lg.member);
  }

  async createLearningGoal(data: InsertLearningGoal): Promise<LearningGoal> {
    const id = this.currentLearningGoalId++;
    const learningGoal: LearningGoal = { 
      ...data, 
      id, 
      createdAt: new Date()
    };
    this.learningGoalsData.set(id, learningGoal);
    return learningGoal;
  }

  async updateLearningGoal(id: number, data: Partial<InsertLearningGoal>): Promise<LearningGoal | undefined> {
    const existing = this.learningGoalsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.learningGoalsData.set(id, updated);
    return updated;
  }

  async deleteLearningGoal(id: number): Promise<boolean> {
    return this.learningGoalsData.delete(id);
  }

  // Analytics
  async getCompanyStrengths(): Promise<{ name: string; count: number; percentage: number }[]> {
    const skillCounts = new Map<string, number>();
    const totalMembers = this.membersData.size;

    for (const memberSkill of this.memberSkillsData.values()) {
      const skill = this.skillsData.get(memberSkill.skillId!);
      if (skill) {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      }
    }

    return Array.from(skillCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getSkillGaps(): Promise<{ name: string; count: number; percentage: number }[]> {
    const skillCounts = new Map<string, number>();
    const totalMembers = this.membersData.size;

    for (const memberSkill of this.memberSkillsData.values()) {
      const skill = this.skillsData.get(memberSkill.skillId!);
      if (skill) {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      }
    }

    return Array.from(skillCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
      }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);
  }

  async getStats(): Promise<{
    totalMembers: number;
    activeSkills: number;
    talentPool: number;
    learningGoals: number;
  }> {
    const totalMembers = this.membersData.size;
    const activeSkills = new Set(Array.from(this.memberSkillsData.values()).map(ms => ms.skillId)).size;
    const talentPool = Array.from(this.membersData.values()).filter(m => m.currentClient === "Talent Pool").length;
    const learningGoals = Array.from(this.learningGoalsData.values()).filter(lg => lg.status === "active").length;

    return {
      totalMembers,
      activeSkills,
      talentPool,
      learningGoals
    };
  }

  // Search and filtering
  async searchMembers(filters: {
    name?: string;
    knowledgeArea?: string;
    category?: string;
    skill?: string;
    client?: string;
  }): Promise<MemberWithSkills[]> {
    const members = await this.getMembers();
    
    return members.filter(member => {
      if (filters.name && !member.fullName.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      if (filters.category && filters.category !== "all" && member.category !== filters.category) {
        return false;
      }
      
      if (filters.client && filters.client !== "all" && member.currentClient !== filters.client) {
        return false;
      }
      
      if (filters.skill) {
        const hasSkill = member.skills.some(skill => 
          skill.skill.name.toLowerCase().includes(filters.skill!.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      
      if (filters.knowledgeArea && filters.knowledgeArea !== "all") {
        const hasKnowledgeArea = member.skills.some(skill => {
          const knowledgeArea = skill.skill.knowledgeAreaId ? 
            this.knowledgeAreasData.get(skill.skill.knowledgeAreaId) : null;
          return knowledgeArea?.name.toLowerCase().includes(filters.knowledgeArea!.toLowerCase());
        });
        if (!hasKnowledgeArea) return false;
      }
      
      return true;
    });
  }
}

import { JsonStorage } from "./json-storage";

export const storage = new JsonStorage();
