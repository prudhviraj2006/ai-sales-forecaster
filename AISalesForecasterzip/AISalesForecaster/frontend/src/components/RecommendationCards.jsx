import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';

function RecommendationCards({ recommendations, darkMode }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getIcon = (id) => {
    switch(id) {
      case 'price_optimize': return <TrendingUp size={20} />;
      case 'promotional_discount': return <Target size={20} />;
      case 'inventory_buffer': return <AlertCircle size={20} />;
      case 'seasonal_campaign': return <Lightbulb size={20} />;
      default: return <Lightbulb size={20} />;
    }
  };

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'high': return darkMode ? 'from-red-600 to-orange-600' : 'from-red-500 to-orange-500';
      case 'medium': return darkMode ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500';
      default: return darkMode ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <h4 className="col-span-full font-semibold mb-2 flex items-center gap-2">
        <Lightbulb size={20} className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
        🤖 AI Revenue Recommendations
      </h4>
      
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`p-4 rounded-lg border-l-4 transition-all ${
            darkMode
              ? `bg-slate-800 border-l-blue-500 hover:bg-slate-750`
              : `bg-white border-l-blue-500 hover:shadow-lg`
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getImpactColor(rec.impact)}`}>
              {getIcon(rec.id)}
            </div>
            <div className="flex-1">
              <h5 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {rec.title}
              </h5>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {rec.description}
              </p>
              <div className={`mt-2 flex items-center justify-between text-xs ${
                darkMode ? 'text-green-400' : 'text-green-700'
              }`}>
                <span className="font-medium">{rec.action}</span>
                <span className="font-bold">{rec.expected_uplift}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecommendationCards;
