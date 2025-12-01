import { CheckCircle, AlertTriangle, Info, Calendar, Hash, Table, RefreshCw } from 'lucide-react';

function DataPreview({ data, onRefresh, darkMode }) {
  const { validation, preview, columns, numeric_columns, categorical_columns } = data;

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-sm border overflow-hidden ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700' : 'border-gray-100'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Data Preview</h2>
            <p className={darkMode ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}>Review your uploaded data before proceeding</p>
          </div>
          <button
            onClick={onRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md'
            }`}
          >
            <RefreshCw size={18} />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className={`grid md:grid-cols-3 gap-4 p-6 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Table size={20} className="text-blue-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Rows</p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{validation.row_count.toLocaleString()}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hash size={20} className="text-purple-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Columns</p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{validation.column_count}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date Range</p>
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {validation.date_range ? 
                  `${validation.date_range.start} to ${validation.date_range.end}` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {(validation.errors?.length > 0 || validation.warnings?.length > 0) && (
          <div className={`p-6 border-t space-y-3 ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            {validation.errors?.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings?.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {validation.is_valid && (
          <div className={`p-4 border-t bg-green-50 flex items-center gap-2 text-green-700 ${
            darkMode ? 'border-slate-700' : 'border-gray-100'
          }`}>
            <CheckCircle size={20} />
            <span className="font-medium">Data validation passed! Ready for forecasting.</span>
          </div>
        )}
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sample Data (First 10 rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-900' : 'bg-gray-50'}>
              <tr>
                {columns.map((col) => (
                  <th key={col} className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {col}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      numeric_columns.includes(col) 
                        ? 'bg-blue-100 text-blue-700' 
                        : darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {numeric_columns.includes(col) ? 'num' : 'text'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
              {preview.map((row, idx) => (
                <tr key={idx} className={darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}>
                  {columns.map((col) => (
                    <td key={col} className={`px-4 py-3 whitespace-nowrap ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`rounded-xl shadow-sm border p-6 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Column Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Numeric Columns ({numeric_columns.length})</h4>
            <div className="flex flex-wrap gap-2">
              {numeric_columns.map((col) => (
                <span key={col} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categorical Columns ({categorical_columns.length})</h4>
            <div className="flex flex-wrap gap-2">
              {categorical_columns.map((col) => (
                <span key={col} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPreview;
