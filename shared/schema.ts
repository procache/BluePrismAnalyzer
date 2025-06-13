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

export const insertProcessAnalysisSchema = createInsertSchema(processAnalyses).omit({
  id: true,
});

export type InsertProcessAnalysis = z.infer<typeof insertProcessAnalysisSchema>;
export type ProcessAnalysis = typeof processAnalyses.$inferSelect;

export const dependencySchema = z.object({
  id: z.string(),
  type: z.enum(["vbo", "action"]),
  name: z.string(),
  businessObject: z.string(),
  usageCount: z.number(),
  locations: z.array(z.string()),
  description: z.string().optional(),
});

export type Dependency = z.infer<typeof dependencySchema>;

export const processStatsSchema = z.object({
  totalStages: z.number(),
  vboCount: z.number(),
  actionCount: z.number(),
  subsheetCount: z.number(),
});

export type ProcessStats = z.infer<typeof processStatsSchema>;
