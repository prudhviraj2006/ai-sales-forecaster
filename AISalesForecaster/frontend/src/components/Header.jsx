import { BarChart3 } from 'lucide-react';

function Header({ currentStep }) {
  const steps = [
    { id: 'upload', label: 'Upload' },
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configure' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <header className="gradient-bg text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Sales Forecaster</h1>
              <p className="text-sm text-blue-100">Business Insight Generator</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${index <= currentIndex ? 'bg-white/20' : 'bg-white/10 text-blue-200'}
                `}>
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${index < currentIndex ? 'bg-white/40' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
