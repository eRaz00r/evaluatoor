import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestCase } from "@/types";
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface TestCaseListProps {
  testCases: TestCase[];
}

export function TestCaseList({ testCases }: TestCaseListProps) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  if (testCases.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    if (expandedCase === id) {
      setExpandedCase(null);
    } else {
      setExpandedCase(id);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return "text-white opacity-50";
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreIcon = (score?: number) => {
    if (score === undefined) return null;
    if (score >= 8) return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (score >= 5) return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-white">
          Test Cases <span className="text-white opacity-50 text-sm ml-2">({testCases.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-white border-opacity-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white border-opacity-10 bg-black bg-opacity-5 text-left">
                  <th className="p-3 font-medium text-white opacity-70">ID</th>
                  <th className="p-3 font-medium text-white opacity-70">Input</th>
                  <th className="p-3 font-medium text-white opacity-70">Expected Output</th>
                  <th className="p-3 font-medium text-white opacity-70">Generated Output</th>
                  <th className="p-3 font-medium text-white opacity-70">Score</th>
                  <th className="p-3 font-medium text-white opacity-70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white divide-opacity-10">
                {testCases.map((testCase) => (
                  <React.Fragment key={testCase.id}>
                    <tr 
                      className={`border-b border-white border-opacity-10 hover:bg-black hover:bg-opacity-5 transition-colors ${expandedCase === testCase.id ? 'bg-black bg-opacity-5' : ''}`}
                      onClick={() => toggleExpand(testCase.id)}
                    >
                      <td className="p-3 align-top font-mono text-xs">{testCase.id}</td>
                      <td className="p-3 align-top">
                        <div className="max-h-16 overflow-hidden text-white opacity-80">
                          {testCase.input.length > 100 
                            ? `${testCase.input.substring(0, 100)}...` 
                            : testCase.input}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="max-h-16 overflow-hidden text-white opacity-80">
                          {testCase.expected_output.length > 100 
                            ? `${testCase.expected_output.substring(0, 100)}...` 
                            : testCase.expected_output}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="max-h-16 overflow-hidden text-white opacity-80">
                          {testCase.generated_output 
                            ? (testCase.generated_output.length > 100 
                              ? `${testCase.generated_output.substring(0, 100)}...` 
                              : testCase.generated_output)
                            : <span className="text-white opacity-40">-</span>}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        {testCase.judgment_score !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            {getScoreIcon(testCase.judgment_score)}
                            <span className={`font-medium ${getScoreColor(testCase.judgment_score)}`}>
                              {testCase.judgment_score.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white opacity-40">-</span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <button className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors">
                          {expandedCase === testCase.id ? (
                            <ChevronUp className="h-4 w-4 text-white opacity-60" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-white opacity-60" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedCase === testCase.id && (
                      <tr className="bg-black bg-opacity-30">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-white opacity-70 mb-2">Input</h4>
                              <div className="bg-black bg-opacity-30 p-3 rounded-md text-white opacity-80 whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin">
                                {testCase.input}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-white opacity-70 mb-2">Expected Output</h4>
                              <div className="bg-black bg-opacity-30 p-3 rounded-md text-white opacity-80 whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin">
                                {testCase.expected_output}
                              </div>
                            </div>
                            {testCase.generated_output && (
                              <div className="md:col-span-2">
                                <h4 className="text-sm font-medium text-white opacity-70 mb-2">Generated Output</h4>
                                <div className="bg-black bg-opacity-30 p-3 rounded-md text-white opacity-80 whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin">
                                  {testCase.generated_output}
                                </div>
                              </div>
                            )}
                            {testCase.judgment && (
                              <div className="md:col-span-2">
                                <h4 className="text-sm font-medium text-white opacity-70 mb-2">Judgment</h4>
                                <div className="bg-black bg-opacity-30 p-3 rounded-md text-white opacity-80 whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin">
                                  {testCase.judgment}
                                </div>
                              </div>
                            )}
                            {testCase.error && (
                              <div className="md:col-span-2">
                                <h4 className="text-sm font-medium text-red-400 mb-2">Error</h4>
                                <div className="bg-red-950 bg-opacity-30 border border-red-500 border-opacity-20 p-3 rounded-md text-red-300 whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin">
                                  {testCase.error}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </>
  );
} 