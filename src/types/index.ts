/**
 * Represents an LLM model available in Ollama.
 * 
 * We separate the model name from its ID to:
 * 1. Allow for more descriptive display names in the UI
 * 2. Support future extensions like model versioning or tags
 * 3. Maintain compatibility with the Ollama API structure
 */
export interface LLMModel {
  name: string;
  id: string;
}

/**
 * Represents a test case for LLM evaluation.
 * 
 * We use a comprehensive structure that tracks:
 * 1. The original test case data (input and expected output)
 * 2. The evaluation results (generated output and judgment)
 * 3. Error states for robust error handling
 * 
 * Optional fields allow the same structure to be used throughout
 * the evaluation pipeline, from initial upload to final results.
 */
export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  generated_output?: string;
  judgment?: string;
  judgment_score?: number;
  error?: string;
}

/**
 * Represents the result of an evaluation process.
 * 
 * This interface is used for internal processing and combines:
 * 1. The original test case for context
 * 2. The generated output from the evaluation model
 * 3. The judgment from the judge model
 * 4. Any errors that occurred during processing
 * 
 * This structure simplifies passing evaluation data between components.
 */
export interface EvaluationResult {
  testCase: TestCase;
  generatedOutput: string;
  judgment?: string;
  judgmentScore?: number;
  error?: string;
}

/**
 * Represents a row in a CSV file for import/export.
 * 
 * We use string types for all fields because:
 * 1. CSV files store all data as strings
 * 2. It simplifies parsing and serialization
 * 3. It maintains compatibility with various CSV formats
 * 
 * This interface serves as a bridge between the file format
 * and our internal data structures.
 */
export interface CSVRow {
  id: string;
  input: string;
  expected_output: string;
  generated_output?: string;
  judgment?: string;
  judgment_score?: string;
  error?: string;
}

/**
 * Represents a log entry in the application.
 * 
 * We use a structured logging approach to:
 * 1. Provide consistent formatting for all log entries
 * 2. Support different log levels for visual differentiation
 * 3. Include timestamps for chronological tracking
 * 
 * This helps users understand the sequence and nature of events
 * during the evaluation process.
 */
export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
} 