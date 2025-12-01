import { useState } from 'react';
import { Info } from 'lucide-react';

function Tooltip({ content, children, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent border-4',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="p-1 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full"
        aria-label="More information"
      >
        {children || <Info size={16} />}
      </button>
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 shadow-xl max-w-xs whitespace-normal">
            {content}
            <div className={`absolute ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;
