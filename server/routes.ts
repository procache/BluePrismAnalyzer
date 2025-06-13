import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parseString } from "xml2js";
import { z } from "zod";
import { storage } from "./storage";
import { insertProcessAnalysisSchema, type Dependency } from "@shared/schema";

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
      const vbos = dependencies.filter(d => d.type === "vbo");
      const actions = dependencies.filter(d => d.type === "action");
      
      const analysisData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processName,
        totalStages: stages.length,
        vboCount: vbos.length,
        actionCount: actions.length,
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

function extractDependencies(process: any): Dependency[] {
  const dependencies: Map<string, Dependency> = new Map();
  const stages = process.stage || [];
  const subsheets = process.subsheet || [];

  // Extract from main process stages
  extractFromStages(stages, dependencies, "Main Process");

  // Extract from subsheets
  subsheets.forEach((subsheet: any) => {
    const subsheetName = subsheet.name?.[0] || "Unknown Subsheet";
    const subsheetStages = findStagesBySubsheet(stages, subsheet.$.subsheetid);
    extractFromStages(subsheetStages, dependencies, subsheetName);
  });

  return Array.from(dependencies.values());
}

function extractFromStages(stages: any[], dependencies: Map<string, Dependency>, location: string) {
  stages.forEach((stage: any) => {
    const stageData = stage.$;
    const stageName = stageData.name;
    const stageType = stageData.type;

    // Look for SubSheet stages which indicate VBO usage
    if (stageType === "SubSheet") {
      // Extract business object from processid if available
      const processId = stage.processid?.[0];
      if (processId) {
        // This indicates a call to another process/VBO
        const vboKey = `vbo-${stageName}`;
        if (!dependencies.has(vboKey)) {
          dependencies.set(vboKey, {
            id: vboKey,
            type: "vbo",
            name: stageName,
            businessObject: stageName,
            usageCount: 0,
            locations: [],
            description: `Visual Business Object: ${stageName}`
          });
        }
        
        const vbo = dependencies.get(vboKey)!;
        vbo.usageCount++;
        if (!vbo.locations.includes(location)) {
          vbo.locations.push(location);
        }

        // Also create an action entry for this VBO usage
        const actionKey = `action-${stageName}-${location}`;
        if (!dependencies.has(actionKey)) {
          dependencies.set(actionKey, {
            id: actionKey,
            type: "action",
            name: stageName,
            businessObject: stageName,
            usageCount: 1,
            locations: [location],
            description: `Action in ${stageName}`
          });
        }
      }
    }

    // Look for specific business object patterns in stage names
    if (stageName) {
      // Common Blue Prism VBO patterns
      const vboPatterns = [
        /Excel/i,
        /Email/i,
        /Collection/i,
        /Utility/i,
        /File/i,
        /String/i,
        /Date/i,
        /Math/i,
        /Environment/i,
        /SAP/i,
        /Web/i,
        /Database/i
      ];

      vboPatterns.forEach(pattern => {
        if (pattern.test(stageName)) {
          const vboName = extractVBOName(stageName);
          const vboKey = `vbo-${vboName}`;
          
          if (!dependencies.has(vboKey)) {
            dependencies.set(vboKey, {
              id: vboKey,
              type: "vbo",
              name: vboName,
              businessObject: vboName,
              usageCount: 0,
              locations: [],
              description: `Visual Business Object: ${vboName}`
            });
          }
          
          const vbo = dependencies.get(vboKey)!;
          vbo.usageCount++;
          if (!vbo.locations.includes(location)) {
            vbo.locations.push(location);
          }

          // Create action entry
          const actionName = extractActionName(stageName);
          const actionKey = `action-${actionName}-${vboName}`;
          
          if (!dependencies.has(actionKey)) {
            dependencies.set(actionKey, {
              id: actionKey,
              type: "action",
              name: actionName,
              businessObject: vboName,
              usageCount: 0,
              locations: [],
              description: `Action: ${actionName}`
            });
          }
          
          const action = dependencies.get(actionKey)!;
          action.usageCount++;
          if (!action.locations.includes(location)) {
            action.locations.push(location);
          }
        }
      });
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
