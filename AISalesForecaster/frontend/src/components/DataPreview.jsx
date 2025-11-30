import { CheckCircle, AlertTriangle, Info, Calendar, Hash, Table } from 'lucide-react';

function DataPreview({ data }) {
  const { validation, preview, columns, numeric_columns, categorical_columns } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Data Preview</h2>
          <p className="text-gray-600 mt-1">Review your uploaded data before proceeding</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 p-6 bg-gray-50">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Table size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-xl font-bold text-gray-800">{validation.row_count.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hash size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Columns</p>
              <p className="text-xl font-bold text-gray-800">{validation.column_count}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Range</p>
              <p className="text-sm font-semibold text-gray-800">
                {validation.date_range ? 
                  `${validation.date_range.start} to ${validation.date_range.end}` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {(validation.errors?.length > 0 || validation.warnings?.length > 0) && (
          <div className="p-6 border-t border-gray-100 space-y-3">
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
          <div className="p-4 border-t border-gray-100 bg-green-50 flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="font-medium">Data validation passed! Ready for forecasting.</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Sample Data (First 10 rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                    {col}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      numeric_columns.includes(col) 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {numeric_columns.includes(col) ? 'num' : 'text'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preview.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Column Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Numeric Columns ({numeric_columns.length})</h4>
            <div className="flex flex-wrap gap-2">
              {numeric_columns.map((col) => (
                <span key={col} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Categorical Columns ({categorical_columns.length})</h4>
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
