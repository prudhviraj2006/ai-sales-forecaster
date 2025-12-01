import { useState } from 'react';
import { Settings, Zap, ArrowLeft, RotateCcw } from 'lucide-react';
import { runForecast, getInsights } from '../services/api';
import Tooltip from './Tooltip';

function ForecastConfig({ uploadData, onComplete, setLoading, setLoadingMessage, setError, onBack, darkMode }) {
  const defaultConfig = {
    aggregation: 'monthly',
    model: 'prophet',
    horizon: 6,
    target_column: 'revenue',
  };

  const [config, setConfig] = useState(defaultConfig);

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

  const handleReset = () => {
    setConfig(defaultConfig);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Configure Your Forecast
        </h2>
        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
          Choose your forecasting parameters to generate predictions
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`rounded-xl shadow-sm border p-6 space-y-6 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className={`flex items-center justify-between pb-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Forecast Settings</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Job ID: {uploadData.job_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
            }`}
            title="Reset to default settings"
          >
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Target Column
              </label>
              <Tooltip 
                content="The numeric column you want to predict. Usually revenue or units sold."
                position="top"
              />
            </div>
            <select
              value={config.target_column}
              onChange={(e) => setConfig({ ...config, target_column: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-600 text-white' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              {uploadData.numeric_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>The value you want to forecast</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Aggregation Level
              </label>
              <Tooltip 
                content="How to group your data over time. Monthly is recommended for most business forecasts."
                position="top"
              />
            </div>
            <select
              value={config.aggregation}
              onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-600 text-white' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>How to group your data</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Forecast Model
              </label>
              <Tooltip 
                content="Prophet is ideal for long-term trends and strong seasonality. LightGBM handles complex patterns and multiple features effectively."
                position="top"
              />
            </div>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                config.model === 'prophet'
                  ? 'border-blue-500 bg-blue-50'
                  : darkMode 
                    ? 'border-slate-600 hover:bg-slate-700' 
                    : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="model"
                  value="prophet"
                  checked={config.model === 'prophet'}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="text-blue-600"
                />
                <div>
                  <span className={`font-medium ${darkMode && config.model !== 'prophet' ? 'text-white' : 'text-gray-800'}`}>Prophet</span>
                  <p className={`text-xs ${darkMode && config.model !== 'prophet' ? 'text-gray-400' : 'text-gray-500'}`}>Best for strong seasonality and trend</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                config.model === 'lightgbm'
                  ? 'border-blue-500 bg-blue-50'
                  : darkMode 
                    ? 'border-slate-600 hover:bg-slate-700' 
                    : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="model"
                  value="lightgbm"
                  checked={config.model === 'lightgbm'}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="text-blue-600"
                />
                <div>
                  <span className={`font-medium ${darkMode && config.model !== 'lightgbm' ? 'text-white' : 'text-gray-800'}`}>LightGBM</span>
                  <p className={`text-xs ${darkMode && config.model !== 'lightgbm' ? 'text-gray-400' : 'text-gray-500'}`}>Best for complex patterns with many features</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Forecast Horizon
              </label>
              <Tooltip 
                content="How far into the future to predict. Longer horizons have more uncertainty."
                position="top"
              />
            </div>
            <div className="space-y-2">
              {[3, 6, 12].map((months) => (
                <label 
                  key={months}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.horizon === months 
                      ? 'border-blue-500 bg-blue-50' 
                      : darkMode 
                        ? 'border-slate-600 hover:bg-slate-700' 
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
                  <span className={`font-medium ${darkMode && config.horizon !== months ? 'text-white' : 'text-gray-800'}`}>{months} Months</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex gap-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-2 px-6 py-3 border rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
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
