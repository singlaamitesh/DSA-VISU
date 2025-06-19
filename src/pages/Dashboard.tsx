import React, { useState, useEffect } from 'react';
import { questionService, UserQuestion } from '../lib/supabase';
import { n8nTriggerService } from '../lib/n8nTrigger';
import { useAuth } from '../hooks/useAuth';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download,
  Database,
  Activity,
  RotateCcw,
  TrendingUp,
  Trash2,
  User,
  BarChart3,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [resettingStatus, setResettingStatus] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Wait for auth to load before redirecting
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load questions only after authentication is confirmed
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadQuestions();
    }
  }, [isAuthenticated, authLoading, user, filter]);

  const loadQuestions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await questionService.getUserQuestions(user.id);
      
      // Filter questions based on selected filter
      const filteredData = filter === 'all' 
        ? data 
        : data.filter(q => q.status === filter);
      
      setQuestions(filteredData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionStatus = async (questionId: string, newStatus: 'pending' | 'failed' = 'pending') => {
    setResettingStatus(questionId);
    try {
      await n8nTriggerService.triggerWorkflow(questionId, 'reprocess');
      toast.success(`Question reset to ${newStatus} status. n8n will process it on the next poll.`);
      
      // Reload questions to show updated status
      setTimeout(() => {
        loadQuestions();
      }, 1000);
    } catch (error) {
      console.error('Error resetting question status:', error);
      toast.error('Failed to reset question status');
    } finally {
      setResettingStatus(null);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    setDeletingQuestion(questionId);
    try {
      await questionService.deleteQuestion(questionId);
      toast.success('Question deleted successfully');
      
      // Remove the question from the local state
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setDeletingQuestion(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const downloadSolution = (question: UserQuestion) => {
    if (!question.generated_solution) return;
    
    const blob = new Blob([question.generated_solution], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution-${question.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewSolution = (question: UserQuestion) => {
    if (!question.generated_solution) return;
    
    const newWindow = window.open('', '_blank');
    newWindow?.document.write(question.generated_solution);
    newWindow?.document.close();
  };

  const allQuestions = questions;
  const statusCounts = {
    all: allQuestions.length,
    pending: allQuestions.filter(q => q.status === 'pending').length,
    processing: allQuestions.filter(q => q.status === 'processing').length,
    completed: allQuestions.filter(q => q.status === 'completed').length,
    failed: allQuestions.filter(q => q.status === 'failed').length,
  };

  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after confirming user is not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                My Dashboard
              </h1>
              <p className="text-gray-400">Track your algorithm visualization requests and progress</p>
            </div>
            <button
              onClick={loadQuestions}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Account Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Account:</h4>
              <div className="text-white">
                <p className="font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Total Questions:</h4>
              <div className="text-2xl font-bold text-blue-400">
                {statusCounts.all}
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Completed:</h4>
              <div className="text-2xl font-bold text-green-400">
                {statusCounts.completed}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                filter === status
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:border-slate-600'
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm capitalize">{status}</div>
            </button>
          ))}
        </div>

        {/* Questions Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Database className="w-5 h-5 mr-2" />
              My Questions ({filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {filter === 'all' ? 'No questions found. Submit your first question!' : `No ${filter} questions found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {questions.map((question) => (
                    <tr key={question.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-md">
                          <p className="line-clamp-2">{question.question}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {question.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(question.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(question.status)}`}>
                            {question.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(question.created_at).toLocaleDateString()}
                        <br />
                        {new Date(question.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* Reset to Pending Action */}
                          {(question.status === 'failed' || question.status === 'completed') && (
                            <button
                              onClick={() => resetQuestionStatus(question.id, 'pending')}
                              disabled={resettingStatus === question.id}
                              className="p-2 bg-orange-500/20 text-orange-400 rounded-md hover:bg-orange-500/30 transition-all duration-300 disabled:opacity-50"
                              title="Reset to Pending (Requeue for Processing)"
                            >
                              {resettingStatus === question.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400"></div>
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Solution Actions */}
                          {question.status === 'completed' && question.generated_solution && (
                            <>
                              <button
                                onClick={() => previewSolution(question)}
                                className="p-2 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition-all duration-300"
                                title="Preview Solution"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadSolution(question)}
                                className="p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-all duration-300"
                                title="Download Solution"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Delete Action */}
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            disabled={deletingQuestion === question.id}
                            className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                            title="Delete Question"
                          >
                            {deletingQuestion === question.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;