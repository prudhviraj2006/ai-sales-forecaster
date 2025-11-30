import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Download, ChevronDown, ChevronUp, BarChart3, Activity } from 'lucide-react';
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

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'text-green-600 bg-green-50';
    if (accuracy >= 90) return 'text-emerald-600 bg-emerald-50';
    if (accuracy >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAccuracyBg = (accuracy) => {
    if (accuracy >= 95) return 'bg-green-100';
    if (accuracy >= 90) return 'bg-emerald-100';
    if (accuracy >= 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const accuracy = 100 - metrics.mape;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Forecast Dashboard</h1>
            <p className="text-blue-100 text-lg">
              {forecastData.model_type.toUpperCase()} Model • {forecastData.horizon}-Month Forecast • {forecastData.aggregation} Aggregation
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload('csv')}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm font-semibold"
            >
              <Download size={20} />
              CSV
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg transition-colors font-semibold"
            >
              <Download size={20} />
              PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy Card */}
        <div className={`rounded-xl shadow-md border border-gray-200 p-6 ${getAccuracyColor(accuracy).split(' ')[1]}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Model Accuracy</p>
              <p className={`text-4xl font-bold mt-1 ${getAccuracyColor(accuracy).split(' ')[0]}`}>
                {accuracy.toFixed(1)}%
              </p>
            </div>
            <div className={`${getAccuracyBg(accuracy)} rounded-full p-4`}>
              <Activity size={28} className={getAccuracyColor(accuracy).split(' ')[0]} />
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {accuracy >= 90 ? '✓ Excellent prediction confidence' : 'See MAPE for error details'}
          </p>
        </div>

        {/* MAE Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Mean Absolute Error</p>
              <p className="text-4xl font-bold text-blue-600 mt-1">{formatNumber(metrics.mae)}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <Target size={28} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Average prediction deviation</p>
        </div>

        {/* RMSE Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Root Mean Squared Error</p>
              <p className="text-4xl font-bold text-purple-600 mt-1">{formatNumber(metrics.rmse)}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-4">
              <TrendingUp size={28} className="text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Penalizes larger errors</p>
        </div>

        {/* MAPE Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Mean Absolute % Error</p>
              <p className="text-4xl font-bold text-amber-600 mt-1">{metrics.mape.toFixed(1)}%</p>
            </div>
            <div className="bg-amber-100 rounded-full p-4">
              <AlertCircle size={28} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Percentage error rate</p>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Historical vs Forecast Trend</h2>
          <p className="text-gray-600 text-sm mt-1">Actual sales data compared to model predictions with confidence intervals</p>
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatNumber}
            />
            <Tooltip
              formatter={(value, name) => [formatNumber(value), name]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area
              dataKey="upper"
              stroke="none"
              fill="url(#colorConfidence)"
              fillOpacity={1}
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
              strokeWidth={3}
              dot={false}
              name="Actual Sales"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#7c3aed"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Importance & Time Series Decomposition */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Time Series Decomposition */}
        {decomposition && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowDecomposition(!showDecomposition)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={24} className="text-blue-600" />
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Time Series Decomposition</h3>
                  <p className="text-xs text-gray-600 mt-1">Trend, seasonality, and residual analysis</p>
                </div>
              </div>
              {showDecomposition ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showDecomposition && (
              <div className="p-6 pt-0 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Trend Component</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={decomposition.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                      <Tooltip formatter={(value) => formatNumber(value)} />
                      <Line type="monotone" dataKey="value" stroke="#1e40af" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Seasonal Component</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={decomposition.seasonal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
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

        {/* Feature Importance */}
        {feature_importance && feature_importance.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Feature Importance</h3>
              <p className="text-xs text-gray-600 mt-1">Key drivers of forecast predictions</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feature_importance} layout="vertical" margin={{ left: 150, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="feature" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={140}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products & Regions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {top_products && top_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Top Performing Products</h3>
              <p className="text-xs text-gray-600 mt-1">By forecast sales volume</p>
            </div>
            <div className="space-y-3">
              {top_products.slice(0, 8).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg hover:from-blue-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white text-sm font-bold rounded-full">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.product_name || product.product_id}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-blue-600 text-lg">
                    ${formatNumber(product[forecastData.target_column])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {top_regions && top_regions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Top Performing Regions</h3>
              <p className="text-xs text-gray-600 mt-1">By forecast sales volume</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={top_regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatNumber} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey={forecastData.target_column} fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
