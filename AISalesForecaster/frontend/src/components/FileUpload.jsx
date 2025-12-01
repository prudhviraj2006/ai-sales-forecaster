import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { uploadCSV } from '../services/api';

function FileUpload({ onUploadSuccess, setLoading, setLoadingMessage, setError, darkMode, refreshCounter }) {
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    if (refreshCounter) {
      setUploadStatus(null);
    }
  }, [refreshCounter]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setLoadingMessage('Uploading and validating your data...');
    setUploadStatus('uploading');
    setError(null);

    try {
      const data = await uploadCSV(file);
      setUploadStatus('success');
      
      setTimeout(() => {
        setLoading(false);
        onUploadSuccess(data);
      }, 500);
    } catch (err) {
      setLoading(false);
      setUploadStatus('error');
      setError(err.response?.data?.detail || 'Failed to upload file. Please try again.');
    }
  }, [onUploadSuccess, setLoading, setLoadingMessage, setError]);

  const handleRefresh = () => {
    setUploadStatus(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Upload Your Sales Data
          </h2>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
            }`}
            title="Refresh to upload new data"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
          Upload a CSV file with your historical sales data to get started with forecasting
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : darkMode 
              ? 'border-slate-600 hover:border-blue-400 bg-slate-800 hover:bg-slate-700' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${uploadStatus === 'success' ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {uploadStatus === 'success' ? (
            <CheckCircle size={48} className="text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle size={48} className="text-red-500" />
          ) : (
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Upload size={32} className={isDragActive ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'} />
            </div>
          )}
          
          <div>
            <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              {isDragActive ? 'Drop your file here' : 'Drag and drop your CSV file'}
            </p>
            <p className={darkMode ? 'text-gray-400 mt-1' : 'text-gray-500 mt-1'}>or click to browse</p>
          </div>
        </div>
      </div>

      <div className={`mt-8 rounded-xl p-6 shadow-sm border ${
        darkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="text-blue-600 mt-1" size={24} />
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Expected CSV Format</h3>
            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your CSV should contain the following columns:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">date</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">product_id</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">region</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">units_sold</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">revenue</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">price</span>
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>promotion_flag*</span>
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>product_name*</span>
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>* Optional columns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
