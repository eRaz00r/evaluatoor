export interface LLMModel {
  name: string;
  id: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  generated_output?: string;
  judgment?: string;
  judgment_score?: number;
  error?: string;
}

export interface EvaluationResult {
  testCase: TestCase;
  generatedOutput: string;
  judgment?: string;
  judgmentScore?: number;
  error?: string;
}

export interface CSVRow {
  id: string;
  input: string;
  expected_output: string;
  generated_output?: string;
  judgment?: string;
  judgment_score?: string;
  error?: string;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
} 