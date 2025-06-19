import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { VBOUpload } from "@/components/vbo-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { VBOAnalysisResults } from "@/components/vbo-analysis-results";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bot, HelpCircle, History as HistoryIcon, FileText, Package } from "lucide-react";
import { useLocation } from "wouter";
import type { ProcessAnalysis, VBOAnalysis } from "@shared/schema";

export default function Home() {
  const [analysis, setAnalysis] = useState<ProcessAnalysis | null>(null);
  const [vboAnalysis, setVboAnalysis] = useState<VBOAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVboUploading, setIsVboUploading] = useState(false);
  const [, navigate] = useLocation();

  const handleAnalysisComplete = (result: ProcessAnalysis) => {
    setAnalysis(result);
    setIsUploading(false);
  };

  const handleVboAnalysisComplete = (result: VBOAnalysis) => {
    setVboAnalysis(result);
    setIsVboUploading(false);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setAnalysis(null);
  };

  const handleVboUploadStart = () => {
    setIsVboUploading(true);
    setVboAnalysis(null);
  };

  const handleUploadError = () => {
    setIsUploading(false);
  };

  const handleVboUploadError = () => {
    setIsVboUploading(false);
  };

  return (
    <div className="bg-bp-surface min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-bp-blue rounded-lg flex items-center justify-center">
                <Bot className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-bp-dark">Blue Prism Process Analyzer</h1>
                <p className="text-sm text-gray-600">Analyze .bpprocess files and extract dependencies</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/history')}
                className="text-bp-blue hover:bg-blue-50"
              >
                <HistoryIcon className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button variant="ghost" className="text-bp-blue hover:bg-blue-50">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Sections */}
        <Card className="card-shadow mb-8">
          <CardContent className="p-8">
            <Tabs defaultValue="process" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="process" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Process Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="vbo" className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>VBO Analysis</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="process">
                <FileUpload
                  onUploadStart={handleUploadStart}
                  onUploadComplete={handleAnalysisComplete}
                  onUploadError={handleUploadError}
                  isUploading={isUploading}
                />
              </TabsContent>
              
              <TabsContent value="vbo">
                <VBOUpload
                  onUploadStart={handleVboUploadStart}
                  onUploadComplete={handleVboAnalysisComplete}
                  onUploadError={handleVboUploadError}
                  isUploading={isVboUploading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Process Analysis Results */}
        {analysis && (
          <div className="fade-in">
            <AnalysisResults analysis={analysis} />
          </div>
        )}

        {/* VBO Analysis Results */}
        {vboAnalysis && (
          <div className="fade-in">
            <VBOAnalysisResults analysis={vboAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
}
