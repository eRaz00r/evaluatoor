import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCSV } from "@/services/csvService";
import { TestCase } from "@/types";
import { Upload, FileText, AlertCircle, CheckCircle, X, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileUpload: (testCases: TestCase[]) => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === "text/csv" || file.name.endsWith(".csv")
      );
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const fileWithProgress: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...fileWithProgress]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (fileWithProgress: FileWithProgress, index: number) => {
    try {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'processing' } : f
      ));

      const testCases = await parseCSV(fileWithProgress.file);
      
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100, status: 'completed' } : f
      ));

      return testCases;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse CSV file";
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, error: errorMessage, status: 'error' } : f
      ));
      return [];
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const allTestCases: TestCase[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'completed') {
        const testCases = await processFile(files[i], i);
        allTestCases.push(...testCases);
      }
    }

    if (allTestCases.length > 0) {
      onFileUpload(allTestCases);
    }
    setIsUploading(false);
  };

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-white">Upload Test Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-500 bg-opacity-10"
                : "border-white border-opacity-20"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-white opacity-40 mb-2" />
              <p className="text-sm text-white opacity-70 mb-4">
                Drag and drop your CSV files here, or click to browse
              </p>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors bg-black bg-opacity-10 hover:bg-opacity-20 text-white cursor-pointer"
              >
                Browse Files
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((fileWithProgress, index) => (
                <div
                  key={`${fileWithProgress.file.name}-${index}`}
                  className="bg-black bg-opacity-5 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-black bg-opacity-10 rounded-full p-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {fileWithProgress.file.name}
                      </p>
                      <p className="text-xs text-white opacity-50">
                        {(fileWithProgress.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="text-white opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Progress
                      value={fileWithProgress.progress}
                      className="h-1"
                    />
                    {fileWithProgress.error && (
                      <div className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fileWithProgress.error}
                      </div>
                    )}
                    {fileWithProgress.status === 'completed' && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Processed successfully
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          onClick={handleUpload} 
          disabled={files.length === 0 || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin"></span>
              Processing files...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Upload and Process {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          )}
        </Button>
      </CardFooter>
    </>
  );
} 