import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailableModels } from "@/services/ollamaService";
import { LLMModel } from "@/types";
import { Cpu, AlertCircle, Loader2 } from "lucide-react";

interface ModelSelectorProps {
  title: string;
  onModelSelect: (modelId: string) => void;
  selectedModelId?: string;
  disabled?: boolean;
}

export function ModelSelector({ title, onModelSelect, selectedModelId, disabled = false }: ModelSelectorProps) {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await getAvailableModels();
        setModels(availableModels);
        
        // Auto-select the first model if none is selected
        if (!selectedModelId && availableModels.length > 0) {
          onModelSelect(availableModels[0].id);
        }
      } catch (err) {
        setError("Failed to fetch models. Make sure Ollama is running.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [onModelSelect, selectedModelId]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelSelect(e.target.value);
  };

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-3" />
            <p className="text-sm text-white opacity-70">Loading available models...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950 bg-opacity-30 border border-red-500 border-opacity-20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 mb-2">{error}</p>
              <p className="text-xs text-red-300 opacity-70">
                Check that Ollama is running and has models installed.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <select
                id="model-select"
                value={selectedModelId || ""}
                onChange={handleModelChange}
                disabled={disabled}
                className={`w-full bg-black bg-opacity-5 border border-white border-opacity-20 rounded-lg py-2.5 pl-10 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {models.length === 0 ? (
                  <option value="" disabled className="bg-gray-900 text-white">
                    No models available
                  </option>
                ) : (
                  models.map((model) => (
                    <option key={model.id} value={model.id} className="bg-gray-900 text-white">
                      {model.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Cpu className="h-5 w-5 text-blue-400" />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-white opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {models.length === 0 && !error && (
              <div className="bg-yellow-950 bg-opacity-30 border border-yellow-500 border-opacity-20 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">
                  No models found. Please make sure Ollama has models installed.
                </p>
              </div>
            )}
            
            {selectedModelId && models.length > 0 && (
              <div className="bg-blue-950 bg-opacity-30 border border-blue-500 border-opacity-20 rounded-lg p-3">
                <p className="text-xs text-blue-300 mb-1">Selected Model</p>
                <p className="text-sm font-medium text-white">{selectedModelId}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </>
  );
} 