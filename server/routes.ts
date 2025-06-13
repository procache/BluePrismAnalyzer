import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parseString } from "xml2js";
import { z } from "zod";
import { storage } from "./storage";
import { insertProcessAnalysisSchema, type VBODependency, type VBOAction } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.bpprocess') || file.mimetype === 'text/xml' || file.mimetype === 'application/xml') {
      cb(null, true);
    } else {
      cb(new Error('Only .bpprocess files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and analyze .bpprocess file
  app.post("/api/analyze", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      
      // Parse XML
      const result = await new Promise<any>((resolve, reject) => {
        parseString(xmlContent, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (!result.process) {
        return res.status(400).json({ message: "Invalid .bpprocess file format" });
      }

      const processData = result.process.$;
      const processName = processData.name || "Unknown Process";
      
      // Extract stages and subsheets
      const stages = result.process.stage || [];
      const subsheets = result.process.subsheet || [];
      
      // Extract dependencies
      const dependencies = extractDependencies(result.process);
      
      // Calculate stats
      const vbos = dependencies;
      const totalActions = dependencies.reduce((sum, vbo) => sum + vbo.actions.length, 0);
      
      const analysisData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processName,
        totalStages: stages.length,
        vboCount: vbos.length,
        actionCount: totalActions,
        subsheetCount: subsheets.length,
        dependencies: dependencies,
      };

      // Validate and store
      const validatedData = insertProcessAnalysisSchema.parse(analysisData);
      const savedAnalysis = await storage.createProcessAnalysis(validatedData);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze file" 
      });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllProcessAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve analyses" });
    }
  });

  // Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getProcessAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function extractDependencies(process: any): VBODependency[] {
  const vbos: Map<string, VBODependency> = new Map();
  const stages = process.stage || [];
  const subsheets = process.subsheet || [];

  // Extract from main process stages
  extractFromStages(stages, vbos, "Main Process");

  // Extract from subsheets
  subsheets.forEach((subsheet: any) => {
    const subsheetName = subsheet.name?.[0] || "Unknown Subsheet";
    const subsheetStages = findStagesBySubsheet(stages, subsheet.$.subsheetid);
    extractFromStages(subsheetStages, vbos, subsheetName);
  });

  return Array.from(vbos.values());
}

function extractFromStages(stages: any[], vbos: Map<string, VBODependency>, location: string) {
  stages.forEach((stage: any) => {
    const stageData = stage.$;
    const stageName = stageData.name;
    const stageType = stageData.type;

    if (stageName) {
      // Look for specific business object patterns in stage names
      const vboPatterns = [
        { pattern: /Excel/i, vboName: "MS Excel VBO" },
        { pattern: /Email/i, vboName: "Email - POP3/SMTP" },
        { pattern: /Collection/i, vboName: "Utility - Collection Manipulation" },
        { pattern: /File/i, vboName: "Utility - File Management" },
        { pattern: /String/i, vboName: "Utility - Strings" },
        { pattern: /Date/i, vboName: "Utility - Date and Time" },
        { pattern: /Math/i, vboName: "Utility - Math" },
        { pattern: /Environment/i, vboName: "Utility - Environment" },
        { pattern: /SAP/i, vboName: "SAP Application Server" },
        { pattern: /Web/i, vboName: "Web API" },
        { pattern: /Database/i, vboName: "Database" }
      ];

      for (const { pattern, vboName } of vboPatterns) {
        if (pattern.test(stageName)) {
          const vboKey = vboName;
          
          // Get or create VBO
          if (!vbos.has(vboKey)) {
            vbos.set(vboKey, {
              id: vboKey,
              name: vboName,
              usageCount: 0,
              locations: [],
              actions: [],
              description: `Visual Business Object: ${vboName}`
            });
          }
          
          const vbo = vbos.get(vboKey)!;
          vbo.usageCount++;
          if (!vbo.locations.includes(location)) {
            vbo.locations.push(location);
          }

          // Extract action name from stage name
          const actionName = extractActionName(stageName);
          const actionKey = `${actionName}-${location}`;
          
          // Check if action already exists in this VBO
          const existingAction = vbo.actions.find(action => action.id === actionKey);
          
          if (!existingAction) {
            // Add new action to this VBO
            vbo.actions.push({
              id: actionKey,
              name: actionName,
              usageCount: 1,
              locations: [location],
              description: `Action: ${actionName}`
            });
          } else {
            // Update existing action
            existingAction.usageCount++;
            if (!existingAction.locations.includes(location)) {
              existingAction.locations.push(location);
            }
          }
          
          break; // Only match the first pattern
        }
      }
    }
  });
}

function findStagesBySubsheet(stages: any[], subsheetId: string): any[] {
  return stages.filter(stage => stage.$.subsheetid === subsheetId);
}

function extractVBOName(stageName: string): string {
  // Extract VBO name from stage name
  if (stageName.includes("Excel")) return "MS Excel VBO";
  if (stageName.includes("Email")) return "Email - POP3/SMTP";
  if (stageName.includes("Collection")) return "Utility - Collection Manipulation";
  if (stageName.includes("SAP")) return "SAP Application Server";
  if (stageName.includes("File")) return "Utility - File Management";
  if (stageName.includes("String")) return "Utility - Strings";
  if (stageName.includes("Environment")) return "Utility - Environment";
  if (stageName.includes("Math")) return "Utility - Math";
  if (stageName.includes("Date")) return "Utility - Date and Time";
  if (stageName.includes("Web")) return "Web API";
  if (stageName.includes("Database")) return "Database";
  
  return stageName;
}

function extractActionName(stageName: string): string {
  // Extract action name from full stage name
  const parts = stageName.split(/\s+/);
  if (parts.length > 1) {
    // Remove common prefixes like [Excel], [Email], etc.
    const cleaned = stageName.replace(/^\[.*?\]\s*/, "");
    return cleaned || stageName;
  }
  return stageName;
}
