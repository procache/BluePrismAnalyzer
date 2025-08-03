import { z } from "zod";

// Process analysis types (no persistence needed)
export const processAnalysisSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  processName: z.string(),
  totalStages: z.number(),
  vboCount: z.number(),
  actionCount: z.number(),
  subsheetCount: z.number(),
  dependencies: z.array(z.any()),
});

export const vboAnalysisSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  vboName: z.string(),
  version: z.string(),
  narrative: z.string().optional(),
  actionCount: z.number(),
  elementCount: z.number(),
  actions: z.array(z.any()),
  elements: z.array(z.any()),
});

export type ProcessAnalysis = z.infer<typeof processAnalysisSchema>;
export type VBOAnalysis = z.infer<typeof vboAnalysisSchema>;

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
