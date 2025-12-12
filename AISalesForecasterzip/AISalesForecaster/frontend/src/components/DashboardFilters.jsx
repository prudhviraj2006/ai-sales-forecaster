import { X, Filter, RotateCcw } from 'lucide-react';
import { useState } from 'react';

function DashboardFilters({ 
  onFilterChange, 
  onReset, 
  historical, 
  forecast, 
  darkMode,
  activeFilters 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDateRange = () => {
    const allDates = [...historical.map(h => new Date(h.date)), ...forecast.map(f => new Date(f.date))];
    if (allDates.length === 0) return { min: '', max: '' };
    
    const sortedDates = allDates.sort((a, b) => a - b);
    const minDate = sortedDates[0].toISOString().split('T')[0];
    const maxDate = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
    
    return { min: minDate, max: maxDate };
  };

  const { min: minDate, max: maxDate } = getDateRange();

  const handleApplyFilters = () => {
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    onReset();
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          darkMode 
            ? 'bg-slate-700/40 hover:bg-slate-600/60 text-gray-300 border border-slate-600' 
            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
        } ${hasActiveFilters ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400') : ''}`}
      >
        <Filter size={18} />
        <span>Filters {hasActiveFilters && `(${Object.keys(activeFilters).length})`}</span>
      </button>

      {isOpen && (
        <div className={`mt-4 p-6 rounded-lg border ${
          darkMode 
            ? 'bg-slate-800/80 border-slate-700' 
            : 'bg-white border-gray-100'
        } shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Filter Data
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardFilters;
