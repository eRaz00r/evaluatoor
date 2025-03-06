"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ModelSelector } from "@/components/ModelSelector";
import { TestCaseList } from "@/components/TestCaseList";
import { LogDisplay } from "@/components/LogDisplay";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry, TestCase } from "@/types";
import { evaluateTestCase, judgeResponse } from "@/services/ollamaService";
import { generateCSV, generateJSON } from "@/services/csvService";
import { downloadFile } from "@/lib/utils";

export default function Home() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [evaluationModelId, setEvaluationModelId] = useState<string>("");
  const [judgeModelId, setJudgeModelId] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const handleFileUpload = (uploadedTestCases: TestCase[]) => {
    setTestCases(uploadedTestCases);
    addLog(`Uploaded ${uploadedTestCases.length} test cases`, "success");
  };

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

    const updatedTestCases = [...testCases];
    let completedCount = 0;

    for (let i = 0; i < updatedTestCases.length; i++) {
      const testCase = updatedTestCases[i];
      try {
        // Evaluate
        addLog(`Evaluating test case ${testCase.id}...`, "info");
        const generatedOutput = await evaluateTestCase(evaluationModelId, testCase);
        
        updatedTestCases[i] = {
          ...testCase,
          generated_output: generatedOutput,
          error: undefined, // Clear any previous errors
        };
        
        // Update test cases immediately after evaluation
        setTestCases([...updatedTestCases]);
        addLog(`Completed evaluation for test case ${testCase.id}`, "success");
        
        // Judge
        addLog(`Judging test case ${testCase.id}...`, "info");
        const { judgment, score } = await judgeResponse(judgeModelId, updatedTestCases[i]);
        
        updatedTestCases[i] = {
          ...updatedTestCases[i],
          judgment,
          judgment_score: score,
        };
        
        // Update test cases immediately after judgment
        setTestCases([...updatedTestCases]);
        addLog(`Completed judgment for test case ${testCase.id} with score: ${score}`, "success");
      } catch (error) {
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

  const handleDownloadCSV = () => {
    const csvData = generateCSV(testCases);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(csvData, `llm-evaluation-${timestamp}.csv`, "text/csv");
    addLog("Downloaded results as CSV", "success");
  };

  const handleDownloadJSON = () => {
    const jsonData = generateJSON(testCases);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(jsonData, `llm-evaluation-${timestamp}.json`, "application/json");
    addLog("Downloaded results as JSON", "success");
  };

  const isProcessing = isEvaluating || isJudging;
  const hasResults = testCases.some((tc) => tc.generated_output);
  const hasJudgments = testCases.some((tc) => tc.judgment);
  const hasTestCases = testCases.length > 0;

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
          {/* File Upload - Now in its own row above model selectors */}
          <div className="glass-card card-glow">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
          
          {/* Model Selection - In a separate row below file upload */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card card-glow">
              <ModelSelector 
                title="Evaluation Model" 
                onModelSelect={setEvaluationModelId} 
                selectedModelId={evaluationModelId}
                disabled={!hasTestCases}
              />
            </div>
            
            <div className="glass-card card-glow">
              <ModelSelector 
                title="Judge Model" 
                onModelSelect={setJudgeModelId} 
                selectedModelId={judgeModelId}
                disabled={!hasTestCases}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="glass-card card-glow">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Actions</h2>
            </div>
            <div className="p-6">
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
                {/* Combined Run Evals button */}
                <button 
                  onClick={handleRunEvals} 
                  disabled={isEvaluating || !hasTestCases || !evaluationModelId || !judgeModelId}
                  className={`px-4 py-2 rounded-md font-medium ${!hasTestCases ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                >
                  {isEvaluating ? "Processing..." : "Run Evals"}
                </button>
                
                <div className="flex-1"></div>
                
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

          {/* Test Cases Table - Made Scrollable */}
          {hasTestCases && (
            <div className="glass-card card-glow">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Test Cases</h2>
              </div>
              <div className="p-0 max-h-[500px] overflow-auto">
                <TestCaseList testCases={testCases} />
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="glass-card card-glow">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Logs</h2>
            </div>
            <div className="p-0 max-h-[300px] overflow-auto">
              <LogDisplay logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
