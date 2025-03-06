import { LLMModel, TestCase } from "@/types";

const OLLAMA_API_BASE_URL = "http://localhost:11434/api";

export async function getAvailableModels(): Promise<LLMModel[]> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE_URL}/tags`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.models.map((model: any) => ({
      name: model.name,
      id: model.name,
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

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
        stream: false,
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
    
    // Parse the JSON response
    try {
      const jsonResponse = JSON.parse(response.trim());
      
      if (typeof jsonResponse.score === 'number' && typeof jsonResponse.explanation === 'string') {
        return {
          judgment: jsonResponse.explanation,
          score: jsonResponse.score
        };
      } else {
        throw new Error("Invalid JSON format in response");
      }
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      
      // Fallback parsing for non-JSON responses
      const scoreMatch = response.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      
      return {
        judgment: response.trim(),
        score: isNaN(score) ? 0 : score,
      };
    }
  } catch (error) {
    console.error(`Error judging test case ${testCase.id}:`, error);
    throw error;
  }
} 