import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FolderOpen, FileCode, X, Cog } from "lucide-react";
import robotImagePath from "@assets/image_1754244472536.png";
import { apiRequest } from "@/lib/queryClient";
import type { ProcessAnalysis } from "@shared/schema";

interface FileUploadProps {
  onUploadStart: () => void;
  onUploadComplete: (analysis: ProcessAnalysis) => void;
  onUploadError: () => void;
  isUploading: boolean;
}

export function FileUpload({ onUploadStart, onUploadComplete, onUploadError, isUploading }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.bpprocess')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .bpprocess file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    onUploadStart();

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/analyze', formData);
      const analysis = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadComplete(analysis);
        toast({
          title: "File processed successfully!",
          description: `Found ${analysis.vboCount} VBOs and ${analysis.actionCount} actions`,
        });
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError();
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to analyze the .bpprocess file",
        variant: "destructive",
      });
      setProgress(0);
    }
  }, [onUploadStart, onUploadComplete, onUploadError, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.bpprocess'],
      'text/xml': ['.bpprocess'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setProgress(0);
  };

  if (isUploading) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-bp-dark mb-2">Processing your file...</h2>
        <p className="text-gray-600 mb-6">Analyzing process structure and extracting dependencies</p>
        
        <div className="processing-animation">
          <Cog className="mx-auto h-16 w-16 text-bp-blue mb-4 animate-spin" />
        </div>
        <p className="text-lg font-medium text-bp-blue mb-2">Processing your file...</p>
        <p className="text-sm text-gray-500 mb-4">Analyzing process structure and extracting dependencies</p>
        
        <div className="max-w-xs mx-auto">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  if (uploadedFile) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-bp-dark mb-2">Upload Blue Prism Process File</h2>
        <p className="text-gray-600 mb-6">Select or drag and drop your .bpprocess file to analyze its dependencies</p>
        
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileCode className="text-bp-blue h-6 w-6" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB • XML Process File
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-bp-dark mb-2">Upload Blue Prism Process File</h2>
      <p className="text-gray-600 mb-6">Select or drag and drop your .bpprocess file to analyze its dependencies</p>
      
      <div
        {...getRootProps()}
        className={`upload-zone border-2 border-dashed rounded-xl p-12 mb-6 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 ${
          isDragActive
            ? 'border-bp-blue bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        <img src={robotImagePath} alt="Upload" className="mx-auto h-16 w-16 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">Drop your .bpprocess file here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse your computer</p>
        <Button className="bg-bp-blue text-white hover:bg-blue-700">
          <FolderOpen className="mr-2 h-4 w-4" />
          Browse Files
        </Button>
      </div>
    </div>
  );
}
