import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parseString } from "xml2js";
import { z } from "zod";
import { storage } from "./storage";
import { insertProcessAnalysisSchema, insertVBOAnalysisSchema, insertReleaseAnalysisSchema, type VBODependency, type VBOAction, type VBOElement, type VBOActionDef, type ReleaseProcess, type ReleaseVBO } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.bpprocess') || file.originalname.endsWith('.bpobject') || file.originalname.endsWith('.bprelease') || file.mimetype === 'text/xml' || file.mimetype === 'application/xml') {
      cb(null, true);
    } else {
      cb(new Error('Only .bpprocess, .bpobject, and .bprelease files are allowed'));
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

      // Validate and store
      const validatedData = insertVBOAnalysisSchema.parse(analysisData);
      const savedAnalysis = await storage.createVBOAnalysis(validatedData);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("VBO Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze VBO file" 
      });
    }
  });

  // Get all VBO analyses
  app.get("/api/vbo-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllVBOAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get VBO analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve VBO analyses" });
    }
  });

  // Get specific VBO analysis
  app.get("/api/vbo-analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getVBOAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "VBO analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get VBO analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve VBO analysis" });
    }
  });

  // Upload and analyze .bprelease file
  app.post("/api/analyze-release", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.file.originalname.endsWith('.bprelease')) {
        return res.status(400).json({ message: "Invalid file type. Please upload a .bprelease file" });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      
      // Parse XML
      const result = await new Promise<any>((resolve, reject) => {
        parseString(xmlContent, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (!result['bpr:release']) {
        return res.status(400).json({ message: "Invalid .bprelease file format" });
      }

      const releaseData = result['bpr:release'];
      const releaseName = releaseData['bpr:name']?.[0] || "Unknown Release";
      const packageName = releaseData['bpr:package-name']?.[0] || "Unknown Package";
      const created = releaseData['bpr:created']?.[0] || "";
      const createdBy = releaseData['bpr:user-created-by']?.[0] || "Unknown";
      const releaseNotes = releaseData['bpr:release-notes']?.[0] || "";

      // Extract contents
      const contents = releaseData['bpr:contents']?.[0] || {};
      let processes: ReleaseProcess[] = [];
      let vbos: ReleaseVBO[] = [];

      // Parse processes from the release
      if (contents.process) {
        const processArray = Array.isArray(contents.process) ? contents.process : [contents.process];
        processes = processArray.map((processItem: any) => {
          const processContent = processItem.process;
          if (processContent && processItem.$) {
            const processAttrs = processContent.$ || {};
            const stages = processContent.stage || [];
            const subsheets = processContent.subsheet || [];
            
            // Extract dependencies for this process
            const dependencies = extractDependencies(processContent);
            
            return {
              id: processItem.$.id || "unknown",
              name: processItem.$.name || processAttrs.name || "Unknown Process",
              version: processAttrs.version || "1.0",
              totalStages: stages.length,
              subsheetCount: subsheets.length,
              dependencies: dependencies,
            };
          }
          return null;
        }).filter(Boolean);
      }

      // Parse VBO references from object-group (bprelease files typically only contain references, not full definitions)
      const vboRefs = new Set<string>();
      if (contents['object-group']) {
        const objectGroups = Array.isArray(contents['object-group']) ? contents['object-group'] : [contents['object-group']];
        objectGroups.forEach((group: any) => {
          if (group.members && group.members[0] && group.members[0].object) {
            const refs = Array.isArray(group.members[0].object) ? group.members[0].object : [group.members[0].object];
            refs.forEach((ref: any) => {
              if (ref.$ && ref.$.id) {
                vboRefs.add(ref.$.id);
                vbos.push({
                  id: ref.$.id,
                  name: "Referenced VBO (not included in release)",
                  version: "unknown",
                  narrative: "VBO referenced by ID but definition not included in this release file",
                  actionCount: 0,
                  elementCount: 0,
                  actions: [],
                  elements: [],
                });
              }
            });
          }
        });
      }

      // Calculate totals
      const totalActionCount = processes.reduce((sum, p) => sum + p.dependencies.reduce((pSum, dep) => pSum + dep.actions.length, 0), 0) +
                             vbos.reduce((sum, v) => sum + v.actionCount, 0);
      const totalElementCount = vbos.reduce((sum, v) => sum + v.elementCount, 0);

      const analysisData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        releaseName,
        packageName,
        created,
        createdBy,
        processCount: processes.length,
        vboCount: vbos.length,
        totalActionCount,
        totalElementCount,
        processes,
        vbos,
        releaseNotes,
      };

      // Validate and store
      const validatedData = insertReleaseAnalysisSchema.parse(analysisData);
      const savedAnalysis = await storage.createReleaseAnalysis(validatedData);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Release Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze release file" 
      });
    }
  });

  // Get all release analyses
  app.get("/api/release-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllReleaseAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get release analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve release analyses" });
    }
  });

  // Get specific release analysis
  app.get("/api/release-analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getReleaseAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Release analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get release analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve release analysis" });
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
