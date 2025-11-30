import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart
} from 'recharts';
import { TrendingUp, Target, AlertCircle, Download, ChevronDown, ChevronUp, BarChart3, Activity, Sparkles } from 'lucide-react';
import { downloadReport } from '../services/api';

function Dashboard({ forecastData, jobId }) {
  const [showDecomposition, setShowDecomposition] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const { metrics, forecast, historical, decomposition, feature_importance, top_products, top_regions } = forecastData;

  useEffect(() => {
    setAnimationTrigger(true);
  }, []);

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

  const accuracy = 100 - metrics.mape;

  const MetricCard = ({ label, value, icon: Icon, color, description, delay }) => {
    const colorClasses = {
      blue: 'from-blue-600/10 to-cyan-600/10 border-blue-200/50',
      purple: 'from-purple-600/10 to-pink-600/10 border-purple-200/50',
      emerald: 'from-emerald-600/10 to-teal-600/10 border-emerald-200/50',
      amber: 'from-amber-600/10 to-orange-600/10 border-amber-200/50'
    };

    const iconBgClasses = {
      blue: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      purple: 'bg-gradient-to-br from-purple-500 to-pink-500',
      emerald: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      amber: 'bg-gradient-to-br from-amber-500 to-orange-500'
    };

    return (
      <div 
        className={`metric-card-animate group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-semibold tracking-wide uppercase">{label}</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-2">
              {value}
            </p>
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          </div>
          <div className={`${iconBgClasses[color]} rounded-2xl p-4 shadow-lg group-hover:shadow-2xl transition-all duration-500`}>
            <Icon size={28} className="text-white" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Premium Header Section */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl shadow-2xl p-8 md:p-10 text-white border border-white/20 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-400/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Forecast Dashboard</h1>
              </div>
              <p className="text-blue-100 text-lg font-medium mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-sm font-semibold border border-white/30 mr-3">
                  {forecastData.model_type.toUpperCase()}
                </span>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-sm font-semibold border border-white/30">
                  {forecastData.horizon}M Forecast
                </span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleDownload('csv')}
                className="group/btn flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/40 border border-white/30 rounded-xl transition-all duration-300 backdrop-blur-xl font-semibold hover:scale-105 hover:shadow-lg"
              >
                <Download size={20} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="group/btn flex items-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg"
              >
                <Download size={20} />
                <span>PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Model Accuracy"
          value={`${accuracy.toFixed(1)}%`}
          icon={Activity}
          color="emerald"
          description={accuracy >= 90 ? '✓ Excellent confidence' : 'Solid prediction quality'}
          delay={0}
        />
        <MetricCard
          label="Mean Absolute Error"
          value={formatNumber(metrics.mae)}
          icon={Target}
          color="blue"
          description="Average deviation"
          delay={100}
        />
        <MetricCard
          label="Root Mean Squared Error"
          value={formatNumber(metrics.rmse)}
          icon={TrendingUp}
          color="purple"
          description="Penalizes larger errors"
          delay={200}
        />
        <MetricCard
          label="Percentage Error Rate"
          value={`${metrics.mape.toFixed(1)}%`}
          icon={AlertCircle}
          color="amber"
          description="MAPE metric"
          delay={300}
        />
      </div>

      {/* Main Forecast Chart */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Forecast Trend Analysis
              </h2>
            </div>
            <p className="text-gray-600 text-sm mt-2 ml-5">Historical data vs model predictions with confidence intervals</p>
          </div>
          <ResponsiveContainer width="100%" height={480}>
            <ComposedChart data={combinedData} margin={{ top: 15, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#1e40af" stopOpacity={0}/>
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
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
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
      </div>

      {/* Time Series & Feature Importance */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Time Series Decomposition */}
        {decomposition && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
              <button
                onClick={() => setShowDecomposition(!showDecomposition)}
                className="w-full flex items-center justify-between p-8 hover:bg-white/30 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Time Series Decomposition
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">Trend, seasonality & residuals</p>
                  </div>
                </div>
                <div className="transform transition-transform duration-300">
                  {showDecomposition ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>
              
              {showDecomposition && (
                <div className="px-8 pb-8 pt-0 space-y-8 border-t border-white/30">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 px-2">Trend Component</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={decomposition.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Line type="monotone" dataKey="value" stroke="#1e40af" dot={false} strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 px-2">Seasonal Component</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={decomposition.seasonal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#seasonalGradient)" />
                        <defs>
                          <linearGradient id="seasonalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6}/>
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature Importance */}
        {feature_importance && feature_importance.length > 0 && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Feature Importance
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">Key prediction drivers</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
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
            </div>
          </div>
        )}
      </div>

      {/* Top Products & Regions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {top_products && top_products.length > 0 && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Top Performing Products
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">By forecast sales volume</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {top_products.slice(0, 8).map((product, idx) => (
                  <div key={idx} className="group/item flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-100/50 hover:from-emerald-100/70 hover:to-teal-100/70 hover:border-emerald-300/70 transition-all duration-300 cursor-pointer hover:scale-102 hover:shadow-lg">
                    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {product.product_name || product.product_id}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Product ranking</p>
                    </div>
                    <p className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ${formatNumber(product[forecastData.target_column])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {top_regions && top_regions.length > 0 && (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Regional Performance
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">By forecast volume</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={top_regions}>
                  <defs>
                    <linearGradient id="regionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatNumber} />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Bar dataKey={forecastData.target_column} fill="url(#regionGradient)" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
