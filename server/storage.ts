import { processAnalyses, type ProcessAnalysis, type InsertProcessAnalysis } from "@shared/schema";

export interface IStorage {
  getProcessAnalysis(id: number): Promise<ProcessAnalysis | undefined>;
  createProcessAnalysis(analysis: InsertProcessAnalysis): Promise<ProcessAnalysis>;
  getAllProcessAnalyses(): Promise<ProcessAnalysis[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, ProcessAnalysis>;
  private currentId: number;

  constructor() {
    this.analyses = new Map();
    this.currentId = 1;
  }

  async getProcessAnalysis(id: number): Promise<ProcessAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async createProcessAnalysis(insertAnalysis: InsertProcessAnalysis): Promise<ProcessAnalysis> {
    const id = this.currentId++;
    const analysis: ProcessAnalysis = { ...insertAnalysis, id };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAllProcessAnalyses(): Promise<ProcessAnalysis[]> {
    return Array.from(this.analyses.values());
  }
}

export const storage = new MemStorage();
