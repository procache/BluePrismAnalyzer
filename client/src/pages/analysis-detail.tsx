import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AnalysisResults } from "@/components/analysis-results";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import type { ProcessAnalysis } from "@shared/schema";

export default function AnalysisDetail() {
  const [, params] = useRoute("/analysis/:id");
  const [, navigate] = useLocation();
  const analysisId = params?.id ? parseInt(params.id) : null;

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['/api/analyses', analysisId],
    queryFn: async () => {
      if (!analysisId) throw new Error('No analysis ID provided');
      const response = await fetch(`/api/analyses/${analysisId}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      return response.json() as ProcessAnalysis;
    },
    enabled: !!analysisId
  });

  if (!analysisId) {
    return (
      <div className="bg-bp-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Analysis ID</h1>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-bp-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-bp-blue mb-4" />
              <p className="text-gray-600">Loading analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-bp-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Analysis Not Found</h1>
            <p className="text-gray-600 mb-4">The requested analysis could not be found.</p>
            <Button onClick={() => navigate('/history')}>View All Analyses</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bp-surface min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/history')}
                className="text-bp-blue hover:bg-blue-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to History
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-bp-dark">{analysis.processName}</h1>
                <p className="text-sm text-gray-600">{analysis.fileName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalysisResults analysis={analysis} />
      </main>
    </div>
  );
}