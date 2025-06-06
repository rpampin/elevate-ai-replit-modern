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
});

export const scales = pgTable("scales", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "numeric", "qualitative"
  values: json("values").$type<{value: string, order: number}[]>().notNull(),
  categoryId: integer("category_id").references(() => skillCategories.id),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  hireDate: timestamp("hire_date"),
  currentClient: text("current_client"),
  category: text("category").notNull(), // "Starter", "Builder", "Solver", "Wizard"
  location: text("location"),
});

export const memberProfiles = pgTable("member_profiles", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  assignments: json("assignments").$type<string[]>().default([]),
  roles: json("roles").$type<string[]>().default([]),
  appreciations: json("appreciations").$type<string[]>().default([]),
  feedbackComments: json("feedback_comments").$type<string[]>().default([]),
  talentPoolPeriods: json("talent_pool_periods").$type<string[]>().default([]),
});

export const memberSkills = pgTable("member_skills", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  skillId: integer("skill_id").references(() => skills.id),
  level: text("level").notNull(),
  scaleId: integer("scale_id").references(() => scales.id),
});

export const learningGoals = pgTable("learning_goals", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  skillId: integer("skill_id").references(() => skills.id),
  description: text("description"),
  targetLevel: text("target_level"),
  status: text("status").default("active"), // "active", "completed", "paused"
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertKnowledgeAreaSchema = createInsertSchema(knowledgeAreas).omit({ id: true });
export const insertSkillCategorySchema = createInsertSchema(skillCategories).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertScaleSchema = createInsertSchema(scales).omit({ id: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export const insertMemberProfileSchema = createInsertSchema(memberProfiles).omit({ id: true });
export const insertMemberSkillSchema = createInsertSchema(memberSkills).omit({ id: true });
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
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberSkill = typeof memberSkills.$inferSelect;
export type InsertMemberSkill = z.infer<typeof insertMemberSkillSchema>;
export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = z.infer<typeof insertLearningGoalSchema>;

// Extended types for API responses
export type MemberWithSkills = Member & {
  profile?: MemberProfile;
  skills: (MemberSkill & { skill: Skill })[];
  learningGoals: (LearningGoal & { skill: Skill })[];
};

export type SkillWithDetails = Skill & {
  category?: SkillCategory;
  knowledgeArea?: KnowledgeArea;
};
