import { pgTable, text, serial, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const processAnalyses = pgTable("process_analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  processName: text("process_name").notNull(),
  totalStages: integer("total_stages").notNull(),
  vboCount: integer("vbo_count").notNull(),
  actionCount: integer("action_count").notNull(),
  subsheetCount: integer("subsheet_count").notNull(),
  dependencies: json("dependencies").notNull(),
});

export const vboAnalyses = pgTable("vbo_analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  vboName: text("vbo_name").notNull(),
  version: text("version").notNull(),
  narrative: text("narrative"),
  actionCount: integer("action_count").notNull(),
  elementCount: integer("element_count").notNull(),
  actions: json("actions").notNull(),
  elements: json("elements").notNull(),
});

export const insertProcessAnalysisSchema = createInsertSchema(processAnalyses).omit({
  id: true,
});

export const insertVBOAnalysisSchema = createInsertSchema(vboAnalyses).omit({
  id: true,
});

export type InsertProcessAnalysis = z.infer<typeof insertProcessAnalysisSchema>;
export type ProcessAnalysis = typeof processAnalyses.$inferSelect;
export type InsertVBOAnalysis = z.infer<typeof insertVBOAnalysisSchema>;
export type VBOAnalysis = typeof vboAnalyses.$inferSelect;

export const actionSchema = z.object({
  id: z.string(),
  name: z.string(),
  usageCount: z.number(),
  locations: z.array(z.string()),
  description: z.string().optional(),
});

export const vboSchema = z.object({
  id: z.string(),
  name: z.string(),
  usageCount: z.number(),
  locations: z.array(z.string()),
  actions: z.array(actionSchema),
  description: z.string().optional(),
});

export type VBOAction = z.infer<typeof actionSchema>;
export type VBODependency = z.infer<typeof vboSchema>;

export const processStatsSchema = z.object({
  totalStages: z.number(),
  vboCount: z.number(),
  actionCount: z.number(),
  subsheetCount: z.number(),
});

export type ProcessStats = z.infer<typeof processStatsSchema>;

// VBO-specific schemas
export const vboActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type VBOElement = {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  path: string;
  attributes?: Record<string, any>;
  children?: VBOElement[];
};

export const vboElementSchema: z.ZodType<VBOElement> = z.lazy(() => z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  parentId: z.string().optional(),
  path: z.string(),
  attributes: z.record(z.any()).optional(),
  children: z.array(vboElementSchema).optional(),
}));

export type VBOActionDef = z.infer<typeof vboActionSchema>;
