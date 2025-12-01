import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

function ConfidenceRiskCard({ metrics, darkMode }) {
  if (!metrics) return null;

  const confidenceScore = metrics.confidence_score ?? 85;
  const riskLevel = metrics.risk_level ?? 'medium';

  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return darkMode ? 'text-red-400' : 'text-red-600';
      case 'medium': return darkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'low': return darkMode ? 'text-green-400' : 'text-green-600';
      default: return darkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getRiskBg = (level) => {
    switch(level) {
      case 'high': return darkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200';
      case 'medium': return darkMode ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200';
      case 'low': return darkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200';
      default: return darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-4 mt-4`}>
      {/* Confidence Score */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Confidence Score
          </span>
        </div>
        <div className="flex items-end gap-2">
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {confidenceScore.toFixed(0)}%
          </div>
          <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>High</div>
        </div>
        <div className="mt-3 w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(confidenceScore, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Risk Level */}
      <div className={`p-4 rounded-lg border ${getRiskBg(riskLevel)}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={18} className={getRiskColor(riskLevel)} />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Risk Level
          </span>
        </div>
        <div className={`text-2xl font-bold capitalize ${getRiskColor(riskLevel)}`}>
          {riskLevel}
        </div>
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {riskLevel === 'low' ? 'Stable forecast' : riskLevel === 'high' ? 'High volatility' : 'Moderate variability'}
        </div>
      </div>
    </div>
  );
}

export default ConfidenceRiskCard;
