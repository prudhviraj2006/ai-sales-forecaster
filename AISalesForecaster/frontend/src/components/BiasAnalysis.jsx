import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

function BiasAnalysis({ metrics, darkMode }) {
  if (!metrics) return null;

  const overpred = metrics.overprediction_bias ?? 0;
  const underpred = metrics.underprediction_bias ?? 0;

  return (
    <div className={`p-4 rounded-lg border mt-4 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={20} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          AI Bias Detection
        </h4>
      </div>

      <div className="space-y-3">
        {/* Overprediction */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-red-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Overprediction
            </span>
          </div>
          <div className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {overpred.toFixed(1)}%
          </div>
        </div>

        {/* Underprediction */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-blue-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Underprediction
            </span>
          </div>
          <div className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {underpred.toFixed(1)}%
          </div>
        </div>

        {/* Summary */}
        <div className={`text-xs mt-3 p-2 rounded ${
          darkMode ? 'bg-slate-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {overpred > underpred 
            ? `Model tends to overpredict. Review for conservative estimates.`
            : `Model tends to underpredict. Add safety margins for planning.`
          }
        </div>
      </div>
    </div>
  );
}

export default BiasAnalysis;
