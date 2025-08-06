import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  KnowledgeArea, InsertKnowledgeArea, 
  SkillCategory, InsertSkillCategory,
  Skill, InsertSkill, SkillWithDetails,
  Scale, InsertScale,
  Client, InsertClient,
  Category, InsertCategory,
  Location, InsertLocation,
  Member, InsertMember, MemberWithSkills,
  MemberProfile, InsertMemberProfile,
  MemberSkill, InsertMemberSkill,
  LearningGoal, InsertLearningGoal
} from '../shared/schema';
import { IStorage } from './storage';

interface StorageData {
  knowledgeAreas: KnowledgeArea[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  scales: Scale[];
  clients: Client[];
  categories: Category[];
  locations: Location[];
  members: Member[];
  memberProfiles: MemberProfile[];
  memberSkills: MemberSkill[];
  learningGoals: LearningGoal[];
  counters: {
    knowledgeAreaId: number;
    skillCategoryId: number;
    skillId: number;
    scaleId: number;
    clientId: number;
    categoryId: number;
    locationId: number;
    memberId: number;
    memberProfileId: number;
    memberSkillId: number;
    learningGoalId: number;
  };
}

export class JsonStorage implements IStorage {
  private dataPath = join(process.cwd(), 'data');
  private filePath = join(this.dataPath, 'skills-data.json');

  private knowledgeAreasData: Map<number, KnowledgeArea> = new Map();
  private skillCategoriesData: Map<number, SkillCategory> = new Map();
  private skillsData: Map<number, Skill> = new Map();
  private scalesData: Map<number, Scale> = new Map();
  private clientsData: Map<number, Client> = new Map();
  private categoriesData: Map<number, Category> = new Map();
  private locationsData: Map<number, Location> = new Map();
  private membersData: Map<number, Member> = new Map();
  private memberProfilesData: Map<number, MemberProfile> = new Map();
  private memberSkillsData: Map<number, MemberSkill> = new Map();
  private learningGoalsData: Map<number, LearningGoal> = new Map();

