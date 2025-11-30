import { Upload, Eye, Settings, BarChart3 } from 'lucide-react';

function Stepper({ currentStep, onStepClick, hasUploadData, hasForecastData }) {
  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload, disabled: false },
    { id: 'preview', label: 'Preview', icon: Eye, disabled: !hasUploadData },
    { id: 'config', label: 'Configure', icon: Settings, disabled: !hasUploadData },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, disabled: !hasForecastData }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-32 bg-gradient-to-b from-blue-600 via-blue-700 to-purple-800 border-r border-white/20 backdrop-blur-xl flex flex-col items-center py-8 gap-8 z-40">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isClickable = !step.disabled;

        return (
          <div key={step.id} className="flex flex-col items-center gap-4">
            {/* Connection line to next step */}
            {idx < steps.length - 1 && (
              <div className="w-1 h-12 bg-gradient-to-b from-white/40 to-white/20 rounded-full" />
            )}

            {/* Step button */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={step.disabled}
              className={`group relative flex flex-col items-center gap-2 transition-all duration-300 ${
                step.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* Animated background glow */}
              <div
                className={`absolute inset-0 rounded-full blur-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-white/40 scale-150'
                    : isClickable
                    ? 'bg-white/20 scale-100 group-hover:scale-125 group-hover:bg-white/30'
                    : 'bg-black/20 scale-100'
                }`}
              />

              {/* Icon circle */}
              <div
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive
                    ? 'bg-white text-blue-600 border-white shadow-lg scale-110'
                    : isClickable
                    ? 'bg-white/20 text-white border-white/40 hover:bg-white/30 hover:border-white/60'
                    : 'bg-black/20 text-gray-400 border-gray-600'
                }`}
              >
                <StepIcon size={28} />
              </div>

              {/* Label */}
              <span
                className={`text-xs font-bold text-center transition-all duration-300 ${
                  isActive ? 'text-white scale-110' : 'text-white/70'
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Connection line to previous step */}
            {idx > 0 && (
              <div className="w-1 h-12 bg-gradient-to-t from-white/40 to-white/20 rounded-full" />
            )}
          </div>
        );
      })}

      {/* Bottom spacing */}
      <div className="flex-1" />
    </div>
  );
}

export default Stepper;
