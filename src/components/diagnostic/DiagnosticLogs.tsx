
import React from 'react';

interface DiagnosticLogsProps {
  logs: string[];
  error: string | null;
}

export const DiagnosticLogs: React.FC<DiagnosticLogsProps> = ({ logs, error }) => {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Diagnostic Logs</h3>
        <div className="bg-gray-100 rounded p-3 h-40 overflow-y-auto text-xs font-mono">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </>
  );
};
