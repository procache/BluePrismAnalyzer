import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, ArrowUpDown, Puzzle, Play, Box, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProcessAnalysis, VBODependency } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: ProcessAnalysis;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const dependencies = analysis.dependencies as VBODependency[];

  const filteredAndSortedDependencies = useMemo(() => {
    if (!dependencies || !Array.isArray(dependencies)) {
      return [];
    }
    
    let filtered = dependencies.filter(vbo => {
      if (!vbo || !vbo.name || !vbo.actions) return false;
      const matchesSearch = vbo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vbo.actions.some(action => action.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField as keyof VBODependency];
        let bValue: any = b[sortField as keyof VBODependency];

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [dependencies, searchTerm, typeFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = () => {
    const csvRows = [
      ["Business Object", "Action", "Usage Count", "Locations"]
    ];
    
    filteredAndSortedDependencies.forEach(vbo => {
      vbo.actions.forEach(action => {
        csvRows.push([
          vbo.name,
          action.name,
          action.usageCount.toString(),
          action.locations.join("; ")
        ]);
      });
    });

    const csvContent = csvRows.map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.fileName}_dependencies.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Dependencies exported to CSV file",
    });
  };

  return (
    <>
      {/* Process Summary */}
      <Card className="card-shadow mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-bp-dark">Process Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-bp-blue">{analysis.totalStages}</div>
              <div className="text-sm text-gray-600">Total Stages</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-bp-green">{analysis.vboCount}</div>
              <div className="text-sm text-gray-600">VBO Dependencies</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-bp-orange">{analysis.actionCount}</div>
              <div className="text-sm text-gray-600">Actions Used</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.subsheetCount}</div>
              <div className="text-sm text-gray-600">Sub-sheets</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies Table */}
      <Card className="card-shadow">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-xl font-semibold text-bp-dark">
                Visual Business Objects & Dependencies
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                All VBOs and actions identified in your process
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="Search dependencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              

              
              {/* Export */}
              <Button onClick={handleExport} className="bg-bp-green text-white hover:bg-green-600">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center space-x-1 hover:text-gray-700 p-0"
                  >
                    <span>Visual Business Object</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Locations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDependencies.map((vbo) => (
                <TableRow key={vbo.id} className="table-row hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center">
                      <Box className="text-bp-blue mr-3 h-5 w-5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vbo.name}
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 mt-1">
                          <Puzzle className="mr-1 h-3 w-3" />
                          VBO
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {vbo.actions && vbo.actions.length > 0 ? (
                        vbo.actions.map((action) => (
                          <div key={action.id} className="flex items-center bg-gray-50 rounded-lg p-2">
                            <Play className="text-bp-green mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {action.name}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 italic">No actions found</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vbo.locations.slice(0, 2).map((location: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                          {location}
                        </Badge>
                      ))}
                      {vbo.locations.length > 2 && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                          +{vbo.locations.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedDependencies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No dependencies found matching your criteria</p>
          </div>
        )}
      </Card>
    </>
  );
}
