"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ModelSelector } from "@/components/ModelSelector";
import { ModelConfig } from "@/components/ModelConfig";
import { TestCaseList } from "@/components/TestCaseList";
import { LogDisplay } from "@/components/LogDisplay";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry, TestCase, ModelConfig as ModelConfigType, DEFAULT_MODEL_CONFIG } from "@/types";
import { evaluateTestCase, judgeResponse } from "@/services/ollamaService";
import { generateCSV, generateJSON } from "@/services/csvService";
import { downloadFile } from "@/lib/utils";

/**
 * Main application component that orchestrates the LLM evaluation workflow.
 * 
 * We use a single-page architecture to minimize context switching for users
 * and provide a streamlined workflow from file upload to results download.
 * The component maintains all state centrally to ensure data consistency
 * across the evaluation pipeline and to simplify the debugging process.
 */
export default function Home() {
  // State is centralized in the main component to maintain a single source of truth
  // and to simplify state management without requiring a state management library
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [evaluationModelId, setEvaluationModelId] = useState<string>("");
  const [judgeModelId, setJudgeModelId] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelConfig, setModelConfig] = useState<ModelConfigType>(DEFAULT_MODEL_CONFIG);

  /**
   * Adds a log entry to the log display.
   * 
   * We use a timestamp-based logging system to provide users with a chronological
   * view of the evaluation process, which is crucial for debugging and understanding
   * the flow of operations, especially for long-running evaluations.
   */
  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prevLogs) => [
      ...prevLogs,
      {
        timestamp: new Date(),
        message,
        type,
      },
    ]);
  };

  /**
   * Handles file upload by updating the test cases state.
   * 
   * We separate the file upload logic from the evaluation logic to allow
   * users to upload files without immediately starting the evaluation process.
   * This gives users time to review and select appropriate models.
   */
  const handleFileUpload = (uploadedTestCases: TestCase[]) => {
    setTestCases(uploadedTestCases);
    addLog(`Uploaded ${uploadedTestCases.length} test cases`, "success");
  };

  /**
   * Handles changes to the model configuration.
   * 
   * We only allow configuration changes when not evaluating to ensure
   * consistent parameters throughout the evaluation process.
   */
  const handleConfigChange = (newConfig: ModelConfigType) => {
    if (!isEvaluating) {
      setModelConfig(newConfig);
      addLog(`Updated model configuration: Context window=${newConfig.contextWindowSize}, Temperature=${newConfig.temperature}`, "info");
    }
  };

  /**
   * Runs both evaluation and judgment in a single operation.
   * 
   * We process test cases sequentially rather than in parallel to:
   * 1. Prevent overwhelming the local Ollama instance
   * 2. Provide clearer progress tracking for users
   * 3. Allow for immediate feedback on each test case
   * 4. Ensure consistent resource usage throughout the process
   * 
   * We update the UI after each test case to give users immediate feedback
   * rather than waiting for all test cases to complete.
   */
  const handleRunEvals = async () => {
    if (!evaluationModelId || !judgeModelId) {
      addLog("Please select both evaluation and judge models", "error");
      return;
    }

    if (testCases.length === 0) {
      addLog("Please upload test cases first", "error");
      return;
    }

    setIsEvaluating(true);
    setProgress(0);
    addLog(`Starting evaluation with models: ${evaluationModelId} (eval) and ${judgeModelId} (judge)`, "info");
    addLog(`Using configuration: Context window=${modelConfig.contextWindowSize}, Temperature=${modelConfig.temperature}`, "info");

    const updatedTestCases = [...testCases];
    let completedCount = 0;

    // Process each test case sequentially to avoid overwhelming Ollama
    // and to provide clear progress indicators to the user
    for (let i = 0; i < updatedTestCases.length; i++) {
      const testCase = updatedTestCases[i];
      try {
        // Evaluate
        addLog(`Evaluating test case ${testCase.id}...`, "info");
        const generatedOutput = await evaluateTestCase(evaluationModelId, testCase, modelConfig);
        
        updatedTestCases[i] = {
          ...testCase,
          generated_output: generatedOutput,
          error: undefined, // Clear any previous errors
        };
        
        // Update test cases immediately after evaluation to show progress
        // This provides immediate feedback rather than waiting for all cases
        setTestCases([...updatedTestCases]);
        addLog(`Completed evaluation for test case ${testCase.id}`, "success");
        
        // Judge
        addLog(`Judging test case ${testCase.id}...`, "info");
        const { judgment, score } = await judgeResponse(judgeModelId, updatedTestCases[i], modelConfig);
        
        updatedTestCases[i] = {
          ...updatedTestCases[i],
          judgment,
          judgment_score: score,
        };
        
        // Update test cases immediately after judgment
        setTestCases([...updatedTestCases]);
        addLog(`Completed judgment for test case ${testCase.id} with score: ${score}`, "success");
      } catch (error) {
        // Error handling preserves the test case but marks it as failed
        // This allows users to retry failed cases without losing their data
        updatedTestCases[i] = {
          ...testCase,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        // Update test cases immediately after error
        setTestCases([...updatedTestCases]);
        addLog(`Error processing test case ${testCase.id}: ${updatedTestCases[i].error}`, "error");
      }

      completedCount++;
      setProgress(Math.round((completedCount / updatedTestCases.length) * 100));
    }

    setIsEvaluating(false);
    addLog("All evaluations and judgments completed", "success");
  };

  /**
   * Handles CSV download of test case results.
   * 
   * We use CSV as the primary export format because:
   * 1. It's widely compatible with spreadsheet software
   * 2. It's easy to parse and analyze
   * 3. It maintains the tabular structure of the data
   */
  const handleDownloadCSV = () => {
    const csvData = generateCSV(testCases);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(csvData, `llm-evaluation-${timestamp}.csv`, "text/csv");
    addLog("Downloaded results as CSV", "success");
  };

  /**
   * Handles JSON download of test case results.
   * 
   * We offer JSON as an alternative format because:
   * 1. It preserves the full data structure including nested objects
   * 2. It's easier to process programmatically
   * 3. It's the native format for many data analysis tools
   */
  const handleDownloadJSON = () => {
    const jsonData = generateJSON(testCases);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(jsonData, `llm-evaluation-${timestamp}.json`, "application/json");
    addLog("Downloaded results as JSON", "success");
  };

  // Derived state values to simplify conditional rendering logic
  const hasResults = testCases.some((tc) => tc.generated_output);
  const hasTestCases = testCases.length > 0;

  // The UI is structured in a top-down workflow that guides users through
  // the evaluation process in a logical sequence
  return (
    <main className="min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block p-2 px-4 rounded-full mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>Local LLM Evaluation Tool</span>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Evaluatoor
          </h1>
          <p className="text-lg mb-4 mx-auto max-w-2xl" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Upload test cases, run evaluations, and judge results using local LLMs via Ollama
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* File Upload - Placed first to establish the workflow sequence */}
          <div className="glass-card card-glow">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
          
          {/* Model Selection and Configuration */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Model Selectors */}
            <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
              <div className="glass-card card-glow">
                <ModelSelector 
                  title="Evaluation Model" 
                  onModelSelect={setEvaluationModelId} 
                  selectedModelId={evaluationModelId}
                  disabled={!hasTestCases || isEvaluating}
                />
              </div>
              
              <div className="glass-card card-glow">
                <ModelSelector 
                  title="Judge Model" 
                  onModelSelect={setJudgeModelId} 
                  selectedModelId={judgeModelId}
                  disabled={!hasTestCases || isEvaluating}
                />
              </div>
            </div>
            
            {/* Model Configuration */}
            <div className="glass-card card-glow">
              <div className="p-6">
                <ModelConfig 
                  config={modelConfig} 
                  onConfigChange={handleConfigChange}
                  disabled={isEvaluating}
                />
              </div>
            </div>
          </div>

          {/* Actions - Contains the main workflow controls */}
          <div className="glass-card card-glow">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Actions</h2>
            </div>
            <div className="p-6">
              {/* Progress indicator only shown during evaluation for visual feedback */}
              {isEvaluating && (
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Evaluation Progress
                    </p>
                    <span className="text-sm font-medium text-white">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <div className="flex flex-wrap gap-4">
                {/* Combined Run Evals button - Primary action for the workflow */}
                <button 
                  onClick={handleRunEvals} 
                  disabled={isEvaluating || !hasTestCases || !evaluationModelId || !judgeModelId}
                  className={`px-4 py-2 rounded-md font-medium ${!hasTestCases ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                >
                  {isEvaluating ? "Processing..." : "Run Evals"}
                </button>
                
                <div className="flex-1"></div>
                
                {/* Download buttons - Only enabled after results are available */}
                <button 
                  onClick={handleDownloadCSV} 
                  disabled={!hasResults}
                  className="glass-button px-4 py-2 rounded-md"
                >
                  Download CSV
                </button>
                
                <button 
                  onClick={handleDownloadJSON} 
                  disabled={!hasResults}
                  className="glass-button px-4 py-2 rounded-md"
                >
                  Download JSON
                </button>
              </div>
            </div>
          </div>

          {/* Test Cases Table - Only shown when test cases exist */}
          {hasTestCases && (
            <div className="glass-card card-glow">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Test Cases</h2>
              </div>
              {/* Scrollable container limits height to prevent overwhelming the UI */}
              <div className="p-0 max-h-[500px] overflow-auto">
                <TestCaseList testCases={testCases} />
              </div>
            </div>
          )}

          {/* Logs - Always visible to provide system feedback */}
          <div className="glass-card card-glow">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Logs</h2>
            </div>
            {/* Scrollable container with fixed height to maintain UI consistency */}
            <div className="p-0 max-h-[300px] overflow-auto">
              <LogDisplay logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
