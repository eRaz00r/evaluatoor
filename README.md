# 🔍 Evaluatoor - Local LLM Evaluation Tool

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLMs-green?style=for-the-badge)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A modern web application for evaluating and judging LLM responses using local models via Ollama. Test your LLMs locally without sending data to external APIs!

![Evaluatoor Demo](https://via.placeholder.com/800x400?text=Evaluatoor+Demo)

## ✨ Features

- 📤 **Multiple File Upload** - Drag and drop CSV files with test cases
- 🤖 **Local LLM Integration** - Use your own models via Ollama
- 📊 **Real-time Progress** - Track evaluation progress with visual indicators
- 📝 **Detailed Judgments** - Get comprehensive scoring of LLM responses
- 📈 **Export Results** - Download in CSV and JSON formats
- 🔒 **Privacy Focused** - All processing happens locally

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Ollama](https://ollama.ai/) installed and running locally with at least one model

### Installation

1. Clone the repository:

```bash
git clone https://github.com/eRaz00r/evaluatoor.git
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

## 📋 CSV Format

The application expects CSV files with the following columns:

| Column | Description |
|--------|-------------|
| `id` (optional) | A unique identifier for the test case |
| `input` | The input prompt for the LLM |
| `expected_output` | The expected response from the LLM |

### Example:

```csv
id,input,expected_output
1,"What is the capital of France?","The capital of France is Paris."
2,"Explain quantum computing in simple terms.","Quantum computing uses quantum bits or qubits that can exist in multiple states at once, unlike classical bits that are either 0 or 1. This allows quantum computers to process certain types of problems much faster than classical computers."
```

## 🔄 How It Works

1. **📤 Upload CSV** - Upload a CSV file containing test cases
2. **🤖 Select Models** - Choose LLMs for evaluation and judgment
3. **▶️ Run Evaluation** - Process test cases and generate responses
4. **⚖️ Judge Results** - Compare generated responses against expected outputs
5. **💾 Download** - Export results for further analysis

## ⚖️ LLM Judge System

The application uses a specialized LLM judge to evaluate the quality of generated responses compared to expected outputs.

### 📝 Judge Prompt Template

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

### 🏆 Scoring System

| Score | Rating | Description |
|-------|--------|-------------|
| **9-10** | ⭐⭐⭐⭐⭐ | **Exceptional** - Perfect or near-perfect match in meaning and quality |
| **7-8** | ⭐⭐⭐⭐ | **Strong** - Minor differences but maintains accuracy and completeness |
| **5-6** | ⭐⭐⭐ | **Acceptable** - Some important elements present but with notable omissions |
| **3-4** | ⭐⭐ | **Poor** - Major omissions or inaccuracies |
| **0-2** | ⭐ | **Unacceptable** - Completely incorrect or irrelevant |

### 📊 Example Judgment

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

## 🔒 Privacy

All processing is done locally on your machine. No data is sent to external servers or APIs. The application communicates only with the local Ollama API.

## 💡 Performance Tips

- Use smaller, quantized models for faster evaluation
- Adjust context length in Ollama for better performance
- Process batches of test cases for efficiency
- Consider GPU acceleration for larger models

## 👨‍💻 Repository Information

This repository is maintained by [eRaz00r](https://github.com/eRaz00r).

## 📄 License

MIT
