import Papa from "papaparse";
import { CSVRow, TestCase } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function parseCSV(file: File): Promise<TestCase[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as CSVRow[];
          
          // Validate CSV structure
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
          const testCases: TestCase[] = rows.map((row) => ({
            id: row.id || uuidv4(),
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

export function generateCSV(testCases: TestCase[]): string {
  const rows: CSVRow[] = testCases.map((testCase) => ({
    id: testCase.id,
    input: testCase.input,
    expected_output: testCase.expected_output,
    generated_output: testCase.generated_output || "",
    judgment: testCase.judgment || "",
    judgment_score: testCase.judgment_score?.toString() || "",
    error: testCase.error || "",
  }));
  
  return Papa.unparse(rows);
}

export function generateJSON(testCases: TestCase[]): string {
  return JSON.stringify(testCases, null, 2);
} 