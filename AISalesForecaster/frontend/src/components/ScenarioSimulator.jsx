import { useState } from 'react';
import { X, Zap, TrendingUp } from 'lucide-react';
import { runScenario } from '../services/api';

function ScenarioSimulator({ jobId, onClose, darkMode }) {
  const [priceChange, setPriceChange] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await runScenario(jobId, { price_change: priceChange, volume_change: volumeChange });
      setResult(data);
    } catch (err) {
      console.error('Error running scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-2xl max-w-md w-full mx-4 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Sales Scenario Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Price Change: {priceChange}%
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={priceChange}
                  onChange={(e) => setPriceChange(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+20%</span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Volume Change: {volumeChange}%
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={volumeChange}
                  onChange={(e) => setVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+30%</span>
                </div>
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  loading
                    ? darkMode ? 'bg-slate-700 text-gray-500' : 'bg-gray-300 text-gray-500'
                    : darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md'
                }`}
              >
                <Zap size={18} />
                {loading ? 'Simulating...' : 'Simulate Scenario'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scenario Results</div>
                <div className={`text-2xl font-bold mt-2 flex items-center gap-2 ${
                  result.revenue_change_pct >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <TrendingUp size={24} />
                  {result.revenue_change_pct >= 0 ? '+' : ''}{result.revenue_change_pct}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Original Revenue</div>
                  <div className={`font-semibold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    ${result.original_revenue?.toLocaleString()}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Revenue</div>
                  <div className={`font-semibold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    ${result.new_revenue?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border-l-4 ${
                result.risk_level === 'high' 
                  ? darkMode ? 'bg-red-900/20 border-l-red-500' : 'bg-red-50 border-l-red-500'
                  : result.risk_level === 'medium'
                  ? darkMode ? 'bg-yellow-900/20 border-l-yellow-500' : 'bg-yellow-50 border-l-yellow-500'
                  : darkMode ? 'bg-green-900/20 border-l-green-500' : 'bg-green-50 border-l-green-500'
              }`}>
                <div className={`text-sm font-semibold capitalize ${
                  result.risk_level === 'high'
                    ? darkMode ? 'text-red-300' : 'text-red-700'
                    : result.risk_level === 'medium'
                    ? darkMode ? 'text-yellow-300' : 'text-yellow-700'
                    : darkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  Risk Level: {result.risk_level}
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                  darkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Try Another Scenario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScenarioSimulator;