  private currentKnowledgeAreaId = 1;
  private currentSkillCategoryId = 1;
  private currentSkillId = 1;
  private currentScaleId = 1;
  private currentClientId = 1;
  private currentCategoryId = 1;
  private currentLocationId = 1;
  private currentMemberId = 1;
  private currentMemberProfileId = 1;
  private currentMemberSkillId = 1;
  private currentLearningGoalId = 1;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
      await this.loadData();
    } catch (error) {
      console.log('Initializing with default data...');
      this.initializeDefaultData();
      await this.saveData();
    }
  }

  private async loadData() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      
      if (!data || data.trim() === '') {
        throw new Error('Empty data file');
      }

      const parsedData: StorageData = JSON.parse(data);

      // Load knowledge areas
      this.knowledgeAreasData.clear();
      parsedData.knowledgeAreas.forEach(area => {
        this.knowledgeAreasData.set(area.id, area);
      });

      // Load skill categories
      this.skillCategoriesData.clear();
      parsedData.skillCategories.forEach(category => {
        this.skillCategoriesData.set(category.id, category);
      });

      // Load skills
      this.skillsData.clear();
      parsedData.skills.forEach(skill => {
        this.skillsData.set(skill.id, skill);
      });

      // Load scales
      this.scalesData.clear();
      parsedData.scales.forEach(scale => {
        this.scalesData.set(scale.id, scale);
      });

      // Load clients
      this.clientsData.clear();
      if (parsedData.clients) {
        parsedData.clients.forEach(client => {
          this.clientsData.set(client.id, client);
        });
      }

      // Load categories
      this.categoriesData.clear();
      if (parsedData.categories && parsedData.categories.length > 0) {
        parsedData.categories.forEach(category => {
          this.categoriesData.set(category.id, category);
        });
      } else {
        // Initialize default categories if none exist
        this.initializeDefaultCategories();
        // Save the initialized data immediately
        await this.saveData();
      }

      // Load locations
      this.locationsData.clear();
      if (parsedData.locations && parsedData.locations.length > 0) {
        parsedData.locations.forEach(location => {
          this.locationsData.set(location.id, location);
        });
      } else {
        // Initialize default locations if none exist
        this.initializeDefaultLocations();
        // Save the initialized data immediately
        await this.saveData();
      }

      // Load members
      this.membersData.clear();
      parsedData.members.forEach(member => {
        this.membersData.set(member.id, member);
      });

      // Load member profiles
      this.memberProfilesData.clear();
      parsedData.memberProfiles.forEach(profile => {
        this.memberProfilesData.set(profile.id, profile);
      });

      // Load member skills
      this.memberSkillsData.clear();
      parsedData.memberSkills.forEach(memberSkill => {
        this.memberSkillsData.set(memberSkill.id, memberSkill);
      });

      // Load learning goals
      this.learningGoalsData.clear();
      parsedData.learningGoals.forEach(goal => {
        this.learningGoalsData.set(goal.id, goal);
      });

      // Update counters
      this.currentKnowledgeAreaId = parsedData.counters.knowledgeAreaId;
      this.currentSkillCategoryId = parsedData.counters.skillCategoryId;
      this.currentSkillId = parsedData.counters.skillId;
      this.currentScaleId = parsedData.counters.scaleId;
      this.currentClientId = parsedData.counters.clientId || 1;
      this.currentCategoryId = parsedData.counters.categoryId || 1;
      this.currentLocationId = parsedData.counters.locationId || 1;
      this.currentMemberId = parsedData.counters.memberId;
      this.currentMemberProfileId = parsedData.counters.memberProfileId;
      this.currentMemberSkillId = parsedData.counters.memberSkillId;
      this.currentLearningGoalId = parsedData.counters.learningGoalId;

      console.log('Data loaded from JSON file');
    } catch (error) {
      throw new Error('Failed to load data from JSON file');
    }
  }

  private async saveData() {
    try {
      const data: StorageData = {
        knowledgeAreas: Array.from(this.knowledgeAreasData.values()),
        skillCategories: Array.from(this.skillCategoriesData.values()),
        skills: Array.from(this.skillsData.values()),
        scales: Array.from(this.scalesData.values()),
        clients: Array.from(this.clientsData.values()),
        categories: Array.from(this.categoriesData.values()),
        locations: Array.from(this.locationsData.values()),
        members: Array.from(this.membersData.values()),
        memberProfiles: Array.from(this.memberProfilesData.values()),
        memberSkills: Array.from(this.memberSkillsData.values()),
        learningGoals: Array.from(this.learningGoalsData.values()),
        counters: {
          knowledgeAreaId: this.currentKnowledgeAreaId,
          skillCategoryId: this.currentSkillCategoryId,
          skillId: this.currentSkillId,
          scaleId: this.currentScaleId,
          clientId: this.currentClientId,
          categoryId: this.currentCategoryId,
          locationId: this.currentLocationId,
          memberId: this.currentMemberId,
          memberProfileId: this.currentMemberProfileId,
          memberSkillId: this.currentMemberSkillId,
          learningGoalId: this.currentLearningGoalId,
        }
      };

      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save data to JSON file:', error);
    }
  }

  private initializeDefaultData() {
    // Initialize knowledge areas
    const knowledgeAreas: KnowledgeArea[] = [
      { id: 1, name: "Programming & Development", description: "Software development and programming languages" },
      { id: 2, name: "DevOps & Infrastructure", description: "Development operations and infrastructure management" },
      { id: 3, name: "Cloud Services", description: "Cloud computing platforms and services" },
      { id: 4, name: "Data & Analytics", description: "Data management and analytics tools" },
      { id: 5, name: "Testing & Quality", description: "Software testing and quality assurance" }
    ];

    knowledgeAreas.forEach(area => {
      this.knowledgeAreasData.set(area.id, area);
    });

    // Initialize skill categories
    const skillCategories: SkillCategory[] = [
      { id: 1, name: "Programming Language", description: "Programming languages and frameworks" },
      { id: 2, name: "Database Technology", description: "Database systems and technologies" },
      { id: 3, name: "DevOps Tool", description: "DevOps and automation tools" },
      { id: 4, name: "Testing Framework", description: "Testing tools and frameworks" },
      { id: 5, name: "Cloud Platform", description: "Cloud computing platforms" },
      { id: 6, name: "Development Tool", description: "Development and productivity tools" },
      { id: 7, name: "Web Technology", description: "Web development technologies" },
      { id: 8, name: "Mobile Technology", description: "Mobile development technologies" }
    ];

    skillCategories.forEach(category => {
      this.skillCategoriesData.set(category.id, category);
    });

    // Initialize skills
    const skills: Skill[] = [
      { id: 1, name: ".Net - C#", purpose: ".Net - C# programming", categoryId: 1, knowledgeAreaId: 1 },
      { id: 2, name: "Java", purpose: "Java programming language", categoryId: 1, knowledgeAreaId: 1 },
      { id: 3, name: "JavaScript", purpose: "JavaScript programming language", categoryId: 1, knowledgeAreaId: 1 },
      { id: 4, name: "Python", purpose: "Python programming language", categoryId: 1, knowledgeAreaId: 1 },
      { id: 5, name: "React", purpose: "React JavaScript library", categoryId: 7, knowledgeAreaId: 1 },
      { id: 6, name: "Angular", purpose: "Angular web framework", categoryId: 7, knowledgeAreaId: 1 },
      { id: 7, name: "Vue.js", purpose: "Vue.js web framework", categoryId: 7, knowledgeAreaId: 1 },
      { id: 8, name: "Node.js", purpose: "Node.js runtime environment", categoryId: 1, knowledgeAreaId: 1 },
      { id: 9, name: "Spring Boot", purpose: "Spring Boot Java framework", categoryId: 1, knowledgeAreaId: 1 },
      { id: 10, name: "Docker", purpose: "Docker containerization", categoryId: 3, knowledgeAreaId: 2 },
      { id: 11, name: "Kubernetes", purpose: "Kubernetes orchestration", categoryId: 3, knowledgeAreaId: 2 },
      { id: 12, name: "Jenkins", purpose: "Jenkins CI/CD", categoryId: 3, knowledgeAreaId: 2 },
      { id: 13, name: "Git", purpose: "Git version control", categoryId: 6, knowledgeAreaId: 1 },
      { id: 14, name: "PostgreSQL", purpose: "PostgreSQL database", categoryId: 2, knowledgeAreaId: 4 },
      { id: 15, name: "MySQL", purpose: "MySQL database", categoryId: 2, knowledgeAreaId: 4 },
      { id: 16, name: "MongoDB", purpose: "MongoDB NoSQL database", categoryId: 2, knowledgeAreaId: 4 },
      { id: 17, name: "Redis", purpose: "Redis in-memory database", categoryId: 2, knowledgeAreaId: 4 },
      { id: 18, name: "AWS", purpose: "Amazon Web Services", categoryId: 5, knowledgeAreaId: 3 },
      { id: 19, name: "Azure", purpose: "Microsoft Azure", categoryId: 5, knowledgeAreaId: 3 },
      { id: 20, name: "Google Cloud Platform", purpose: "Google's cloud computing services", categoryId: 5, knowledgeAreaId: 3 },
      { id: 21, name: "Terraform", purpose: "Infrastructure as Code", categoryId: 3, knowledgeAreaId: 2 },
      { id: 22, name: "Ansible", purpose: "Configuration management", categoryId: 3, knowledgeAreaId: 2 },
      { id: 23, name: "Jest", purpose: "JavaScript testing framework", categoryId: 4, knowledgeAreaId: 5 },
      { id: 24, name: "JUnit", purpose: "Java testing framework", categoryId: 4, knowledgeAreaId: 5 },
      { id: 25, name: "Selenium", purpose: "Web automation testing", categoryId: 4, knowledgeAreaId: 5 },
      { id: 26, name: "Cypress", purpose: "End-to-end testing", categoryId: 4, knowledgeAreaId: 5 },
      { id: 27, name: "Postman", purpose: "API testing tool", categoryId: 4, knowledgeAreaId: 5 },
      { id: 28, name: "GraphQL", purpose: "Query language for APIs", categoryId: 7, knowledgeAreaId: 1 },
      { id: 29, name: "REST API", purpose: "RESTful web services", categoryId: 7, knowledgeAreaId: 1 },
      { id: 30, name: "Microservices", purpose: "Microservices architecture", categoryId: 1, knowledgeAreaId: 1 },
    ];

    skills.forEach(skill => {
      this.skillsData.set(skill.id, skill);
    });

    // Initialize scales
    const scales: Scale[] = [
      {
        id: 1,
        name: "Programming Experience",
        type: "qualitative",
        values: ["Beginner", "Intermediate", "Advanced", "Expert"],
        description: "Programming skill levels"
      },
      {
        id: 2,
        name: "Tools Proficiency",
        type: "qualitative", 
        values: ["Basic", "Proficient", "Advanced", "Expert"],
        description: "Tool usage proficiency levels"
      },
      {
        id: 3,
        name: "Years of Experience",
        type: "quantitative",
        values: ["1", "2", "3", "4", "5+"],
        description: "Years of hands-on experience"
      }
    ];

    scales.forEach(scale => {
      this.scalesData.set(scale.id, scale);
    });

    // Initialize clients with isActive field
    const clients: Client[] = [
      { id: 1, name: "Talent Pool", description: "Internal talent pool for available team members", isActive: true },
      { id: 2, name: "TechCorp Solutions", description: "Enterprise software development and consulting", isActive: true },
      { id: 3, name: "FinanceFlow", description: "Financial technology and banking solutions", isActive: true },
      { id: 4, name: "HealthTech Solutions", description: "Healthcare technology and medical software", isActive: true },
      { id: 5, name: "RetailMax", description: "E-commerce and retail technology solutions", isActive: true },
      { id: 6, name: "EduTech Pro", description: "Educational technology and learning platforms", isActive: true },
      { id: 7, name: "DataVault Systems", description: "Big data analytics and data management", isActive: true },
      { id: 8, name: "CloudFirst Technologies", description: "Cloud infrastructure and migration services", isActive: true },
      { id: 9, name: "MobileApp Innovations", description: "Mobile application development and UX design", isActive: true },
      { id: 10, name: "SecureNet Solutions", description: "Cybersecurity and network protection services", isActive: true },
      { id: 11, name: "AgriTech Partners", description: "Agricultural technology and IoT solutions", isActive: true },
      { id: 12, name: "InnovateLab", description: "Research and development for emerging technologies", isActive: true }
    ];

    clients.forEach(client => {
      this.clientsData.set(client.id, client);
    });

    // Initialize categories
    const categories: Category[] = [
      { id: 1, name: "Starter", description: "Entry-level technical professionals beginning their journey", isActive: true },
      { id: 2, name: "Builder", description: "Mid-level professionals building solutions and systems", isActive: true },
      { id: 3, name: "Solver", description: "Senior professionals solving complex technical challenges", isActive: true },
      { id: 4, name: "Wizard", description: "Expert-level professionals with deep specialized knowledge", isActive: true }
    ];

    categories.forEach(category => {
      this.categoriesData.set(category.id, category);
    });

    // Initialize locations
    const locations: Location[] = [
      { id: 1, name: "Argentina", description: "Argentina office location", isActive: true },
      { id: 2, name: "Uruguay", description: "Uruguay office location", isActive: true },
      { id: 3, name: "Chile", description: "Chile office location", isActive: true },
      { id: 4, name: "Brazil", description: "Brazil office location", isActive: true },
      { id: 5, name: "Colombia", description: "Colombia office location", isActive: true }
    ];

    locations.forEach(location => {
      this.locationsData.set(location.id, location);
    });

    // Update counters
    this.currentKnowledgeAreaId = 6;
    this.currentSkillCategoryId = 9;
    this.currentSkillId = 31;
    this.currentScaleId = 4;
    this.currentClientId = 13;
    this.currentCategoryId = 5;
    this.currentLocationId = 6;
    this.currentMemberId = 1;
    this.currentMemberProfileId = 1;
    this.currentMemberSkillId = 1;
    this.currentLearningGoalId = 1;
  }

  private initializeDefaultCategories() {
    const categories: Category[] = [
      { id: 1, name: "Starter", description: "Entry-level technical professionals beginning their journey", isActive: true },
      { id: 2, name: "Builder", description: "Mid-level professionals building solutions and systems", isActive: true },
      { id: 3, name: "Solver", description: "Senior professionals solving complex technical challenges", isActive: true },
      { id: 4, name: "Wizard", description: "Expert-level professionals with deep specialized knowledge", isActive: true }
    ];

    categories.forEach(category => {
      this.categoriesData.set(category.id, category);
    });
    this.currentCategoryId = 5;
  }

  private initializeDefaultLocations() {
    const locations: Location[] = [
      { id: 1, name: "Argentina", description: "Argentina office location", isActive: true },
      { id: 2, name: "Uruguay", description: "Uruguay office location", isActive: true },
      { id: 3, name: "Chile", description: "Chile office location", isActive: true },
      { id: 4, name: "Brazil", description: "Brazil office location", isActive: true },
      { id: 5, name: "Colombia", description: "Colombia office location", isActive: true }
    ];

    locations.forEach(location => {
      this.locationsData.set(location.id, location);
    });
    this.currentLocationId = 6;
  }

  // Categories methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesData.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoriesData.get(id);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      id, 
      name: data.name, 
      description: data.description ?? null,
      isActive: data.isActive ?? null
    };
    this.categoriesData.set(id, category);
    await this.saveData();
    return category;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categoriesData.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...data };
    this.categoriesData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const deleted = this.categoriesData.delete(id);
    if (deleted) await this.saveData();
    return deleted;
  }

  // Locations methods
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locationsData.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locationsData.get(id);
  }

  async createLocation(data: InsertLocation): Promise<Location> {
    const id = this.currentLocationId++;
    const location: Location = { 
      id, 
      name: data.name, 
      description: data.description ?? null,
      isActive: data.isActive ?? null
    };
    this.locationsData.set(id, location);
    await this.saveData();
    return location;
  }

  async updateLocation(id: number, data: Partial<InsertLocation>): Promise<Location | undefined> {
    const location = this.locationsData.get(id);
    if (!location) return undefined;
    const updated = { ...location, ...data };
    this.locationsData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const deleted = this.locationsData.delete(id);
    if (deleted) await this.saveData();
    return deleted;
  }

  // Knowledge Areas methods
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
    await this.saveData();
    return knowledgeArea;
  }

  async updateKnowledgeArea(id: number, data: Partial<InsertKnowledgeArea>): Promise<KnowledgeArea | undefined> {
    const existing = this.knowledgeAreasData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.knowledgeAreasData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteKnowledgeArea(id: number): Promise<boolean> {
    const deleted = this.knowledgeAreasData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Skill Categories methods
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
    await this.saveData();
    return category;
  }

  async updateSkillCategory(id: number, data: Partial<InsertSkillCategory>): Promise<SkillCategory | undefined> {
    const existing = this.skillCategoriesData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.skillCategoriesData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteSkillCategory(id: number): Promise<boolean> {
    const deleted = this.skillCategoriesData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Skills methods
  async getSkills(): Promise<SkillWithDetails[]> {
    return Array.from(this.skillsData.values()).map(skill => ({
      ...skill,
      category: this.skillCategoriesData.get(skill.categoryId),
      knowledgeArea: this.knowledgeAreasData.get(skill.knowledgeAreaId)
    }));
  }

  async getSkill(id: number): Promise<SkillWithDetails | undefined> {
    const skill = this.skillsData.get(id);
    if (!skill) return undefined;

    return {
      ...skill,
      category: this.skillCategoriesData.get(skill.categoryId),
      knowledgeArea: this.knowledgeAreasData.get(skill.knowledgeAreaId)
    };
  }

  async createSkill(data: InsertSkill): Promise<Skill> {
    const id = this.currentSkillId++;
    const skill: Skill = { ...data, id };
    this.skillsData.set(id, skill);
    await this.saveData();
    return skill;
  }

  async updateSkill(id: number, data: Partial<InsertSkill>): Promise<Skill | undefined> {
    const existing = this.skillsData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.skillsData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteSkill(id: number): Promise<boolean> {
    const deleted = this.skillsData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  private normalizeScaleValues(values: { value: string; order: number; }[]): string[] {
    return values
      .sort((a, b) => a.order - b.order)
      .map(v => v.value);
  }

  // Scales methods
  async getScales(): Promise<Scale[]> {
    return Array.from(this.scalesData.values()).map(scale => ({
      ...scale,
      values: Array.isArray(scale.values) 
        ? scale.values 
        : typeof scale.values === 'object' && scale.values !== null
          ? this.normalizeScaleValues(Object.entries(scale.values).map(([value, order]) => ({ value, order: Number(order) })))
          : []
    }));
  }

  async getScale(id: number): Promise<Scale | null> {
    const scale = this.scalesData.get(id);
    if (!scale) return null;

    return {
      ...scale,
      values: Array.isArray(scale.values) 
        ? scale.values 
        : typeof scale.values === 'object' && scale.values !== null
          ? this.normalizeScaleValues(Object.entries(scale.values).map(([value, order]) => ({ value, order: Number(order) })))
          : []
    };
  }

  async getScalesByCategory(categoryId: number): Promise<Scale[]> {
    return Array.from(this.scalesData.values());
  }

  async createScale(data: InsertScale): Promise<Scale> {
    const id = this.currentScaleId++;
    const scale: Scale = { ...data, id };
    this.scalesData.set(id, scale);
    await this.saveData();
    return scale;
  }

  async updateScale(id: number, data: Partial<InsertScale>): Promise<Scale | undefined> {
    const existing = this.scalesData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.scalesData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteScale(id: number): Promise<boolean> {
    const deleted = this.scalesData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Clients methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clientsData.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clientsData.get(id);
  }

  async createClient(data: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...data, id };
    this.clientsData.set(id, client);
    await this.saveData();
    return client;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clientsData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.clientsData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteClient(id: number): Promise<boolean> {
    const deleted = this.clientsData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Members methods
  async getMembers(): Promise<MemberWithSkills[]> {
    return Array.from(this.membersData.values()).map(member => {
      const profile = Array.from(this.memberProfilesData.values()).find(p => p.memberId === member.id);
      const skills = Array.from(this.memberSkillsData.values())
        .filter(ms => ms.memberId === member.id)
        .map(ms => ({
          ...ms,
          skill: this.skillsData.get(ms.skillId)!
        }));
      const learningGoals = Array.from(this.learningGoalsData.values())
        .filter(lg => lg.memberId === member.id)
        .map(lg => ({
          ...lg,
          skill: this.skillsData.get(lg.skillId)!
        }));

      // Enrich with category and location names based on IDs
      console.log(`Member ${member.id} enrichment - categoryId: ${member.categoryId}, locationId: ${member.locationId}`);
      console.log(`Available categories: ${Array.from(this.categoriesData.keys())}`);
      console.log(`Available locations: ${Array.from(this.locationsData.keys())}`);
      
      const categoryName = member.categoryId ? this.categoriesData.get(member.categoryId)?.name : undefined;
      const locationName = member.locationId ? this.locationsData.get(member.locationId)?.name : undefined;
      const clientName = member.currentClientId ? this.clientsData.get(member.currentClientId)?.name : undefined;
      
      console.log(`Enriched names - category: ${categoryName}, location: ${locationName}, client: ${clientName}`);
      
      return {
        ...member,
        category: categoryName || 'Unknown',
        location: locationName || 'Unknown',
        currentClient: clientName || 'TalentPool',
        profile,
        skills,
        learningGoals
      } as MemberWithSkills;
    });
  }

  async getMember(id: number): Promise<MemberWithSkills | undefined> {
    const member = this.membersData.get(id);
    if (!member) return undefined;

    const profile = Array.from(this.memberProfilesData.values()).find(p => p.memberId === id);
    const skills = Array.from(this.memberSkillsData.values())
      .filter(ms => ms.memberId === id)
      .map(ms => ({
        ...ms,
        skill: this.skillsData.get(ms.skillId)!
      }));
    const learningGoals = Array.from(this.learningGoalsData.values())
      .filter(lg => lg.memberId === id)
      .map(lg => ({
        ...lg,
        skill: this.skillsData.get(lg.skillId)!
      }));

    // Enrich with category and location names based on IDs
    const categoryName = member.categoryId ? this.categoriesData.get(member.categoryId)?.name : undefined;
    const locationName = member.locationId ? this.locationsData.get(member.locationId)?.name : undefined;
    const clientName = member.currentClientId ? this.clientsData.get(member.currentClientId)?.name : undefined;

    return {
      ...member,
      category: categoryName || 'Unknown',
      location: locationName || 'Unknown',
      currentClient: clientName || 'TalentPool',
      profile,
      skills,
      learningGoals
    } as MemberWithSkills;
  }

  async createMember(data: InsertMember): Promise<Member> {
    const id = this.currentMemberId++;
    const member: Member = { ...data, id };
    this.membersData.set(id, member);
    await this.saveData();
    return member;
  }

  async updateMember(id: number, data: Partial<InsertMember>): Promise<Member | undefined> {
    const existing = this.membersData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.membersData.set(id, updated);
    await this.saveData();
    
    // Return enriched member data
    const enrichedMember = await this.getMember(id);
    return enrichedMember as Member;
  }

  async deleteMember(id: number): Promise<boolean> {
    const deleted = this.membersData.delete(id);
    if (deleted) {
      // Also delete associated data
      Array.from(this.memberProfilesData.entries()).forEach(([profileId, profile]) => {
        if (profile.memberId === id) {
          this.memberProfilesData.delete(profileId);
        }
      });
      Array.from(this.memberSkillsData.entries()).forEach(([skillId, skill]) => {
        if (skill.memberId === id) {
          this.memberSkillsData.delete(skillId);
        }
      });
      Array.from(this.learningGoalsData.entries()).forEach(([goalId, goal]) => {
        if (goal.memberId === id) {
          this.learningGoalsData.delete(goalId);
        }
      });
      await this.saveData();
    }
    return deleted;
  }

  // Member Profiles methods
  async getMemberProfile(memberId: number): Promise<MemberProfile | undefined> {
    return Array.from(this.memberProfilesData.values()).find(profile => profile.memberId === memberId);
  }

  async createMemberProfile(data: InsertMemberProfile): Promise<MemberProfile> {
    const id = this.currentMemberProfileId++;
    const profile: MemberProfile = { 
      ...data, 
      id,
      assignments: data.assignments || [],
      roles: data.roles || [],
      appreciations: data.appreciations || [],
      feedbackComments: data.feedbackComments || [],
      talentPoolPeriods: data.talentPoolPeriods || [],
      clientHistory: data.clientHistory || []
    };
    this.memberProfilesData.set(id, profile);
    await this.saveData();
    return profile;
  }

  async updateMemberProfile(id: number, data: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined> {
    const existing = this.memberProfilesData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.memberProfilesData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteMemberProfile(id: number): Promise<boolean> {
    const deleted = this.memberProfilesData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Member Skills methods
  async getMemberSkills(memberId: number): Promise<(MemberSkill & { skill: Skill })[]> {
    return Array.from(this.memberSkillsData.values())
      .filter(ms => ms.memberId === memberId)
      .map(ms => ({
        ...ms,
        skill: this.skillsData.get(ms.skillId)!
      }));
  }

  async createMemberSkill(data: InsertMemberSkill): Promise<MemberSkill> {
    const id = this.currentMemberSkillId++;
    const memberSkill: MemberSkill = { ...data, id };
    this.memberSkillsData.set(id, memberSkill);
    await this.saveData();
    return memberSkill;
  }

  async updateMemberSkill(id: number, data: Partial<InsertMemberSkill>): Promise<MemberSkill | undefined> {
    const existing = this.memberSkillsData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.memberSkillsData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteMemberSkill(id: number): Promise<boolean> {
    const deleted = this.memberSkillsData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Learning Goals methods
  async getLearningGoals(memberId?: number): Promise<(LearningGoal & { skill: Skill; member: Member })[]> {
    const goals = Array.from(this.learningGoalsData.values());
    const filteredGoals = memberId ? goals.filter(goal => goal.memberId === memberId) : goals;
    
    return filteredGoals.map(goal => ({
      ...goal,
      skill: this.skillsData.get(goal.skillId)!,
      member: this.membersData.get(goal.memberId)!
    }));
  }

  async createLearningGoal(data: InsertLearningGoal): Promise<LearningGoal> {
    const id = this.currentLearningGoalId++;
    const learningGoal: LearningGoal = { 
      ...data, 
      id,
      createdAt: new Date()
    };
    this.learningGoalsData.set(id, learningGoal);
    await this.saveData();
    return learningGoal;
  }

  async updateLearningGoal(id: number, data: Partial<InsertLearningGoal>): Promise<LearningGoal | undefined> {
    const existing = this.learningGoalsData.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data };
    this.learningGoalsData.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteLearningGoal(id: number): Promise<boolean> {
    const deleted = this.learningGoalsData.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  // Analytics methods
  async getCompanyStrengths(): Promise<{ name: string; count: number; percentage: number }[]> {
    const skillCounts = new Map<string, number>();
    const totalMembers = this.membersData.size;

    Array.from(this.memberSkillsData.values()).forEach(memberSkill => {
      const skill = this.skillsData.get(memberSkill.skillId);
      if (skill) {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      }
    });

    return Array.from(skillCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalMembers) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getSkillGaps(): Promise<{ name: string; count: number; percentage: number }[]> {
    const skillCounts = new Map<string, number>();
    const totalMembers = this.membersData.size;

    // Count how many members DON'T have each STRATEGIC skill
    Array.from(this.skillsData.values()).forEach(skill => {
      // Only process skills marked as strategic priority
      if (skill.strategicPriority) {
        const memberCount = Array.from(this.memberSkillsData.values())
          .filter(ms => ms.skillId === skill.id).length;
        const gap = totalMembers - memberCount;
        if (gap > 0) {
          skillCounts.set(skill.name, gap);
        }
      }
    });

    return Array.from(skillCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalMembers) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getStats(): Promise<{
    totalMembers: number;
    totalSkills: number;
    totalLearningGoals: number;
    activeClients: number;
  }> {
    // Count unique skills that are assigned to members
    const activeSkills = new Set(Array.from(this.memberSkillsData.values()).map(ms => ms.skillId)).size;
    
    // Count active learning goals
    const activeLearningGoals = Array.from(this.learningGoalsData.values()).filter(lg => 
      lg.status === "active" || lg.status === "in_progress"
    ).length;
    
    // Count unique active clients from member profiles client history
    const activeClients = new Set();
    Array.from(this.memberProfilesData.values()).forEach(profile => {
      if (profile.clientHistory && Array.isArray(profile.clientHistory)) {
        profile.clientHistory.forEach((history: any) => {
          if (history.clientId && history.clientId !== "talent-pool") {
            activeClients.add(history.clientId);
          }
        });
      }
    });
    
    return {
      totalMembers: this.membersData.size,
      totalSkills: activeSkills,
      totalLearningGoals: activeLearningGoals,
      activeClients: activeClients.size
    };
  }

  // Search members
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

      if (filters.category && filters.category !== "all") {
        const hasCategory = member.skills.some(skill => {
          const category = this.skillCategoriesData.get(skill.skill.categoryId);
          return category?.name.toLowerCase().includes(filters.category!.toLowerCase());
        });
        if (!hasCategory) return false;
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