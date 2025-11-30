import { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ForecastConfig from './components/ForecastConfig';
import Dashboard from './components/Dashboard';
import InsightsCard from './components/InsightsCard';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const [step, setStep] = useState('upload');
  const [uploadData, setUploadData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  const handleUploadSuccess = (data) => {
    setUploadData(data);
    setError(null);
    setStep('preview');
  };

  const handleConfigComplete = (forecast, insights) => {
    setForecastData(forecast);
    setInsightsData(insights);
    setStep('dashboard');
  };

  const handleReset = () => {
    setStep('upload');
    setUploadData(null);
    setForecastData(null);
    setInsightsData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onReset={handleReset} currentStep={step} />
      
      {loading && <LoadingOverlay message={loadingMessage} />}
      
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {step === 'upload' && (
          <FileUpload 
            onUploadSuccess={handleUploadSuccess}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setError={setError}
          />
        )}
        
        {step === 'preview' && uploadData && (
          <div className="space-y-6">
            <DataPreview data={uploadData} />
            <div className="flex justify-center">
              <button
                onClick={() => setStep('config')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Forecast Configuration
              </button>
            </div>
          </div>
        )}
        
        {step === 'config' && uploadData && (
          <ForecastConfig
            uploadData={uploadData}
            onComplete={handleConfigComplete}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            setError={setError}
            onBack={() => setStep('preview')}
          />
        )}
        
        {step === 'dashboard' && forecastData && (
          <div className="space-y-6">
            <Dashboard 
              forecastData={forecastData} 
              jobId={uploadData?.job_id}
            />
            {insightsData && (
              <InsightsCard 
                insights={insightsData} 
                jobId={uploadData?.job_id}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
