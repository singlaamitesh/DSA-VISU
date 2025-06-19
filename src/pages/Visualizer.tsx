import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, FileCode, Download, Eye, Lightbulb, Star, Zap, CheckCircle, Clock, AlertCircle, Database, RefreshCw, Lock, Loader, Code } from 'lucide-react';
import { questionService, UserQuestion, preferencesService, PROGRAMMING_LANGUAGES } from '../lib/supabase';
import { n8nTriggerService } from '../lib/n8nTrigger';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

const Visualizer: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState<UserQuestion | null>(null);
  const [generatedSolution, setGeneratedSolution] = useState('');
  const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Wait for auth to load before redirecting
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Load user preferences and set default language
  useEffect(() => {
    if (!isAuthenticated || loading || !user) return;
    
    const loadUserPreferences = async () => {
      try {
        setLoadingPreferences(true);
        const userLang = await preferencesService.getUserLanguage(user.id);
        setSelectedLanguage(userLang);
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Keep default 'javascript' if error
      } finally {
        setLoadingPreferences(false);
      }
    };
    
    loadUserPreferences();
  }, [isAuthenticated, loading, user]);

  // Load pending count for status display
  useEffect(() => {
    if (!isAuthenticated || loading) return;
    
    const loadPendingCount = async () => {
      try {
        const count = await n8nTriggerService.getPendingCount();
        setPendingCount(count);
      } catch (error) {
        console.error('Error loading pending count:', error);
      }
    };
    
    loadPendingCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading]);

  // Load user's previous questions if authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      loadUserQuestions();
    }
  }, [isAuthenticated, user, loading]);

  const loadUserQuestions = async () => {
    if (!user) return;
    
    try {
      const questions = await questionService.getUserQuestions(user.id);
      setUserQuestions(questions);
    } catch (error) {
      console.error('Error loading user questions:', error);
    }
  };

  // Subscribe to real-time updates for the submitted question
  useEffect(() => {
    if (!submittedQuestion) return;

    const subscription = questionService.subscribeToQuestionUpdates(
      submittedQuestion.id,
      (updatedQuestion) => {
        setSubmittedQuestion(updatedQuestion);
        
        if (updatedQuestion.status === 'completed' && updatedQuestion.generated_solution) {
          setGeneratedSolution(updatedQuestion.generated_solution);
          toast.success('Your algorithm visualization is ready!');
        } else if (updatedQuestion.status === 'failed') {
          toast.error('Failed to generate visualization. Please try again.');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [submittedQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Update user's language preference if it's different
      if (selectedLanguage !== 'javascript') {
        try {
          await preferencesService.updateUserLanguage(user!.id, selectedLanguage);
        } catch (error) {
          console.warn('Could not update user language preference:', error);
        }
      }

      // Prepare question data
      const questionData = {
        question: question.trim(),
        user_email: user?.email,
        user_name: user?.user_metadata?.full_name,
        user_id: user?.id,
        preferred_language: selectedLanguage,
      };

      // Save question to Supabase
      const savedQuestion = await questionService.createQuestion(questionData);

      if (savedQuestion) {
        setSubmittedQuestion(savedQuestion);
        toast.success(`Question submitted successfully in ${PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label}! n8n will process it automatically.`);
        
        // Reload user questions
        loadUserQuestions();
        
        // Update pending count
        setPendingCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Failed to submit question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadHTML = () => {
    const blob = new Blob([generatedSolution], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'algorithm-solution.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewSolution = () => {
    const newWindow = window.open('', '_blank');
    newWindow?.document.write(generatedSolution);
    newWindow?.document.close();
  };

  const resetForm = () => {
    setQuestion('');
    setSubmittedQuestion(null);
    setGeneratedSolution('');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for n8n to process...';
      case 'processing':
        return 'n8n is generating your visualization...';
      case 'completed':
        return 'Ready! Your visualization is complete.';
      case 'failed':
        return 'Processing failed. You can retry from your dashboard.';
      default:
        return 'Unknown status';
    }
  };

  const getLanguageIcon = (lang: string) => {
    return PROGRAMMING_LANGUAGES.find(l => l.value === lang)?.icon || '💻';
  };

  const getLanguageLabel = (lang: string) => {
    return PROGRAMMING_LANGUAGES.find(l => l.value === lang)?.label || lang;
  };

  const exampleQuestions = [
    "Create a bubble sort visualization with step-by-step animation",
    "Show how binary search works on a sorted array",
    "Visualize the merge sort divide and conquer approach",
    "Demonstrate how quicksort partitioning works",
    "Create a linear search animation with highlighting",
    "Show how insertion sort builds the sorted portion",
    "Visualize breadth-first search on a graph",
    "Demonstrate dynamic programming for fibonacci sequence"
  ];

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-6 shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-6">
              <span className="gradient-text">
                Algorithm Visualizer
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Sign in to access the algorithm visualizer and create interactive visualizations for your algorithm questions.
            </p>
          </div>

          {/* Authentication Required */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-8 text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold text-blue-400">Authentication Required</h3>
            </div>
            <p className="text-blue-300 mb-6">
              You need to sign in to submit algorithm questions and access the visualizer. 
              Create an account to save your questions, track progress, and access your visualization history.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 font-medium"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Features Preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              What You'll Get After Signing In
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Interactive Visualizations</h4>
                  <p className="text-gray-400 text-sm">Submit algorithm questions and get custom HTML visualizations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Save & Track Progress</h4>
                  <p className="text-gray-400 text-sm">All your questions are saved and you can track processing status</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Download className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Download Solutions</h4>
                  <p className="text-gray-400 text-sm">Get HTML files for offline use and sharing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Real-time Updates</h4>
                  <p className="text-gray-400 text-sm">Live status tracking and notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-6 shadow-lg">
            <Star className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-6">
            <span className="gradient-text">
              Algorithm Visualizer
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform your algorithm ideas into interactive visualizations in your preferred programming language. 
            Your questions are saved and processed automatically by n8n.
          </p>
        </div>

        {/* n8n Status */}
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <Database className="w-6 h-6 text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-green-400">
              Polling-Based Processing Active
            </h3>
          </div>
          <p className="text-green-300 mb-2">
            Questions are automatically processed by n8n polling the database every few minutes.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-green-200">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{pendingCount} pending questions</span>
            </div>
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-1" />
              <span>Auto-polling enabled</span>
            </div>
          </div>
        </div>

        {/* User's Previous Questions */}
        {userQuestions.length > 0 && !submittedQuestion && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-xl backdrop-blur-sm mb-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              Your Recent Questions
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {userQuestions.slice(0, 5).map((q) => (
                <div key={q.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{getLanguageIcon(q.preferred_language || 'javascript')}</span>
                      <span className="text-xs text-gray-400 bg-slate-600 px-2 py-1 rounded">
                        {getLanguageLabel(q.preferred_language || 'javascript')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{q.question}</p>
                    <div className="flex items-center mt-2 space-x-3">
                      {getStatusIcon(q.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {q.status === 'completed' && q.generated_solution && (
                    <button
                      onClick={() => {
                        setSubmittedQuestion(q);
                        setGeneratedSolution(q.generated_solution!);
                      }}
                      className="ml-4 px-3 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-all duration-300 text-sm"
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Question Input Section */}
          {!submittedQuestion && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg mr-3">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                Describe Your Algorithm
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Programming Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <div className="flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      Preferred Programming Language *
                    </div>
                  </label>
                  {loadingPreferences ? (
                    <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded-lg">
                      <Loader className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-gray-400">Loading your preferences...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => setSelectedLanguage(lang.value)}
                          className={`p-3 rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
                            selectedLanguage === lang.value
                              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                              : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-500 hover:bg-slate-600'
                          }`}
                        >
                          <span className="text-lg">{lang.icon}</span>
                          <span className="text-sm font-medium">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Your selection will be saved as your default preference for future questions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    What algorithm would you like to visualize? *
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={`Example: I want to visualize how bubble sort works in ${getLanguageLabel(selectedLanguage)} with smooth animations and step-by-step explanations...`}
                    className="w-full h-32 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-300"
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      Selected language: <span className="text-blue-400">{getLanguageIcon(selectedLanguage)} {getLanguageLabel(selectedLanguage)}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {question.length}/1000 characters
                    </p>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!question.trim() || isSubmitting || loadingPreferences}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Question in {getLanguageLabel(selectedLanguage)}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Status Display */}
          {submittedQuestion && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg mr-3">
                    {getStatusIcon(submittedQuestion.status)}
                  </div>
                  Question Status
                </h3>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-all duration-300"
                >
                  Submit New Question
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">Your Question:</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getLanguageIcon(submittedQuestion.preferred_language || 'javascript')}</span>
                      <span className="text-xs text-gray-400 bg-slate-600 px-2 py-1 rounded">
                        {getLanguageLabel(submittedQuestion.preferred_language || 'javascript')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300">{submittedQuestion.question}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusIcon(submittedQuestion.status)}
                  <span className="text-gray-300">{getStatusText(submittedQuestion.status)}</span>
                </div>

                <div className="text-sm text-gray-400">
                  <p>Question ID: {submittedQuestion.id}</p>
                  <p>Language: {getLanguageLabel(submittedQuestion.preferred_language || 'javascript')}</p>
                  <p>Submitted: {new Date(submittedQuestion.created_at).toLocaleString()}</p>
                  {submittedQuestion.updated_at !== submittedQuestion.created_at && (
                    <p>Last Updated: {new Date(submittedQuestion.updated_at).toLocaleString()}</p>
                  )}
                  <p>Saved to your account: {user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Example Questions */}
          {!submittedQuestion && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mr-3">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                Example Ideas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exampleQuestions.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(example)}
                    className="text-left p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm border border-slate-600/50 hover:border-blue-500/50"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Click any example to use it as a starting point, then customize for your preferred language.
              </p>
            </div>
          )}

          {/* Generated Solution */}
          {generatedSolution && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                    <FileCode className="w-5 h-5 text-white" />
                  </div>
                  Your Solution is Ready!
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={previewSolution}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center shadow-lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={downloadHTML}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center shadow-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  <code>{generatedSolution}</code>
                </pre>
              </div>
              
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold mb-2">
                  Solution Generated Successfully in {getLanguageLabel(submittedQuestion?.preferred_language || 'javascript')}!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-300">
                  <div>✓ Interactive visualization</div>
                  <div>✓ Language-specific code examples</div>
                  <div>✓ Step-by-step explanations</div>
                  <div>✓ Playback controls</div>
                  <div>✓ Processed by n8n</div>
                  <div>✓ Saved to your account</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualizer;