import { VBOActionDef, VBOElement } from "@shared/schema";

export interface VBOData {
  name: string;
  version: string;
  narrative: string;
  actions: VBOActionDef[];
  elements: VBOElement[];
}

export function parseVBOFile(xmlContent: string): VBOData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  const processElement = doc.querySelector('process');
  if (!processElement) {
    throw new Error('Invalid VBO file: No process element found');
  }

  const name = processElement.getAttribute('name') || 'Unknown VBO';
  const version = processElement.getAttribute('version') || '1.0';
  const narrative = processElement.getAttribute('narrative') || '';

  // Extract actions from SubSheetInfo stages
  const actions = extractActions(doc);
  
  // Extract elements from appdef
  const elements = extractElements(doc);

  return {
    name,
    version,
    narrative,
    actions,
    elements,
  };
}

function extractActions(doc: Document): VBOActionDef[] {
  const actions: VBOActionDef[] = [];
  const subSheetInfoStages = doc.querySelectorAll('stage[type="SubSheetInfo"]');
  
  subSheetInfoStages.forEach((stage) => {
    const name = stage.getAttribute('name');
    const id = stage.getAttribute('stageid');
    
    if (name && id) {
      const description = stage.querySelector('narrative')?.textContent?.trim() || '';
      
      // Extract inputs and outputs
      const inputs = Array.from(stage.querySelectorAll('input')).map(input => ({
        name: input.getAttribute('name') || '',
        type: input.getAttribute('type') || 'text',
        description: input.getAttribute('description') || '',
      }));

      const outputs = Array.from(stage.querySelectorAll('output')).map(output => ({
        name: output.getAttribute('name') || '',
        type: output.getAttribute('type') || 'text',
        description: output.getAttribute('description') || '',
      }));

      actions.push({
        id,
        name,
        type: 'SubSheetInfo',
        description: description || undefined,
        inputs: inputs.length > 0 ? inputs : undefined,
        outputs: outputs.length > 0 ? outputs : undefined,
      });
    }
  });

  return actions;
}

function extractElements(doc: Document): VBOElement[] {
  const elements: VBOElement[] = [];
  const appdefElement = doc.querySelector('appdef');
  
  if (appdefElement) {
    extractElementsRecursive(appdefElement, elements, '');
  }

  return elements;
}

function extractElementsRecursive(parent: Element, elements: VBOElement[], parentPath: string, parentId?: string): void {
  const childElements = parent.children;
  
  for (let i = 0; i < childElements.length; i++) {
    const element = childElements[i];
    
    if (element.tagName === 'element' || element.tagName === 'group') {
      const name = element.getAttribute('name');
      const id = element.querySelector('id')?.textContent;
      const type = element.querySelector('type')?.textContent || element.tagName;
      
      if (name && id) {
        const currentPath = parentPath ? `${parentPath} - ${name}` : name;
        
        // Extract attributes
        const attributes: Record<string, any> = {};
        const attributeElements = element.querySelectorAll(':scope > attributes > attribute');
        attributeElements.forEach(attr => {
          const attrName = attr.getAttribute('name');
          const valueElement = attr.querySelector('ProcessValue');
          if (attrName && valueElement) {
            attributes[attrName] = {
              datatype: valueElement.getAttribute('datatype'),
              value: valueElement.getAttribute('value'),
              inuse: attr.hasAttribute('inuse'),
            };
          }
        });

        elements.push({
          id,
          name,
          type,
          parentId,
          path: currentPath,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        });

        // Recursively process child elements
        extractElementsRecursive(element, elements, currentPath, id);
      }
    }
  }
}

export function buildElementTree(elements: VBOElement[]): VBOElement[] {
  const elementMap = new Map<string, VBOElement & { children: VBOElement[] }>();
  const rootElements: VBOElement[] = [];
  
  // Create a map of all elements with children array
  elements.forEach(element => {
    elementMap.set(element.id, { ...element, children: [] });
  });
  
  // Build the tree structure
  elements.forEach(element => {
    const elementWithChildren = elementMap.get(element.id)!;
    
    if (element.parentId) {
      const parent = elementMap.get(element.parentId);
      if (parent) {
        parent.children.push(elementWithChildren);
      }
    } else {
      rootElements.push(elementWithChildren);
    }
  });
  
  return rootElements;
}