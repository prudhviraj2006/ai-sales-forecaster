import { BarChart3, Zap, Lightbulb, Upload, FileText, User, RefreshCw } from 'lucide-react';

function Stepper({ currentStep, onStepClick, hasUploadData, hasForecastData, onReset, darkMode }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, disabled: !hasForecastData },
    { id: 'forecast', label: 'Forecast', icon: Zap, disabled: !hasUploadData },
    { id: 'insights', label: 'Insights', icon: Lightbulb, disabled: !hasForecastData },
    { id: 'upload', label: 'Upload Data', icon: Upload, disabled: false },
    { id: 'reports', label: 'Reports', icon: FileText, disabled: !hasForecastData },
  ];

  const handleMenuClick = (itemId) => {
    if (itemId === 'upload' || itemId === 'upload-nav') {
      onStepClick('upload');
    } else if (itemId === 'forecast') {
      onStepClick('config');
    } else if (itemId === 'dashboard') {
      onStepClick('dashboard');
    } else if (itemId === 'insights') {
      onStepClick('dashboard');
    }
  };

  const stepMap = {
    'upload': 'upload',
    'preview': 'upload',
    'config': 'forecast',
    'dashboard': 'dashboard'
  };

  const currentMenuItem = stepMap[currentStep] || 'upload';

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col z-40 shadow-2xl">
      <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <User size={24} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">AI Forecaster</p>
            <p className="text-slate-400 text-xs">Sales Analytics</p>
          </div>
        </div>
      </div>

      {currentStep !== 'upload' && (
        <div className="px-4 py-4 border-b border-slate-700">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={18} />
            <span>Start Over</span>
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMenuItem === (item.id === 'forecast' ? 'forecast' : item.id === 'upload' ? 'upload' : 'dashboard');
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : isDisabled
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon size={20} className={`flex-shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-lg" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          AI Sales Forecaster v1.0
        </p>
      </div>
    </div>
  );
}

export default Stepper;
