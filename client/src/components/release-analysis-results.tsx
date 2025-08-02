import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, Package, FileCode, Settings, Calendar, User, ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import type { ReleaseAnalysis, ReleaseProcess, ReleaseVBO, VBOElement, VBOActionDef } from "@shared/schema";

interface ReleaseAnalysisResultsProps {
  analysis: ReleaseAnalysis;
}

export function ReleaseAnalysisResults({ analysis }: ReleaseAnalysisResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const processes = analysis.processes as ReleaseProcess[];
  const vbos = analysis.vbos as ReleaseVBO[];

  const filteredProcesses = useMemo(() => {
    if (!searchTerm) return processes;
    return processes.filter(process => 
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.dependencies.some(dep => dep.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [processes, searchTerm]);

  const filteredVBOs = useMemo(() => {
    if (!searchTerm) return vbos;
    return vbos.filter(vbo => 
      vbo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vbo.actions.some(action => action.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vbos, searchTerm]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Type", "Name", "Version", "Action/Dependency", "Details"]
    ];
    
    processes.forEach(process => {
      process.dependencies.forEach(dep => {
        dep.actions.forEach(action => {
          csvRows.push([
            "Process",
            process.name,
            process.version || "",
            dep.name,
            action.name
          ]);
        });
      });
    });

    vbos.forEach(vbo => {
      vbo.actions.forEach(action => {
        csvRows.push([
          "VBO",
          vbo.name,
          vbo.version || "",
          action.name,
          action.type || ""
        ]);
      });
    });

    const csvContent = csvRows.map(row => row.map(field => `"${field}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.fileName}_release_analysis.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Release analysis exported to CSV file",
    });
  };

  const buildElementTree = (elements: VBOElement[]): VBOElement[] => {
    const elementMap = new Map<string, VBOElement & { children: VBOElement[] }>();
    const rootElements: (VBOElement & { children: VBOElement[] })[] = [];
    
    elements.forEach(element => {
      elementMap.set(element.id, { ...element, children: [] });
    });
    
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
    const [isExpanded, setIsExpanded] = useState(level < 2);
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

  return (
    <>
      <Card className="card-shadow mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-bp-dark flex items-center">
                <Package className="mr-3 h-8 w-8 text-bp-blue" />
                Release Analysis Results
              </CardTitle>
              <p className="text-gray-600 mt-2">{analysis.fileName}</p>
            </div>
            <Button onClick={handleExportCSV} className="bg-bp-blue text-white hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-bp-blue">{analysis.processCount}</div>
              <div className="text-sm text-gray-600">Processes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-bp-blue">{analysis.vboCount}</div>
              <div className="text-sm text-gray-600">VBOs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-bp-blue">{analysis.totalActionCount}</div>
              <div className="text-sm text-gray-600">Total Actions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-bp-blue">{analysis.totalElementCount}</div>
              <div className="text-sm text-gray-600">Total Elements</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center text-sm">
              <Package className="h-4 w-4 mr-2 text-bp-blue" />
              <span className="font-medium">Release:</span>
              <span className="ml-2">{analysis.releaseName}</span>
            </div>
            <div className="flex items-center text-sm">
              <FileCode className="h-4 w-4 mr-2 text-bp-blue" />
              <span className="font-medium">Package:</span>
              <span className="ml-2">{analysis.packageName}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-bp-blue" />
              <span className="font-medium">Created:</span>
              <span className="ml-2">{new Date(analysis.created).toLocaleString()}</span>
            </div>
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-bp-blue" />
              <span className="font-medium">Created by:</span>
              <span className="ml-2">{analysis.createdBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search processes, VBOs, or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processes">Processes ({filteredProcesses.length})</TabsTrigger>
          <TabsTrigger value="vbos">VBOs ({filteredVBOs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          {filteredProcesses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No processes found matching your search.
              </CardContent>
            </Card>
          ) : (
            filteredProcesses.map((process) => (
              <Card key={process.id} className="card-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-bp-dark">{process.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {process.version && (
                          <Badge variant="outline">v{process.version}</Badge>
                        )}
                        <Badge variant="secondary">{process.totalStages} stages</Badge>
                        <Badge variant="secondary">{process.subsheetCount} subsheets</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(process.id)}
                    >
                      {expandedItems.has(process.id) ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </CardHeader>
                {expandedItems.has(process.id) && (
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-medium text-bp-dark">VBO Dependencies ({process.dependencies.length})</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>VBO Name</TableHead>
                              <TableHead>Actions</TableHead>
                              <TableHead>Usage Count</TableHead>
                              <TableHead>Locations</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {process.dependencies.map((dep) => (
                              dep.actions.map((action, idx) => (
                                <TableRow key={`${dep.id}-${idx}`}>
                                  {idx === 0 && (
                                    <TableCell rowSpan={dep.actions.length} className="font-medium">
                                      {dep.name}
                                    </TableCell>
                                  )}
                                  <TableCell>{action.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{action.usageCount}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      {action.locations.map((location, locIdx) => (
                                        <Badge key={locIdx} variant="secondary" className="mr-1 mb-1">
                                          {location}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="vbos" className="space-y-4">
          {filteredVBOs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No VBOs found matching your search.
              </CardContent>
            </Card>
          ) : (
            filteredVBOs.map((vbo, index) => (
              <Card key={`${vbo.id}-${index}`} className="card-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-bp-dark">{vbo.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {vbo.version && (
                          <Badge variant="outline">v{vbo.version}</Badge>
                        )}
                        <Badge variant="secondary">{vbo.actionCount} actions</Badge>
                        <Badge variant="secondary">{vbo.elementCount} elements</Badge>
                      </div>
                      {vbo.narrative && (
                        <p className="text-sm text-gray-600 mt-2">{vbo.narrative}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(vbo.id)}
                    >
                      {expandedItems.has(vbo.id) ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </CardHeader>
                {expandedItems.has(vbo.id) && (
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="actions">
                        <AccordionTrigger>
                          <span className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Actions ({vbo.actions.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Action Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vbo.actions.map((action) => (
                                  <TableRow key={action.id}>
                                    <TableCell className="font-medium">{action.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{action.type}</Badge>
                                    </TableCell>
                                    <TableCell>{action.description || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="elements">
                        <AccordionTrigger>
                          <span className="flex items-center">
                            <FolderTree className="mr-2 h-4 w-4" />
                            Application Elements ({vbo.elementCount})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            {buildElementTree(vbo.elements).map((element) => (
                              <ElementTreeNode key={element.id} element={element} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}