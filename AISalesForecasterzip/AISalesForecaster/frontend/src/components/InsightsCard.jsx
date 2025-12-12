import { 
  Lightbulb, TrendingUp, TrendingDown, Minus, 
  CheckCircle, AlertTriangle, Info, Download,
  DollarSign, Calendar, Package, Zap
} from 'lucide-react';
import { downloadReport } from '../services/api';

function InsightsCard({ insights, jobId }) {
  const { title, summary, kpis, bullets, recommendations } = insights;

  const getIconComponent = (iconName) => {
    const icons = {
      'chart-line': TrendingUp,
      'trending-up': TrendingUp,
      'trending-down': TrendingDown,
      'calendar': Calendar,
      'calendar-check': Calendar,
      'check-circle': CheckCircle,
      'check': CheckCircle,
      'alert-triangle': AlertTriangle,
      'zap': Zap,
      'minus': Minus,
      'info': Info,
    };
    return icons[iconName] || Info;
  };

  const getSeverityStyles = (severity) => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };
    return styles[severity] || styles.info;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getPriorityStyles = (priority) => {
    const styles = {
      high: 'border-red-200 bg-red-50',
      medium: 'border-amber-200 bg-amber-50',
      low: 'border-blue-200 bg-blue-50',
    };
    return styles[priority] || styles.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Inventory': Package,
      'Promotion': Zap,
      'Pricing': DollarSign,
      'Data Quality': Info,
    };
    const Icon = icons[category] || Lightbulb;
    return <Icon size={20} />;
  };

  const handleDownload = async () => {
    try {
      await downloadReport(jobId, 'pdf');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="gradient-bg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lightbulb size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-blue-100 text-sm">AI-Generated Business Insights</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Download size={18} />
            Download Report
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">{kpi.name}</span>
                  {getTrendIcon(kpi.trend)}
                </div>
                <p className="text-xl font-bold text-gray-800">{kpi.value}</p>
                {kpi.change && (
                  <p className="text-xs text-gray-500 mt-1">{kpi.change}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Key Insights</h3>
          <div className="space-y-3">
            {bullets.map((bullet, idx) => {
              const Icon = getIconComponent(bullet.icon);
              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityStyles(bullet.severity)}`}
                >
                  <Icon size={20} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{bullet.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Recommendations</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border-2 ${getPriorityStyles(rec.priority)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                    rec.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {getCategoryIcon(rec.category)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {rec.category}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600">{rec.description}</p>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                    rec.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsightsCard;
