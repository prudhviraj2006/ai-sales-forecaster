import { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ForecastConfig from './components/ForecastConfig';
import Dashboard from './components/Dashboard';
import InsightsCard from './components/InsightsCard';
import LoadingOverlay from './components/LoadingOverlay';
import RecentSessions from './components/RecentSessions';
import Stepper from './components/Stepper';
import { getJobFullData } from './services/api';

function App() {
  const [step, setStep] = useState('upload');
  const [uploadData, setUploadData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const handleRefreshData = () => {
    if (uploadData) {
      setStep('upload');
      setUploadData(null);
      setForecastData(null);
      setInsightsData(null);
    }
  };

  const handleStepClick = (stepId) => {
    if (stepId === 'upload') {
      setStep('upload');
    } else if (stepId === 'preview' && uploadData) {
      setStep('preview');
    } else if (stepId === 'config' && uploadData) {
      setStep('config');
    } else if (stepId === 'dashboard' && forecastData) {
      setStep('dashboard');
    }
  };

  const handleLoadSession = async (jobId) => {
    try {
      setLoading(true);
      setLoadingMessage('Loading previous session...');
      setError(null);
      
      const data = await getJobFullData(jobId);
      
      if (data.forecast) {
        setUploadData({ job_id: jobId, ...data.job });
        
        const parseIfString = (value, fallback) => {
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return fallback;
            }
          }
          return value ?? fallback;
        };
        
        const forecastResult = {
          model_type: data.forecast.model_type,
          aggregation: data.forecast.aggregation,
          horizon: data.forecast.horizon,
          target_column: data.forecast.target_column,
          metrics: parseIfString(data.forecast.metrics, {}),
          forecast: parseIfString(data.forecast.forecast_data, []),
          historical: parseIfString(data.forecast.historical_data, []),
          decomposition: parseIfString(data.forecast.decomposition_data, null),
          feature_importance: parseIfString(data.forecast.feature_importance, null),
          top_products: parseIfString(data.forecast.top_products, null),
          top_regions: parseIfString(data.forecast.top_regions, null)
        };
        
        setForecastData(forecastResult);
        
        if (data.insights) {
          setInsightsData({
            title: data.insights.title,
            summary: data.insights.summary,
            kpis: parseIfString(data.insights.kpis, []),
            bullets: parseIfString(data.insights.bullets, []),
            recommendations: parseIfString(data.insights.recommendations, [])
          });
        }
        
        setStep('dashboard');
      } else {
        setUploadData({ job_id: jobId, ...data.job });
        setStep('preview');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Unable to load the selected session. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header 
        currentStep={step} 
        darkMode={darkMode} 
        onToggleDarkMode={() => setDarkMode(!darkMode)} 
      />
      <Stepper 
        currentStep={step} 
        onStepClick={handleStepClick}
        hasUploadData={!!uploadData}
        hasForecastData={!!forecastData}
        onReset={handleReset}
        darkMode={darkMode}
      />
      
      {loading && <LoadingOverlay message={loadingMessage} />}
      
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}
      
      <main className="ml-64 max-w-7xl mx-auto px-4 py-8">
        {step === 'upload' && (
          <div className="space-y-8">
            <FileUpload 
              onUploadSuccess={handleUploadSuccess}
              setLoading={setLoading}
              setLoadingMessage={setLoadingMessage}
              setError={setError}
              darkMode={darkMode}
              refreshCounter={refreshCounter}
            />
            <RecentSessions onLoadSession={handleLoadSession} darkMode={darkMode} />
          </div>
        )}
        
        {step === 'preview' && uploadData && (
          <div className="space-y-6">
            <DataPreview 
              data={uploadData} 
              onRefresh={handleRefreshData}
              darkMode={darkMode}
            />
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
            darkMode={darkMode}
          />
        )}
        
        {step === 'dashboard' && forecastData && (
          <Dashboard 
            forecastData={forecastData} 
            jobId={uploadData?.job_id}
            insightsData={insightsData}
            uploadData={uploadData}
            darkMode={darkMode}
          />
        )}
      </main>
    </div>
  );
}

export default App;
