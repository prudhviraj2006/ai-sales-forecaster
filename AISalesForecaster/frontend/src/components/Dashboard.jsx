import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import { TrendingUp, Target, AlertCircle, Download, ChevronDown, ChevronUp, BarChart3, Activity, Sparkles, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadReport } from '../services/api';

function Dashboard({ forecastData, jobId, insightsData }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const { metrics, forecast, historical, decomposition, feature_importance, top_products, top_regions } = forecastData;

  const totalPages = insightsData ? 4 : 3;
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // Generate residuals data (historical only)
  const residualsData = historical.slice(-20).map((h, idx) => {
    const pred = forecast[idx]?.predicted || h.actual;
    return {
      date: h.date,
      residual: h.actual - pred,
      actual: h.actual,
      predicted: pred
    };
  });

  // Monthly comparison data
  const monthlyData = [];
  const monthMap = {};
  historical.forEach(h => {
    const date = new Date(h.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[monthKey]) monthMap[monthKey] = { month: monthKey, historical: 0, count: 0 };
    monthMap[monthKey].historical += h.actual;
    monthMap[monthKey].count += 1;
  });
  const monthlyAvg = Object.values(monthMap).map(m => ({
    month: m.month,
    avgHistorical: m.historical / m.count,
    avgForecast: forecast.length > 0 ? (forecast.reduce((sum, f) => sum + f.predicted, 0) / forecast.length) : 0
  }));

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

  const accuracy = 100 - metrics.mape;
  const totalForecast = forecast.reduce((sum, f) => sum + f.predicted, 0);
  const avgHistorical = historical.reduce((sum, h) => sum + h.actual, 0) / historical.length;
  const growthPercent = ((totalForecast - avgHistorical) / avgHistorical * 100).toFixed(1);
  
  const topDriver = feature_importance && feature_importance.length > 0 
    ? feature_importance[0].feature 
    : 'N/A';

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444'];

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Controls */}
      {currentPage === 0 && (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl shadow-2xl p-8 text-white border border-white/20 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-400/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">Forecast Dashboard</h1>
                <p className="text-blue-100 text-sm mt-1">AI-Powered Sales Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
              <Settings size={20} />
              <div className="space-y-1">
                <div className="flex gap-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full font-semibold border border-white/30">
                    {forecastData.model_type.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full font-semibold border border-white/30">
                    {forecastData.horizon}M
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full font-semibold border border-white/30">
                    {forecastData.aggregation}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Content: Chart + KPIs */}
      {currentPage === 0 && (
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Large Forecast Chart */}
        <div className="lg:col-span-2">
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Forecast Trend
                  </h2>
                </div>
                <p className="text-gray-600 text-sm ml-6">Historical data vs predictions with confidence intervals</p>
              </div>
              
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={combinedData} margin={{ top: 15, right: 30, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickFormatter={formatNumber}
                    />
                    <Tooltip
                      formatter={(value, name) => [formatNumber(value), name]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Area
                      dataKey="upper"
                      stroke="none"
                      fill="url(#colorConfidence)"
                      fillOpacity={1}
                      name="Confidence Band"
                    />
                    <Area
                      dataKey="lower"
                      stroke="none"
                      fill="#ffffff"
                      fillOpacity={1}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#1e40af"
                      strokeWidth={3}
                      dot={false}
                      name="Actual"
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
            </div>
          </div>
        </div>

        {/* Right: KPI Cards */}
        <div className="space-y-4">
          {/* Projected Revenue */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-600/80 text-sm font-semibold tracking-wide uppercase">Projected Revenue</p>
                  <p className="text-4xl font-bold text-emerald-900 mt-2">
                    ${formatNumber(totalForecast)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp size={28} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-emerald-600">Forecast total for {forecastData.horizon} months</p>
            </div>
          </div>

          {/* Growth Percentage */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-600/80 text-sm font-semibold tracking-wide uppercase">Growth Rate</p>
                  <p className={`text-4xl font-bold mt-2 ${growthPercent > 0 ? 'text-blue-900' : 'text-red-900'}`}>
                    {growthPercent}%
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity size={28} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-blue-600">vs. historical average</p>
            </div>
          </div>

          {/* Top Driver */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-purple-600/80 text-sm font-semibold tracking-wide uppercase">Top Driver</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2 truncate">
                    {topDriver}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target size={28} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-purple-600">Primary forecast driver</p>
            </div>
          </div>

          {/* Model Accuracy */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-amber-600/80 text-sm font-semibold tracking-wide uppercase">Accuracy</p>
                  <p className={`text-4xl font-bold mt-2 ${accuracy >= 90 ? 'text-green-900' : accuracy >= 80 ? 'text-yellow-900' : 'text-red-900'}`}>
                    {accuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertCircle size={28} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-amber-600">MAPE-based metric</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Detailed Analysis Charts */}
      {currentPage === 1 && (
      <div className="space-y-8">
        {/* Residuals Analysis */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forecast Residuals</h2>
              <p className="text-gray-600 text-sm">Error between actual and predicted values (recent 20 periods)</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={residualsData} margin={{ top: 15, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="residual" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends Comparison */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Historical vs Forecast Avg</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyAvg.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="avgHistorical" fill="#3b82f6" name="Historical Avg" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avgForecast" fill="#8b5cf6" name="Forecast Avg" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Summary */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <span className="text-sm font-semibold text-gray-700">MAE</span>
                  <span className="text-lg font-bold text-blue-600">{metrics.mae?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg border border-purple-200/50">
                  <span className="text-sm font-semibold text-gray-700">RMSE</span>
                  <span className="text-lg font-bold text-purple-600">{metrics.rmse?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-pink-50/50 rounded-lg border border-pink-200/50">
                  <span className="text-sm font-semibold text-gray-700">MAPE</span>
                  <span className="text-lg font-bold text-pink-600">{metrics.mape?.toFixed(2) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/50">
                  <span className="text-sm font-semibold text-gray-700">Accuracy</span>
                  <span className="text-lg font-bold text-emerald-600">{accuracy.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products & Regions */}
        {(top_products || top_regions) && (
        <div className="grid lg:grid-cols-2 gap-8">
          {top_products && top_products.length > 0 && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={top_products.slice(0, 5)} layout="vertical" margin={{ left: 100, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          {top_regions && top_regions.length > 0 && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Top Regions</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={top_regions.slice(0, 5)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {top_regions.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
        </div>
        )}
      </div>
      )}

      {/* Decomposition / Feature Importance Tabs */}
      {currentPage === 2 && (
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-white/30 flex gap-1 p-4 bg-white/20">
            {decomposition && (
              <button
                onClick={() => setTabIndex(0)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  tabIndex === 0
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/40 text-gray-700 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} />
                  Time Series Decomposition
                </div>
              </button>
            )}
            {feature_importance && feature_importance.length > 0 && (
              <button
                onClick={() => setTabIndex(1)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  tabIndex === 1
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/40 text-gray-700 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} />
                  Feature Importance
                </div>
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Time Series Decomposition */}
            {decomposition && tabIndex === 0 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Component</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={decomposition.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                      <Tooltip formatter={(value) => formatNumber(value)} />
                      <Line type="monotone" dataKey="value" stroke="#1e40af" dot={false} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Seasonal Component</h3>
                  <ResponsiveContainer width="100%" height={250}>
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

            {/* Feature Importance */}
            {feature_importance && feature_importance.length > 0 && tabIndex === 1 && (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={feature_importance} layout="vertical" margin={{ left: 150, right: 30 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="feature" 
                    type="category" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={140}
                  />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="importance" fill="url(#barGradient)" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Insights Feed */}
      {currentPage === 3 && insightsData && (
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              Business Insights
            </h2>
            
            {insightsData.bullets && insightsData.bullets.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Observations</h3>
                <div className="space-y-3">
                  {insightsData.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 hover:bg-blue-100/50 transition-colors">
                      <div className="w-2 h-2 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700 text-sm leading-relaxed">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insightsData.recommendations && insightsData.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {insightsData.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-100/50 transition-colors">
                      <div className="w-2 h-2 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700 text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer: Export Buttons */}
      {currentPage === 0 && (
      <div className="flex justify-center gap-4 pt-8 border-t border-white/20 mb-8">
        <button
          onClick={() => handleDownload('csv')}
          className="group/btn flex items-center gap-3 px-8 py-4 bg-white/40 hover:bg-white/60 border border-white/50 rounded-2xl transition-all duration-300 backdrop-blur-xl font-semibold hover:scale-105 hover:shadow-lg"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
        <button
          onClick={() => handleDownload('pdf')}
          className="group/btn flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg"
        >
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>
      )}

      {/* Bottom Pagination Controls */}
      <div className="flex items-center justify-center gap-8 pt-12 pb-8 border-t border-white/20">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            currentPage === 0
              ? 'bg-white/20 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:scale-105 hover:shadow-lg'
          }`}
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        {/* Page Indicators */}
        <div className="flex items-center gap-3">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentPage(idx);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentPage === idx
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              title={`Go to page ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            currentPage === totalPages - 1
              ? 'bg-white/20 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-lg'
          }`}
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
