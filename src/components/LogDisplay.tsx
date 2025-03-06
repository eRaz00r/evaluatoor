import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from "@/types";
import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface LogDisplayProps {
  logs: LogEntry[];
}

export function LogDisplay({ logs }: LogDisplayProps) {
  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLogTypeClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-white">Processing Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-auto rounded-md border border-white border-opacity-10 bg-black bg-opacity-20 p-4 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-8 w-8 text-blue-400 opacity-50 mb-2" />
              <p className="text-sm text-white opacity-50">No logs yet. Start an evaluation to see logs here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm animate-in fade-in-50 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="mt-0.5 flex-shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className={`font-medium ${getLogTypeClass(log.type)}`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="mx-2 text-white opacity-30">•</span>
                      <span className="font-mono text-xs text-white opacity-50">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-white opacity-80">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
} 