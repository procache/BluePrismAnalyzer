import { useState } from "react";
import { UnifiedUpload } from "@/components/unified-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { VBOAnalysisResults } from "@/components/vbo-analysis-results";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import type { ProcessAnalysis, VBOAnalysis } from "@shared/schema";

export default function Home() {
  const [analysis, setAnalysis] = useState<ProcessAnalysis | null>(null);
  const [vboAnalysis, setVboAnalysis] = useState<VBOAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);


  const handleProcessAnalysisComplete = (result: ProcessAnalysis) => {
    setAnalysis(result);
    setVboAnalysis(null); // Clear VBO analysis when process analysis is complete
    setIsUploading(false);
  };

  const handleVboAnalysisComplete = (result: VBOAnalysis) => {
    setVboAnalysis(result);
    setAnalysis(null); // Clear process analysis when VBO analysis is complete
    setIsUploading(false);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setAnalysis(null);
    setVboAnalysis(null);
  };

  const handleUploadError = () => {
    setIsUploading(false);
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
                <h1 className="text-2xl font-bold text-bp-dark">Blue Prism Dependency Explorer</h1>
                <p className="text-sm text-gray-600">Analyze .bpprocess files and extract dependencies</p>
                <p className="text-sm text-gray-600">Analyze .bpobject files and extract Application Modeller structure</p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unified File Upload Section */}
        <Card className="card-shadow mb-8">
          <CardContent className="p-8">
            <UnifiedUpload
              onProcessAnalysisComplete={handleProcessAnalysisComplete}
              onVBOAnalysisComplete={handleVboAnalysisComplete}
              onUploadStart={handleUploadStart}
              onUploadError={handleUploadError}
              isUploading={isUploading}
            />
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
