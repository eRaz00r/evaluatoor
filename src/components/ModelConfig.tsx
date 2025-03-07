import React from "react";
import { ModelConfig as ModelConfigType, DEFAULT_MODEL_CONFIG } from "@/types";

interface ModelConfigProps {
  config: ModelConfigType;
  onConfigChange: (config: ModelConfigType) => void;
  disabled?: boolean;
}

/**
 * Component for configuring model parameters like context window size and temperature.
 * 
 * We provide sliders with appropriate ranges and step sizes to:
 * 1. Make it intuitive for users to adjust parameters
 * 2. Prevent users from setting values that could cause issues
 * 3. Provide immediate visual feedback about the current settings
 * 
 * The component is disabled during evaluation to prevent changing
 * parameters mid-process, which could lead to inconsistent results.
 */
export function ModelConfig({ config, onConfigChange, disabled = false }: ModelConfigProps) {
  const handleContextWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onConfigChange({
      ...config,
      contextWindowSize: value
    });
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onConfigChange({
      ...config,
      temperature: value
    });
  };

  const handleReset = () => {
    onConfigChange({ ...DEFAULT_MODEL_CONFIG });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-700 pb-3 mb-3">
        <h3 className="text-lg font-semibold text-white">Model Configuration</h3>
        <p className="text-sm text-white opacity-70">
          Adjust these parameters to optimize performance and quality
        </p>
      </div>

      <div className="space-y-6">
        {/* Context Window Size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-white">
              Context Window Size
            </label>
            <span className="text-sm text-white opacity-70">
              {config.contextWindowSize} tokens
            </span>
          </div>
          <input
            type="range"
            min="512"
            max="8192"
            step="512"
            value={config.contextWindowSize}
            onChange={handleContextWindowChange}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-white opacity-50">
            Smaller values use less memory and run faster, but may limit comprehension of longer inputs.
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-white">
              Temperature
            </label>
            <span className="text-sm text-white opacity-70">
              {config.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={handleTemperatureChange}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-white opacity-50">
            Lower values (0.0-0.5) produce more deterministic outputs. Higher values increase creativity but may reduce accuracy.
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={disabled}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
} 