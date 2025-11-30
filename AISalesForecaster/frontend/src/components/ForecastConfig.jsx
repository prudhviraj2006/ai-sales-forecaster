import { useState } from 'react';
import { Settings, Zap, ArrowLeft } from 'lucide-react';
import { runForecast, getInsights } from '../services/api';

function ForecastConfig({ uploadData, onComplete, setLoading, setLoadingMessage, setError, onBack }) {
  const [config, setConfig] = useState({
    aggregation: 'monthly',
    model: 'prophet',
    horizon: 6,
    target_column: 'revenue',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('Running forecast model... This may take a minute.');
    setError(null);

    try {
      const forecastResult = await runForecast({
        job_id: uploadData.job_id,
        ...config,
      });

      setLoadingMessage('Generating business insights...');
      
      let insightsResult = null;
      try {
        insightsResult = await getInsights(uploadData.job_id);
      } catch (err) {
        console.warn('Could not generate insights:', err);
      }

      setLoading(false);
      onComplete(forecastResult, insightsResult);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to run forecast. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Configure Your Forecast
        </h2>
        <p className="text-gray-600">
          Choose your forecasting parameters to generate predictions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Forecast Settings</h3>
            <p className="text-sm text-gray-500">Job ID: {uploadData.job_id}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Column
            </label>
            <select
              value={config.target_column}
              onChange={(e) => setConfig({ ...config, target_column: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {uploadData.numeric_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">The value you want to forecast</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggregation Level
            </label>
            <select
              value={config.aggregation}
              onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">How to group your data</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Model
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="model"
                  value="prophet"
                  checked={config.model === 'prophet'}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-800">Prophet</span>
                  <p className="text-xs text-gray-500">Best for strong seasonality and trend</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="model"
                  value="lightgbm"
                  checked={config.model === 'lightgbm'}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-800">LightGBM</span>
                  <p className="text-xs text-gray-500">Best for complex patterns with many features</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Horizon
            </label>
            <div className="space-y-2">
              {[3, 6, 12].map((months) => (
                <label 
                  key={months}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.horizon === months 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="horizon"
                    value={months}
                    checked={config.horizon === months}
                    onChange={() => setConfig({ ...config, horizon: months })}
                    className="text-blue-600"
                  />
                  <span className="font-medium text-gray-800">{months} Months</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Zap size={18} />
            Run Forecast
          </button>
        </div>
      </form>
    </div>
  );
}

export default ForecastConfig;
