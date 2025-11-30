import { Loader2, BarChart3 } from 'lucide-react';

function LoadingOverlay({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <BarChart3 size={32} className="text-white" />
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-lg font-semibold text-gray-800">Please Wait</span>
        </div>
        
        <p className="text-gray-600">{message}</p>
        
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse-slow w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
