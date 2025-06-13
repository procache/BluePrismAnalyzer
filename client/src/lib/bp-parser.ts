// Blue Prism parser utilities for client-side processing if needed
export interface BPProcessStage {
  id: string;
  name: string;
  type: string;
  subsheetId?: string;
  processId?: string;
}

export interface BPProcessSubsheet {
  id: string;
  name: string;
  type: string;
}

export interface BPProcessData {
  name: string;
  version: string;
  stages: BPProcessStage[];
  subsheets: BPProcessSubsheet[];
}

export function parseProcessName(xmlContent: string): string {
  const nameMatch = xmlContent.match(/name="([^"]+)"/);
  return nameMatch ? nameMatch[1] : "Unknown Process";
}

export function extractStageInfo(stageXml: string): BPProcessStage | null {
  const stageIdMatch = stageXml.match(/stageid="([^"]+)"/);
  const nameMatch = stageXml.match(/name="([^"]+)"/);
  const typeMatch = stageXml.match(/type="([^"]+)"/);
  const subsheetMatch = stageXml.match(/subsheetid="([^"]+)"/);
  const processIdMatch = stageXml.match(/<processid>\[([^\]]+)\]<\/processid>/);

  if (!stageIdMatch || !nameMatch || !typeMatch) {
    return null;
  }

  return {
    id: stageIdMatch[1],
    name: nameMatch[1],
    type: typeMatch[1],
    subsheetId: subsheetMatch?.[1],
    processId: processIdMatch?.[1],
  };
}

export function identifyVBOPatterns(stageName: string): { isVBO: boolean; vboName: string; actionName: string } {
  const vboPatterns = [
    { pattern: /excel/i, vbo: "MS Excel VBO" },
    { pattern: /email/i, vbo: "Email - POP3/SMTP" },
    { pattern: /collection/i, vbo: "Utility - Collection Manipulation" },
    { pattern: /file/i, vbo: "Utility - File Management" },
    { pattern: /string/i, vbo: "Utility - Strings" },
    { pattern: /date/i, vbo: "Utility - Date and Time" },
    { pattern: /math/i, vbo: "Utility - Math" },
    { pattern: /sap/i, vbo: "SAP Application Server" },
    { pattern: /web/i, vbo: "Web API" },
    { pattern: /database/i, vbo: "Database" },
  ];

  for (const { pattern, vbo } of vboPatterns) {
    if (pattern.test(stageName)) {
      const actionName = stageName.replace(/^\[.*?\]\s*/, "").trim() || stageName;
      return { isVBO: true, vboName: vbo, actionName };
    }
  }

  return { isVBO: false, vboName: "", actionName: stageName };
}
