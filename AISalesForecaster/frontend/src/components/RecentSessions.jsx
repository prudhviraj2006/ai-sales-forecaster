import { useState, useEffect } from 'react';
import { Clock, FileText, TrendingUp, ChevronRight } from 'lucide-react';
import { getRecentJobs } from '../services/api';

function RecentSessions({ onLoadSession }) {
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">Recent Sessions</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recentJobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">Recent Sessions</h3>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">
          {error || 'No recent sessions found. Upload a file to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-800">Recent Sessions</h3>
      </div>
      
      <div className="space-y-2">
        {recentJobs.map((job) => (
          <button
            key={job.job_id}
            onClick={() => onLoadSession(job.job_id)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
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
                <p className="font-medium text-gray-800 truncate">
                  {job.original_filename}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{formatDate(job.created_at)}</span>
                  <span>{job.row_count?.toLocaleString()} rows</span>
                  {job.has_forecast && (
                    <span className="text-green-600">
                      {job.model_type?.toUpperCase()} - {job.horizon}mo
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <ChevronRight 
              size={20} 
              className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" 
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecentSessions;
