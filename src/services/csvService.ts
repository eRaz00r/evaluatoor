import Papa from "papaparse";
import { CSVRow, TestCase } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Parses a CSV file into an array of TestCase objects.
 * 
 * We use PapaParse for CSV parsing because:
 * 1. It's robust and handles various CSV formats and edge cases
 * 2. It provides a streaming API for large files
 * 3. It has good error handling and reporting
 * 
 * The function validates the CSV structure to ensure it contains the required columns
 * and generates unique IDs for test cases that don't have them, ensuring data integrity.
 * 
 * @param file The CSV file to parse
 * @returns Promise resolving to an array of TestCase objects
 */
export function parseCSV(file: File): Promise<TestCase[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Use the first row as headers
      skipEmptyLines: true, // Skip empty lines to avoid parsing errors
      complete: (results) => {
        try {
          const rows = results.data as CSVRow[];
          
          // Validate CSV structure before processing to fail fast
          // and provide clear error messages to the user
          if (rows.length === 0) {
            reject(new Error("CSV file is empty"));
            return;
          }
          
          const firstRow = rows[0];
          if (!("input" in firstRow) || !("expected_output" in firstRow)) {
            reject(new Error("CSV file must contain 'input' and 'expected_output' columns"));
            return;
          }
          
          // Convert CSV rows to TestCase objects
          // We generate UUIDs for rows without IDs to ensure uniqueness
          const testCases: TestCase[] = rows.map((row) => ({
            id: row.id || uuidv4(), // Generate UUID if ID is missing
            input: row.input,
            expected_output: row.expected_output,
            generated_output: row.generated_output,
            judgment: row.judgment,
            judgment_score: row.judgment_score ? parseFloat(row.judgment_score) : undefined,
            error: row.error,
          }));
          
          resolve(testCases);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Generates a CSV string from an array of TestCase objects.
 * 
 * We use this function for exporting results because:
 * 1. CSV is a widely supported format for data exchange
 * 2. It preserves the tabular structure of the data
 * 3. It's easy to open in spreadsheet applications
 * 
 * The function ensures all fields are properly represented, even if they're
 * optional or undefined in the TestCase objects.
 * 
 * @param testCases The array of TestCase objects to convert to CSV
 * @returns A CSV string representation of the test cases
 */
export function generateCSV(testCases: TestCase[]): string {
  const rows: CSVRow[] = testCases.map((testCase) => ({
    id: testCase.id,
    input: testCase.input,
    expected_output: testCase.expected_output,
    generated_output: testCase.generated_output || "", // Handle undefined values
    judgment: testCase.judgment || "",
    judgment_score: testCase.judgment_score?.toString() || "",
    error: testCase.error || "",
  }));
  
  return Papa.unparse(rows);
}

/**
 * Generates a JSON string from an array of TestCase objects.
 * 
 * We provide JSON export as an alternative to CSV because:
 * 1. It preserves the full data structure including types
 * 2. It's easier to process programmatically
 * 3. It's the native format for many data analysis tools
 * 
 * The pretty-printing (with indentation) makes the JSON more readable
 * when opened in a text editor.
 * 
 * @param testCases The array of TestCase objects to convert to JSON
 * @returns A JSON string representation of the test cases
 */
export function generateJSON(testCases: TestCase[]): string {
  return JSON.stringify(testCases, null, 2); // Pretty-print with 2-space indentation
} 