import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package, Layers, Settings, FolderTree } from "lucide-react";
import { useState } from "react";
import type { VBOAnalysis, VBOElement } from "@shared/schema";

interface VBOAnalysisResultsProps {
  analysis: VBOAnalysis;
}

export function VBOAnalysisResults({ analysis }: VBOAnalysisResultsProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["summary"]));

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const buildElementTree = (elements: VBOElement[]): VBOElement[] => {
    const elementMap = new Map<string, VBOElement & { children: VBOElement[] }>();
    const rootElements: (VBOElement & { children: VBOElement[] })[] = [];
    
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
  };

  const ElementTreeNode = ({ element, level = 0 }: { element: VBOElement & { children?: VBOElement[] }, level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
    const hasChildren = element.children && element.children.length > 0;

    return (
      <div className="ml-4">
        <div 
          className={`flex items-center py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
            level === 0 ? 'font-semibold text-bp-dark' : ''
          }`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />
          ) : (
            <div className="w-5 mr-1" />
          )}
          
          <div className="flex items-center">
            {element.type === 'group' ? (
              <FolderTree className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-green-500" />
            )}
            <span className={level === 0 ? 'text-bp-dark' : 'text-gray-700'}>
              {element.name}
            </span>
            <Badge variant="outline" className="ml-2 text-xs">
              {element.type}
            </Badge>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {element.children!.map((child) => (
              <ElementTreeNode key={child.id} element={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const elementTree = buildElementTree(analysis.elements as VBOElement[]);

  return (
    <>
      {/* VBO Summary */}
      <Card className="card-shadow mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-bp-dark flex items-center">
            <Package className="mr-2 h-5 w-5" />
            VBO Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-bp-dark mb-2">VBO Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{analysis.vboName}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="ml-2 font-medium">{analysis.version}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">File:</span>
                  <span className="ml-2 font-medium">{analysis.fileName}</span>
                </div>
                {analysis.narrative && (
                  <div>
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="ml-2 text-sm text-gray-700 mt-1">{analysis.narrative}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-bp-blue">{analysis.actionCount}</div>
                <div className="text-sm text-gray-600">Actions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-bp-green">{analysis.elementCount}</div>
                <div className="text-sm text-gray-600">Elements</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card className="card-shadow mb-6">
        <Collapsible open={openSections.has("actions")} onOpenChange={() => toggleSection("actions")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="text-lg font-semibold text-bp-dark flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Actions ({analysis.actionCount})
                </div>
                {openSections.has("actions") ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {(analysis.actions as any[]).map((action, index) => (
                  <div key={action.id || index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-bp-dark">{action.name}</h4>
                      <Badge variant="outline">Action</Badge>
                    </div>
                    
                    {action.description && (
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {action.inputs && action.inputs.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 mb-2">Inputs:</h5>
                          <ul className="space-y-1">
                            {action.inputs.map((input: any, idx: number) => (
                              <li key={idx} className="text-sm">
                                <span className="font-medium">{input.name}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">{input.type}</Badge>
                                {input.description && (
                                  <p className="text-xs text-gray-500 mt-1">{input.description}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {action.outputs && action.outputs.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 mb-2">Outputs:</h5>
                          <ul className="space-y-1">
                            {action.outputs.map((output: any, idx: number) => (
                              <li key={idx} className="text-sm">
                                <span className="font-medium">{output.name}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">{output.type}</Badge>
                                {output.description && (
                                  <p className="text-xs text-gray-500 mt-1">{output.description}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Application Elements */}
      <Card className="card-shadow mb-6">
        <Collapsible open={openSections.has("elements")} onOpenChange={() => toggleSection("elements")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="text-lg font-semibold text-bp-dark flex items-center justify-between">
                <div className="flex items-center">
                  <Layers className="mr-2 h-5 w-5" />
                  Application Elements ({analysis.elementCount})
                </div>
                {openSections.has("elements") ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {elementTree.map((element) => (
                  <ElementTreeNode key={element.id} element={element} />
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </>
  );
}