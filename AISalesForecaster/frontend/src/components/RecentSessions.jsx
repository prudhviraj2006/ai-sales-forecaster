import { useState, useEffect } from 'react';
import { Clock, FileText, TrendingUp, ChevronRight, X } from 'lucide-react';
import { getRecentJobs, deleteJob } from '../services/api';

function RecentSessions({ onLoadSession, darkMode }) {
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      setLoading(true);
      const data = await getRecentJobs(10);
      setRecentJobs(data.jobs || []);
    } catch (err) {
      setError('Unable to load recent sessions');
      console.error('Error fetching recent jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (e, jobId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this forecast?')) {
      try {
        await deleteJob(jobId);
        setRecentJobs(recentJobs.filter(job => job.job_id !== jobId));
      } catch (err) {
        console.error('Error deleting job:', err);
        alert('Failed to delete forecast');
      }
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl shadow-sm border p-6 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className={darkMode ? 'text-gray-500' : 'text-gray-500'} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-16 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recentJobs.length === 0) {
    return (
      <div className={`rounded-xl shadow-sm border p-6 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className={darkMode ? 'text-gray-500' : 'text-gray-500'} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
        </div>
        <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {error || 'No recent sessions found. Upload a file to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className={darkMode ? 'text-gray-500' : 'text-gray-500'} />
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
      </div>
      
      <div className="space-y-2">
        {recentJobs.map((job) => (
          <div
            key={job.job_id}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors group cursor-pointer ${
              darkMode
                ? 'bg-slate-700/40 hover:bg-slate-600/60'
                : 'bg-gray-50 hover:bg-blue-50'
            }`}
          >
            <div 
              onClick={() => onLoadSession(job.job_id)}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="flex-shrink-0">
                {job.has_forecast ? (
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0">
                <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {job.original_filename}
                </p>
                <div className={`flex items-center gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>{formatDate(job.created_at)}</span>
                  <span>{job.row_count?.toLocaleString()} rows</span>
                  {job.has_forecast && (
                    <span className="text-green-500">
                      {job.model_type?.toUpperCase()} - {job.horizon}mo
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <ChevronRight 
                size={20} 
                className={`transition-colors ${darkMode ? 'text-gray-600 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'}`}
              />
              <button
                onClick={(e) => handleDeleteJob(e, job.job_id)}
                className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                  darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-600'
                }`}
                title="Delete forecast"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentSessions;
