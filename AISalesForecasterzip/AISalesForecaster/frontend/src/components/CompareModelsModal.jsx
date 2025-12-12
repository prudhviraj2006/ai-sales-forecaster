import { useState, useEffect } from 'react';
import { X, TrendingUp, BarChart2, Award, Loader2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { runForecast } from '../services/api';

function CompareModelsModal({ isOpen, onClose, uploadData, currentForecast }) {
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !comparisonData) {
      runComparison();
    }
  }, [isOpen]);

  const runComparison = async () => {
    if (!uploadData?.job_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const otherModel = currentForecast.model_type === 'prophet' ? 'lightgbm' : 'prophet';
      
      const otherForecast = await runForecast({
        job_id: uploadData.job_id,
        model: otherModel,
        aggregation: currentForecast.aggregation,
        horizon: currentForecast.horizon,
        target_column: currentForecast.target_column,
      });

      const prophetData = currentForecast.model_type === 'prophet' ? currentForecast : otherForecast;
      const lightgbmData = currentForecast.model_type === 'lightgbm' ? currentForecast : otherForecast;

      const combinedForecast = prophetData.forecast.map((p, idx) => ({
        date: p.date,
        prophet: p.predicted,
        lightgbm: lightgbmData.forecast[idx]?.predicted || 0,
      }));

      setComparisonData({
        prophet: {
          metrics: prophetData.metrics,
          forecast: prophetData.forecast,
        },
        lightgbm: {
          metrics: lightgbmData.metrics,
          forecast: lightgbmData.forecast,
        },
        combined: combinedForecast,
      });
    } catch (err) {
      console.error('Comparison failed:', err);
      setError('Failed to run model comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toFixed(2);
  };

  const metricsData = comparisonData ? [
    { metric: 'MAE', Prophet: comparisonData.prophet.metrics.mae, LightGBM: comparisonData.lightgbm.metrics.mae },
    { metric: 'RMSE', Prophet: comparisonData.prophet.metrics.rmse, LightGBM: comparisonData.lightgbm.metrics.rmse },
    { metric: 'MAPE', Prophet: comparisonData.prophet.metrics.mape, LightGBM: comparisonData.lightgbm.metrics.mape },
  ] : [];

  const getBetterModel = () => {
    if (!comparisonData) return null;
    const prophetMape = comparisonData.prophet.metrics.mape || 0;
    const lightgbmMape = comparisonData.lightgbm.metrics.mape || 0;
    return prophetMape < lightgbmMape ? 'Prophet' : 'LightGBM';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <BarChart2 size={28} />
            <div>
              <h2 className="text-xl font-bold">Model Comparison</h2>
              <p className="text-blue-100 text-sm">Prophet vs LightGBM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Running comparison forecast...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
              {error}
              <button 
                onClick={runComparison}
                className="ml-4 text-red-600 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          )}

          {comparisonData && !loading && (
            <div className="space-y-8">
              {getBetterModel() && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Award size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Recommended Model</p>
                    <p className="text-2xl font-bold text-green-900">{getBetterModel()}</p>
                    <p className="text-sm text-green-700">Based on lower MAPE (Mean Absolute Percentage Error)</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Prophet Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">MAE</span>
                      <span className="font-bold text-blue-900">{comparisonData.prophet.metrics.mae?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">RMSE</span>
                      <span className="font-bold text-blue-900">{comparisonData.prophet.metrics.rmse?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">MAPE</span>
                      <span className="font-bold text-blue-900">{comparisonData.prophet.metrics.mape?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-blue-700 font-semibold">Accuracy</span>
                      <span className="font-bold text-blue-900 text-lg">{(100 - comparisonData.prophet.metrics.mape).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    LightGBM Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">MAE</span>
                      <span className="font-bold text-purple-900">{comparisonData.lightgbm.metrics.mae?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">RMSE</span>
                      <span className="font-bold text-purple-900">{comparisonData.lightgbm.metrics.rmse?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">MAPE</span>
                      <span className="font-bold text-purple-900">{comparisonData.lightgbm.metrics.mape?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                      <span className="text-purple-700 font-semibold">Accuracy</span>
                      <span className="font-bold text-purple-900 text-lg">{(100 - comparisonData.lightgbm.metrics.mape).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Metrics Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Prophet" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="LightGBM" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Forecast Trend Overlay</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={comparisonData.combined}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="prophet" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={false}
                      name="Prophet"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lightgbm" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      name="LightGBM"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompareModelsModal;
