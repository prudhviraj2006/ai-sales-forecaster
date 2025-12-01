import { AlertCircle } from 'lucide-react';

function AnomalyMarker({ anomalies, darkMode }) {
  if (!anomalies || anomalies.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 p-4 rounded-lg border ${
      darkMode 
        ? 'bg-red-900/10 border-red-700/30' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`flex-shrink-0 mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`} size={20} />
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
            🤖 AI Anomaly Detection
          </h4>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div key={idx} className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                <div className="font-medium">
                  {anomaly.anomaly_type === 'spike' ? '📈' : '📉'} {anomaly.description}
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-red-300/70' : 'text-red-700/70'}`}>
                  Severity: {anomaly.severity?.toFixed(1)}%
                </div>
              </div>
            ))}
            {anomalies.length > 5 && (
              <div className={`text-xs italic ${darkMode ? 'text-red-300/50' : 'text-red-700/50'}`}>
                +{anomalies.length - 5} more anomalies detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnomalyMarker;
