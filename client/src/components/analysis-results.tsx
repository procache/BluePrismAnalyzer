import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import { Download, Play, Cog, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProcessAnalysis, VBODependency } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: ProcessAnalysis;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const dependencies = analysis.dependencies as VBODependency[];

  const filteredAndSortedDependencies = useMemo(() => {
    if (!dependencies || !Array.isArray(dependencies)) {
      return [];
    }
    
    let filtered = dependencies.filter(vbo => {
      if (!vbo || !vbo.name || !vbo.actions) return false;
      return true;
    });

    // Always sort VBOs alphabetically by name
    filtered.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return filtered;
  }, [dependencies, typeFilter]);



  const handleExport = () => {
    const csvRows = [
      ["Business Object", "Action", "Usage Count"]
    ];
    
    filteredAndSortedDependencies.forEach(vbo => {
      // Sort actions alphabetically for each VBO
      const sortedActions = vbo.actions
        .slice()
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      
      sortedActions.forEach(action => {
        csvRows.push([
          vbo.name,
          action.name,
          action.usageCount.toString()
        ]);
      });
    });

    // Create CSV content with UTF-8 BOM for better Excel compatibility and autofit
    // The BOM helps Excel recognize UTF-8 encoding and apply autofit automatically
    const csvContent = "\uFEFF" + csvRows.map(row => 
      row.map(field => {
        // Ensure proper escaping and formatting for Excel autofit
        const escapedField = field.replace(/"/g, '""');
        return `"${escapedField}"`;
      }).join(",")
    ).join("\r\n"); // Use Windows line endings for better Excel compatibility

    const blob = new Blob([csvContent], { 
      type: "text/csv;charset=utf-8;" 
    });
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
          <CardTitle className="text-xl font-semibold text-bp-dark">{analysis.processName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-bp-green">{analysis.vboCount}</div>
              <div className="text-sm text-gray-600">VBO Dependencies</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-bp-orange">{analysis.actionCount}</div>
              <div className="text-sm text-gray-600">Actions Used</div>
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
                VBO Dependencies and actions used in the process
              </CardTitle>
            </div>
            <div className="flex items-center space-x-3">
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
                <TableHead>Visual Business Object</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDependencies.map((vbo) => (
                <TableRow key={vbo.id} className="table-row hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {vbo.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {vbo.actions && vbo.actions.length > 0 ? (
                        vbo.actions
                          .slice()
                          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                          .map((action) => (
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
