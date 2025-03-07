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

/**
 * Interface for tracking file upload progress and status.
 * 
 * We use a dedicated interface to track file status because:
 * 1. It allows us to show progress for each file individually
 * 2. It provides a clear way to represent different file states
 * 3. It makes error handling more granular and user-friendly
 */
interface FileWithProgress {
  file: File;
  progress: number;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

/**
 * Component for uploading and processing CSV files containing test cases.
 * 
 * We implement both drag-and-drop and traditional file selection because:
 * 1. Drag-and-drop provides a more intuitive and efficient user experience
 * 2. Traditional file selection serves as a fallback for accessibility
 * 3. Supporting both methods accommodates different user preferences
 * 
 * The component shows detailed progress and status for each file to provide
 * clear feedback during the upload and processing stages.
 */
export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  /**
   * Handles drag events to provide visual feedback during drag operations.
   * 
   * We use event.preventDefault() and stopPropagation() to:
   * 1. Prevent the browser's default drag behavior
   * 2. Stop the event from bubbling up to parent elements
   * 3. Ensure our custom drag handling takes precedence
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  /**
   * Handles file drop events by filtering for CSV files and adding them to the state.
   * 
   * We filter for CSV files immediately to:
   * 1. Prevent users from uploading unsupported file types
   * 2. Provide immediate feedback about invalid files
   * 3. Avoid processing errors later in the workflow
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Filter for CSV files only to prevent errors with unsupported formats
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, []);

  /**
   * Handles file selection from the file input element.
   * 
   * This provides a traditional file selection method as an alternative
   * to drag-and-drop, ensuring accessibility and user choice.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === "text/csv" || file.name.endsWith(".csv")
      );
      addFiles(selectedFiles);
    }
  };

  /**
   * Adds new files to the state with initial progress and status.
   * 
   * We track files with their progress and status to:
   * 1. Show individual progress for each file
   * 2. Allow users to remove files before processing
   * 3. Provide clear visual feedback about file status
   */
  const addFiles = (newFiles: File[]) => {
    const fileWithProgress: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...fileWithProgress]);
  };

  /**
   * Removes a file from the list by its index.
   * 
   * We allow file removal before processing to:
   * 1. Let users correct mistakes in file selection
   * 2. Give users control over which files to process
   * 3. Prevent unnecessary processing of unwanted files
   */
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Processes a single file by parsing its CSV content.
   * 
   * We process files individually to:
   * 1. Track progress for each file separately
   * 2. Handle errors at the file level rather than aborting all files
   * 3. Provide granular feedback about the processing status
   * 
   * @param fileWithProgress The file to process with its progress tracking
   * @param index The index of the file in the files array
   * @returns Promise resolving to an array of TestCase objects
   */
  const processFile = async (fileWithProgress: FileWithProgress, index: number) => {
    try {
      // Update status to processing to show visual feedback
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'processing' } : f
      ));

      const testCases = await parseCSV(fileWithProgress.file);
      
      // Update status to completed with 100% progress
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100, status: 'completed' } : f
      ));

      return testCases;
    } catch (err) {
      // Handle errors by updating the file status and showing the error message
      const errorMessage = err instanceof Error ? err.message : "Failed to parse CSV file";
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, error: errorMessage, status: 'error' } : f
      ));
      return [];
    }
  };

  /**
   * Handles the upload and processing of all files.
   * 
   * We process files sequentially rather than in parallel to:
   * 1. Prevent overwhelming the browser with multiple large file operations
   * 2. Provide clearer progress tracking for users
   * 3. Ensure consistent resource usage throughout the process
   */
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const allTestCases: TestCase[] = [];

    // Process each file sequentially to avoid overwhelming the browser
    // and to provide clear progress indicators to the user
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'completed') {
        const testCases = await processFile(files[i], i);
        allTestCases.push(...testCases);
      }
    }

    // Only call the callback if we have test cases to avoid empty uploads
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
          {/* Drag and drop area with visual feedback during drag operations */}
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

          {/* File list with progress indicators and status for each file */}
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
                    {/* Progress bar for visual feedback during processing */}
                    <Progress
                      value={fileWithProgress.progress}
                      className="h-1"
                    />
                    {/* Error message display for failed files */}
                    {fileWithProgress.error && (
                      <div className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fileWithProgress.error}
                      </div>
                    )}
                    {/* Success message for completed files */}
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
        {/* Upload button with dynamic text based on file count and upload state */}
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