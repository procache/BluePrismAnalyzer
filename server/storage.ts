import { processAnalyses, type ProcessAnalysis, type InsertProcessAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProcessAnalysis(id: number): Promise<ProcessAnalysis | undefined>;
  createProcessAnalysis(analysis: InsertProcessAnalysis): Promise<ProcessAnalysis>;
  getAllProcessAnalyses(): Promise<ProcessAnalysis[]>;
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
}

export const storage = new DatabaseStorage();
