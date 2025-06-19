import { processAnalyses, vboAnalyses, type ProcessAnalysis, type InsertProcessAnalysis, type VBOAnalysis, type InsertVBOAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProcessAnalysis(id: number): Promise<ProcessAnalysis | undefined>;
  createProcessAnalysis(analysis: InsertProcessAnalysis): Promise<ProcessAnalysis>;
  getAllProcessAnalyses(): Promise<ProcessAnalysis[]>;
  getVBOAnalysis(id: number): Promise<VBOAnalysis | undefined>;
  createVBOAnalysis(analysis: InsertVBOAnalysis): Promise<VBOAnalysis>;
  getAllVBOAnalyses(): Promise<VBOAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  async getProcessAnalysis(id: number): Promise<ProcessAnalysis | undefined> {
    const [analysis] = await db.select().from(processAnalyses).where(eq(processAnalyses.id, id));
    return analysis || undefined;
  }

  async createProcessAnalysis(insertAnalysis: InsertProcessAnalysis): Promise<ProcessAnalysis> {
    const [analysis] = await db
      .insert(processAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getAllProcessAnalyses(): Promise<ProcessAnalysis[]> {
    return await db.select().from(processAnalyses);
  }

  async getVBOAnalysis(id: number): Promise<VBOAnalysis | undefined> {
    const [analysis] = await db.select().from(vboAnalyses).where(eq(vboAnalyses.id, id));
    return analysis || undefined;
  }

  async createVBOAnalysis(insertAnalysis: InsertVBOAnalysis): Promise<VBOAnalysis> {
    const [analysis] = await db
      .insert(vboAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getAllVBOAnalyses(): Promise<VBOAnalysis[]> {
    return await db.select().from(vboAnalyses);
  }
}

export const storage = new DatabaseStorage();
