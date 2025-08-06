import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const knowledgeAreas = pgTable("knowledge_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const skillCategories = pgTable("skill_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  criteria: text("criteria"),
  scaleId: integer("scale_id").references(() => scales.id),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose"),
  categoryId: integer("category_id").references(() => skillCategories.id),
  knowledgeAreaId: integer("knowledge_area_id").references(() => knowledgeAreas.id),
  strategicPriority: boolean("strategic_priority").default(false),
});

export const scales = pgTable("scales", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "numeric", "qualitative"
  values: json("values").$type<{value: string, order: number}[]>().notNull(),
  categoryId: integer("category_id").references(() => skillCategories.id),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"), // base64 encoded image data
  hireDate: timestamp("hire_date"),
  currentClientId: integer("current_client_id").references(() => clients.id),
  categoryId: integer("category_id").references(() => categories.id),
  locationId: integer("location_id").references(() => locations.id),
});

export const memberProfiles = pgTable("member_profiles", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  assignments: json("assignments").$type<{id: string; title: string; description: string; clientId: number; startDate: string; endDate?: string; status: string}[]>().default([]),
  roles: json("roles").$type<{id: string; title: string; description: string; skills: string[]}[]>().default([]),
  appreciations: json("appreciations").$type<{id: string; clientId: number; author: string; message: string; date: string; rating?: number}[]>().default([]),
  feedbackComments: json("feedback_comments").$type<{id: string; author: string; comment: string; date: string; type: string}[]>().default([]),
  clientHistory: json("client_history").$type<{id: string; clientId: number; startDate: string; endDate?: string; role: string; status: string; projects?: string[]}[]>().default([]),
});

export const memberSkills = pgTable("member_skills", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  skillId: integer("skill_id").references(() => skills.id),
  level: text("level").notNull(),
  scaleId: integer("scale_id").references(() => scales.id),
});

export const learningGoalStatuses = pgTable("learning_goal_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const learningGoals = pgTable("learning_goals", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  skillId: integer("skill_id").references(() => skills.id),
  description: text("description"),
  targetLevel: text("target_level"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertKnowledgeAreaSchema = createInsertSchema(knowledgeAreas).omit({ id: true });
export const insertSkillCategorySchema = createInsertSchema(skillCategories).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertScaleSchema = createInsertSchema(scales).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export const insertMemberProfileSchema = createInsertSchema(memberProfiles).omit({ id: true });
export const insertMemberSkillSchema = createInsertSchema(memberSkills).omit({ id: true });
export const insertLearningGoalStatusSchema = createInsertSchema(learningGoalStatuses).omit({ id: true });
export const insertLearningGoalSchema = createInsertSchema(learningGoals).omit({ id: true, createdAt: true });

// Types
export type KnowledgeArea = typeof knowledgeAreas.$inferSelect;
export type InsertKnowledgeArea = z.infer<typeof insertKnowledgeAreaSchema>;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type InsertSkillCategory = z.infer<typeof insertSkillCategorySchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Scale = typeof scales.$inferSelect;
export type InsertScale = z.infer<typeof insertScaleSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberSkill = typeof memberSkills.$inferSelect;
export type InsertMemberSkill = z.infer<typeof insertMemberSkillSchema>;
export type LearningGoalStatus = typeof learningGoalStatuses.$inferSelect;
export type InsertLearningGoalStatus = z.infer<typeof insertLearningGoalStatusSchema>;
export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = z.infer<typeof insertLearningGoalSchema>;

// Extended types for API responses
export type MemberWithSkills = Member & {
  name?: string; // Legacy field compatibility
  category?: string; // Computed from categoryId
  location?: string; // Computed from locationId
  currentClient?: string; // Computed from currentClientId
  profile?: MemberProfile;
  skills: (MemberSkill & { skill: Skill })[];
  learningGoals: (LearningGoal & { skill: Skill; status?: LearningGoalStatus })[];
};

export type SkillWithDetails = Skill & {
  category?: SkillCategory;
  knowledgeArea?: KnowledgeArea;
};
