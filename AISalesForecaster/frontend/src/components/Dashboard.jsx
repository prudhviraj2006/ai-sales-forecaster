import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart
} from 'recharts';
import { TrendingUp, Target, AlertCircle, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { downloadReport } from '../services/api';

function Dashboard({ forecastData, jobId }) {
  const [showDecomposition, setShowDecomposition] = useState(false);
  const { metrics, forecast, historical, decomposition, feature_importance, top_products, top_regions } = forecastData;

  const combinedData = [
    ...historical.map(h => ({
      date: h.date,
      actual: h.actual,
      predicted: null,
      lower: null,
      upper: null,
      type: 'historical'
    })),
    ...forecast.map(f => ({
      date: f.date,
      actual: null,
      predicted: f.predicted,
      lower: f.lower_bound,
      upper: f.upper_bound,
      type: 'forecast'
    }))
  ];

  const handleDownload = async (format) => {
    try {
      await downloadReport(jobId, format);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Forecast Dashboard</h2>
          <p className="text-gray-600">
            {forecastData.model_type.toUpperCase()} model | {forecastData.horizon} month forecast | {forecastData.aggregation} aggregation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            PDF Report
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Target size={16} />
            MAE
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatNumber(metrics.mae)}</p>
          <p className="text-xs text-gray-500">Mean Absolute Error</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp size={16} />
            RMSE
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatNumber(metrics.rmse)}</p>
          <p className="text-xs text-gray-500">Root Mean Squared Error</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertCircle size={16} />
            MAPE
          </div>
          <p className="text-2xl font-bold text-gray-800">{metrics.mape.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Mean Absolute % Error</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            Accuracy
          </div>
          <p className={`text-2xl font-bold ${
            100 - metrics.mape >= 90 ? 'text-green-600' : 
            100 - metrics.mape >= 80 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(100 - metrics.mape).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Model Accuracy</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Historical vs Forecast</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatNumber}
            />
            <Tooltip
              formatter={(value, name) => [formatNumber(value), name]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Area
              dataKey="upper"
              stroke="none"
              fill="#93c5fd"
              fillOpacity={0.3}
              name="Upper Bound"
            />
            <Area
              dataKey="lower"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
              name="Lower Bound"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#1e40af"
              strokeWidth={2}
              dot={false}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {decomposition && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowDecomposition(!showDecomposition)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-800">Time Series Decomposition</h3>
            {showDecomposition ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showDecomposition && (
            <div className="p-6 pt-0 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Trend</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={decomposition.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Line type="monotone" dataKey="value" stroke="#1e40af" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Seasonality</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={decomposition.seasonal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="#c4b5fd" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {feature_importance && feature_importance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feature_importance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="feature" 
                type="category" 
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Bar dataKey="importance" fill="#1e40af" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {top_products && top_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
            <div className="space-y-3">
              {top_products.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 text-sm font-bold rounded">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-800">
                      {product.product_name || product.product_id}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-600">
                    ${formatNumber(product[forecastData.target_column])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {top_regions && top_regions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Regions</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top_regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey={forecastData.target_column} fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
