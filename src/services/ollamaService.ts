import { LLMModel, TestCase } from "@/types";

/**
 * Base URL for the Ollama API.
 * 
 * We use a constant for the API URL to:
 * 1. Make it easy to change if the Ollama API changes
 * 2. Support different environments (local, development, production)
 * 3. Maintain consistency across all API calls
 */
const OLLAMA_API_BASE_URL = "http://localhost:11434/api";

/**
 * Fetches available models from the local Ollama instance.
 * 
 * We use a dedicated function for model fetching to:
 * 1. Abstract the API call details from the UI components
 * 2. Handle error cases consistently
 * 3. Transform the API response into our application's data model
 * 
 * @returns Promise resolving to an array of LLM models
 */
export async function getAvailableModels(): Promise<LLMModel[]> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE_URL}/tags`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the API response to match our application's data model
    // This decouples our internal representation from the API structure
    return data.models.map((model: any) => ({
      name: model.name,
      id: model.name,
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

/**
 * Generates a response from a specified model using the Ollama API.
 * 
 * We use a non-streaming approach for simplicity and reliability:
 * 1. Easier to handle errors and retries
 * 2. Simpler to process complete responses
 * 3. More consistent behavior across different models
 * 
 * @param modelId The ID of the model to use
 * @param prompt The prompt to send to the model
 * @returns Promise resolving to the generated text response
 */
export async function generateResponse(
  modelId: string,
  prompt: string
): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        prompt: prompt,
        stream: false, // Non-streaming for simplicity and reliability
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate response: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

/**
 * Evaluates a test case by generating a response from the specified model.
 * 
 * This function is a thin wrapper around generateResponse that:
 * 1. Adapts the test case format to the API call
 * 2. Provides specific error handling for test case evaluation
 * 3. Maintains separation of concerns between data and API interaction
 * 
 * @param modelId The ID of the model to use for evaluation
 * @param testCase The test case to evaluate
 * @returns Promise resolving to the generated output
 */
export async function evaluateTestCase(
  modelId: string,
  testCase: TestCase
): Promise<string> {
  try {
    return await generateResponse(modelId, testCase.input);
  } catch (error) {
    console.error(`Error evaluating test case ${testCase.id}:`, error);
    throw error;
  }
}

/**
 * Judges a response by comparing the generated output to the expected output.
 * 
 * We use a structured prompt format to:
 * 1. Guide the judge model to provide consistent evaluations
 * 2. Ensure the output is in a parseable JSON format
 * 3. Standardize the evaluation criteria across different test cases
 * 
 * The fallback parsing logic handles cases where the model doesn't follow
 * the JSON format perfectly, improving robustness with different models.
 * 
 * @param judgeModelId The ID of the model to use for judgment
 * @param testCase The test case containing input, expected output, and generated output
 * @returns Promise resolving to an object containing the judgment and score
 */
export async function judgeResponse(
  judgeModelId: string,
  testCase: TestCase
): Promise<{ judgment: string; score: number }> {
  try {
    const prompt = `
You are an expert evaluator of LLM responses. Your task is to judge the quality of a generated response compared to an expected response.

Context:
- Input prompt: ${testCase.input}
- Expected response: ${testCase.expected_output}
- Generated response: ${testCase.generated_output}

Evaluate the generated response based on the following criteria:
1. Accuracy: How well does it match the factual content of the expected response?
2. Completeness: Does it cover all key points from the expected response?
3. Clarity: Is it well-written and easy to understand?
4. Relevance: Does it directly address the input prompt?

Provide your evaluation in the following format:
1. A score from 0-10 (where 10 is perfect)
2. A brief explanation of your judgment

Your response should be in JSON format. Nothing else.
The JSON object should be formatted like this:
{
  "score": <number>,
  "explanation": "<your detailed judgment>"
}

Remember your answer should be the JSON object, nothing else.

Remember:
- Be objective and consistent
- Consider context and nuance
- Focus on substance over style
- Account for valid alternative phrasings
`;

    const response = await generateResponse(judgeModelId, prompt);
    
    // Enhanced parsing logic with multiple fallback strategies
    return extractJudgmentAndScore(response, testCase.id);
  } catch (error) {
    console.error(`Error judging test case ${testCase.id}:`, error);
    throw error;
  }
}

/**
 * Extracts judgment and score from model responses with multiple fallback strategies.
 * 
 * We implement a multi-layered parsing approach because:
 * 1. Different models format their responses differently
 * 2. Models may include explanatory text before or after the JSON
 * 3. Some models might not follow the JSON format at all
 * 
 * This robust extraction ensures we can get meaningful results even from
 * imperfect model outputs, improving the overall reliability of the system.
 * 
 * @param response The raw response from the model
 * @param testCaseId The ID of the test case (for logging)
 * @returns An object containing the judgment and score
 */
function extractJudgmentAndScore(response: string, testCaseId: string): { judgment: string; score: number } {
  const trimmedResponse = response.trim();
  
  // Strategy 1: Try to parse the entire response as JSON
  try {
    const jsonResponse = JSON.parse(trimmedResponse);
    if (typeof jsonResponse.score === 'number' && typeof jsonResponse.explanation === 'string') {
      return {
        judgment: jsonResponse.explanation,
        score: jsonResponse.score
      };
    }
  } catch (error) {
    // If this fails, continue to the next strategy
    console.log(`Direct JSON parsing failed for test case ${testCaseId}, trying alternative methods`);
  }
  
  // Strategy 2: Try to extract JSON from within the response using regex
  try {
    const jsonMatch = trimmedResponse.match(/\{[\s\S]*"score"[\s\S]*"explanation"[\s\S]*\}/);
    if (jsonMatch) {
      const extractedJson = jsonMatch[0];
      const jsonResponse = JSON.parse(extractedJson);
      
      if (typeof jsonResponse.score === 'number' && typeof jsonResponse.explanation === 'string') {
        return {
          judgment: jsonResponse.explanation,
          score: jsonResponse.score
        };
      }
    }
  } catch (error) {
    // If this fails, continue to the next strategy
    console.log(`JSON extraction via regex failed for test case ${testCaseId}, trying alternative methods`);
  }
  
  // Strategy 3: Look for score and explanation separately using regex
  const scoreMatch = trimmedResponse.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
  
  // Try to extract explanation using various patterns
  let explanation = "";
  
  // Look for explanation in quotes
  const explanationInQuotes = trimmedResponse.match(/"explanation"[:\s]*"([^"]*)"/);
  if (explanationInQuotes && explanationInQuotes[1]) {
    explanation = explanationInQuotes[1];
  } 
  // Look for explanation after "explanation:" label
  else {
    const explanationAfterLabel = trimmedResponse.match(/explanation:(.+?)(?:\n|$)/i);
    if (explanationAfterLabel && explanationAfterLabel[1]) {
      explanation = explanationAfterLabel[1].trim();
    }
    // If still no explanation found, use the entire response as the explanation
    else {
      // Remove any score-related text from the response
      explanation = trimmedResponse.replace(/score[:\s]*\d+(?:\.\d+)?/gi, "").trim();
      
      // If explanation is too long, truncate it
      if (explanation.length > 500) {
        explanation = explanation.substring(0, 497) + "...";
      }
    }
  }
  
  // Ensure we have a valid score
  const validScore = isNaN(score) ? 0 : Math.min(Math.max(score, 0), 10);
  
  console.log(`Extracted score ${validScore} and explanation via fallback methods for test case ${testCaseId}`);
  
  return {
    judgment: explanation || "No explanation provided",
    score: validScore
  };
} 