# Local LLM Evaluation Web Application

A web application for evaluating and judging LLM responses using local models via Ollama.

## Features

- Upload CSV files containing test cases for LLM evaluation
- Select LLMs for evaluation and judgment from locally available models via Ollama
- Run evaluations on test cases using the selected LLM
- Judge the quality of generated responses using a separate LLM
- Display real-time logs of the evaluation and judgment process
- Download results in CSV and JSON formats

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Ollama](https://ollama.ai/) installed and running locally with at least one model

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/evaluatoor.git
cd evaluatoor
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## CSV Format

The application expects CSV files with the following columns:

- `id` (optional): A unique identifier for the test case
- `input`: The input prompt for the LLM
- `expected_output`: The expected response from the LLM

Example:

```csv
id,input,expected_output
1,"What is the capital of France?","The capital of France is Paris."
2,"Explain quantum computing in simple terms.","Quantum computing uses quantum bits or qubits that can exist in multiple states at once, unlike classical bits that are either 0 or 1. This allows quantum computers to process certain types of problems much faster than classical computers."
```

## How It Works

1. **Upload CSV**: Upload a CSV file containing test cases.
2. **Select Models**: Choose an LLM for evaluation and another for judgment from the available models in Ollama.
3. **Run Evaluation**: Process each test case with the selected evaluation LLM to generate responses.
4. **Run Judgment**: Use the selected judge LLM to compare generated responses against expected outputs.
5. **Download Results**: Export the results in CSV or JSON format for further analysis.

## LLM Judge System

The application uses a specialized LLM judge to evaluate the quality of generated responses compared to expected outputs.

### Judge Prompt Template

```
You are an expert evaluator of LLM responses. Your task is to judge the quality of a generated response compared to an expected response.

Context:
- Input prompt: {input}
- Expected response: {expected}
- Generated response: {generated}

Evaluate the generated response based on the following criteria:
1. Accuracy: How well does it match the factual content of the expected response?
2. Completeness: Does it cover all key points from the expected response?
3. Clarity: Is it well-written and easy to understand?
4. Relevance: Does it directly address the input prompt?

Provide your evaluation in the following format:
1. A score from 0-10 (where 10 is perfect)
2. A brief explanation of your judgment

Your response should be in JSON format:
{
  "score": <number>,
  "explanation": "<your detailed judgment>"
}

Remember:
- Be objective and consistent
- Consider context and nuance
- Focus on substance over style
- Account for valid alternative phrasings
```

### Example Judgment

For the input:
```json
{
  "input": "What is the capital of France?",
  "expected": "The capital of France is Paris.",
  "generated": "Paris is the capital city of France and is known for the Eiffel Tower."
}
```

The judge might respond:
```json
{
  "score": 9,
  "explanation": "The generated response is accurate and complete, providing the correct information that Paris is France's capital. It goes slightly beyond the expected response by adding relevant context about the Eiffel Tower, which is appropriate but not necessary. The response is clear, concise, and directly addresses the question."
}
```

## Local Processing

All processing is done locally on your machine. No data is sent to external servers or APIs. The application communicates only with the local Ollama API.

## License

MIT
