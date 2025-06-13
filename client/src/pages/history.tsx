import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Download, FileText, Calendar, Puzzle, Play } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import type { ProcessAnalysis } from "@shared/schema";

export default function History() {
  const [, navigate] = useLocation();

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['/api/analyses'],
    queryFn: async () => {
      const response = await fetch('/api/analyses');
      if (!response.ok) throw new Error('Failed to fetch analyses');
      return response.json() as ProcessAnalysis[];
    }
  });

  const handleViewAnalysis = (id: number) => {
    navigate(`/analysis/${id}`);
  };

  const handleExportAnalysis = (analysis: ProcessAnalysis) => {
    const dependencies = analysis.dependencies as any[];
    const csvContent = [
      ["Type", "Name", "Business Object", "Usage Count", "Locations"],
      ...dependencies.map(dep => [
        dep.type,
        dep.name,
        dep.businessObject,
        dep.usageCount.toString(),
        dep.locations.join("; ")
      ])
    ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.fileName}_dependencies.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-bp-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bp-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bp-dark mb-2">Analysis History</h1>
          <p className="text-gray-600">View and manage your previous Blue Prism process analyses</p>
        </div>

        {analyses.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
              <p className="text-gray-500 mb-6">Upload your first .bpprocess file to get started</p>
              <Button onClick={() => navigate('/')} className="bg-bp-blue text-white hover:bg-blue-700">
                Upload Process File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-bp-dark">
                Process Analyses ({analyses.length})
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Process Name</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Dependencies</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="text-bp-blue mr-3 h-5 w-5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {analysis.processName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {analysis.totalStages} stages • {analysis.subsheetCount} subsheets
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{analysis.fileName}</div>
                        <div className="text-sm text-gray-500">
                          {(analysis.fileSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 w-fit">
                            <Puzzle className="mr-1 h-3 w-3" />
                            {analysis.vboCount} VBOs
                          </Badge>
                          <Badge variant="outline" className="bg-green-100 text-green-800 w-fit">
                            <Play className="mr-1 h-3 w-3" />
                            {analysis.actionCount} Actions
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-1 h-4 w-4" />
                          {format(new Date(), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAnalysis(analysis.id)}
                            className="text-bp-blue hover:bg-blue-50"
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportAnalysis(analysis)}
                            className="text-bp-green hover:bg-green-50"
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}