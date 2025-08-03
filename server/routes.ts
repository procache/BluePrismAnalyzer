import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parseString } from "xml2js";
import { z } from "zod";
import { type VBODependency, type VBOAction } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.bpprocess') || file.originalname.endsWith('.bpobject') || file.mimetype === 'text/xml' || file.mimetype === 'application/xml') {
      cb(null, true);
    } else {
      cb(new Error('Only .bpprocess and .bpobject files are allowed'));
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

      res.json(analysisData);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze file" 
      });
    }
  });



  // Upload and analyze .bpobject file
  app.post("/api/analyze-vbo", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.file.originalname.endsWith('.bpobject')) {
        return res.status(400).json({ message: "Invalid file type. Please upload a .bpobject file" });
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
        return res.status(400).json({ message: "Invalid .bpobject file format" });
      }

      const processData = result.process.$;
      const vboName = processData.name || "Unknown VBO";
      const version = processData.version || "1.0";
      const narrative = processData.narrative || "";
      
      // Extract actions (SubSheetInfo stages)
      const stages = result.process.stage || [];
      const actions = extractVBOActions(stages);
      
      // Extract elements from appdef
      const elements = extractVBOElements(result.process.appdef || []);
      
      const analysisData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        vboName,
        version,
        narrative,
        actionCount: actions.length,
        elementCount: elements.length,
        actions,
        elements,
      };

      res.json(analysisData);
    } catch (error) {
      console.error("VBO Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze VBO file" 
      });
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
    
    // Look for resource tags that define VBO usage
    if (stage.resource && stage.resource.length > 0) {
      const resource = stage.resource[0].$;
      const vboName = resource.object;
      const actionName = resource.action;
      
      if (vboName && actionName) {
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

        // Create unique action key
        const actionKey = `${actionName}-${vboName}`;
        
        // Check if action already exists in this VBO
        const existingAction = vbo.actions.find(action => action.name === actionName);
        
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

function extractVBOActions(stages: any[]): any[] {
  const actions: any[] = [];
  
  stages.forEach((stage: any) => {
    const stageData = stage.$;
    const stageType = stageData.type;
    
    if (stageType === "SubSheetInfo") {
      const name = stageData.name;
      const id = stageData.stageid;
      const narrative = stage.narrative?.[0] || "";
      
      // Extract inputs and outputs
      const inputs = (stage.input || []).map((input: any) => ({
        name: input.$.name || "",
        type: input.$.type || "text",
        description: input.$.description || "",
      }));

      const outputs = (stage.output || []).map((output: any) => ({
        name: output.$.name || "",
        type: output.$.type || "text", 
        description: output.$.description || "",
      }));

      actions.push({
        id,
        name,
        type: stageType,
        description: narrative.trim() || undefined,
        inputs: inputs.length > 0 ? inputs : undefined,
        outputs: outputs.length > 0 ? outputs : undefined,
      });
    }
  });
  
  return actions;
}

function extractVBOElements(appdefArray: any[]): any[] {
  const elements: any[] = [];
  
  if (!appdefArray || appdefArray.length === 0) {
    return elements;
  }
  
  const appdef = appdefArray[0];
  if (appdef.element) {
    extractElementsRecursive(appdef.element, elements, "");
  }
  
  return elements;
}

function extractElementsRecursive(elementArray: any[], elements: any[], parentPath: string, parentId?: string): void {
  if (!elementArray) return;
  
  elementArray.forEach((element: any) => {
    const name = element.$.name;
    const id = element.id?.[0];
    const type = element.type?.[0] || element.$.type || "element";
    
    if (name && id) {
      const currentPath = parentPath ? `${parentPath} - ${name}` : name;
      
      // Extract attributes
      const attributes: Record<string, any> = {};
      if (element.attributes && element.attributes[0] && element.attributes[0].attribute) {
        element.attributes[0].attribute.forEach((attr: any) => {
          const attrName = attr.$.name;
          const processValue = attr.ProcessValue?.[0];
          if (attrName && processValue) {
            attributes[attrName] = {
              datatype: processValue.$.datatype,
              value: processValue.$.value,
              inuse: attr.$.inuse === "True",
            };
          }
        });
      }

      elements.push({
        id,
        name,
        type,
        parentId,
        path: currentPath,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      });

      // Process child elements
      if (element.element) {
        extractElementsRecursive(element.element, elements, currentPath, id);
      }
      
      // Process groups
      if (element.group) {
        element.group.forEach((group: any) => {
          const groupName = group.$.name;
          const groupId = group.id?.[0];
          if (groupName && groupId) {
            const groupPath = `${currentPath} - ${groupName}`;
            elements.push({
              id: groupId,
              name: groupName,
              type: "group",
              parentId: id,
              path: groupPath,
            });
            
            if (group.element) {
              extractElementsRecursive(group.element, elements, groupPath, groupId);
            }
          }
        });
      }
    }
  });
}
