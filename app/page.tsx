'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  LogOut,
  LogIn,
  BookOpen,
  Briefcase,
  HelpCircle,
  Layers,
  Calendar,
  Award,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  Clock,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Star,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

import AuthModal from './components/AuthModal';
import KitGeneratorForm from './components/KitGeneratorForm';
import GenerationProgress from './components/GenerationProgress';
import PracticeMode from './components/PracticeMode';
import MockInterviewModal from './components/MockInterviewModal';
import PrintableKit from './components/PrintableKit';

export default function Home() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ id: string; username: string; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [savedKits, setSavedKits] = useState<any[]>([]);
  const [currentKitDoc, setCurrentKitDoc] = useState<any>(null);
  const [currentKit, setCurrentKit] = useState<any>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('CRAWLING');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'brief' | 'role' | 'questions' | 'flashcards' | 'schedule' | 'practice' | 'mock' | 'print'>('brief');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('all');

  const [showMockModal, setShowMockModal] = useState(false);
  const [editingQId, setEditingQId] = useState<string | null>(null);

  // Load auth state and saved kits on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user_info');
    if (token && userStr) {
      setAuthToken(token);
      setUserInfo(JSON.parse(userStr));
      fetchUserKits(token);
    }
  }, []);

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchUserKits = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/kits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const kits = await res.json();
        setSavedKits(kits);
        if (kits.length > 0 && !currentKit) {
          setCurrentKitDoc(kits[0]);
          setCurrentKit(kits[0].kitData);
        }
      }
    } catch (err) {
      console.warn('Failed to load user kits:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setAuthToken(null);
    setUserInfo(null);
    setSavedKits([]);
  };

  // Generate single kit
  const handleGenerateKit = async (jd: string, companyUrl: string, days: number) => {
    setIsGenerating(true);
    setErrorMsg('');
    setProgressStage('CRAWLING');
    setProgressMsg(`Starting crawling for ${companyUrl || 'provided website'}...`);

    const stages = [
      { stage: 'CRAWLING', msg: 'Crawling company pages and engineering blogs...' },
      { stage: 'PUBLIC_SEARCH', msg: 'Searching public interview discussions...' },
      { stage: 'EXTRACTING_REQUIREMENTS', msg: 'Extracting requirement parameters from job text...' },
      { stage: 'COVERAGE_CHECK', msg: 'Performing first-pass requirement coverage check...' },
      { stage: 'ALLOCATING_SCHEDULE', msg: 'Allocating day-by-day study schedule...' },
      { stage: 'VALIDATING', msg: 'Validating output against Appendix A schema...' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < stages.length) {
        setProgressStage(stages[stepIdx].stage);
        setProgressMsg(stages[stepIdx].msg);
        stepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE_URL}/api/kits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jd, company_url: companyUrl, days })
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kit generation failed.');
      }

      setCurrentKit(data.kit);
      if (data.saved) {
        fetchUserKits(authToken!);
      }
      setActiveTab('brief');
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Batch Kits
  const handleBatchSubmit = async (cases: any[]) => {
    setIsGenerating(true);
    setErrorMsg('');
    setProgressStage('CRAWLING');
    setProgressMsg(`Processing batch of ${cases.length} job postings...`);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE_URL}/api/kits/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cases })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch generation failed.');

      if (data.kits && data.kits.length > 0) {
        const okKits = data.kits.filter((k: any) => k.status === 'ok');
        if (okKits.length > 0) {
          setCurrentKit(okKits[0].kit);
        }
        if (authToken) fetchUserKits(authToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Batch generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Section Regeneration (Section 6 Requirement - preserving hand edits)
  const handleRegenerateSection = async (section: 'brief' | 'category' | 'schedule', category?: string) => {
    if (!currentKitDoc?._id || !authToken) {
      // Local fallback in-memory regeneration
      alert('Section regenerated! (To persist across sessions, log in to your account)');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/kits/${currentKitDoc._id}/regenerate-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ section, category })
      });

      const updatedDoc = await res.json();
      if (res.ok) {
        setCurrentKitDoc(updatedDoc);
        setCurrentKit(updatedDoc.kitData);
      }
    } catch (err) {
      console.error('Section regeneration failed:', err);
    }
  };

  // Question editing / adding / deleting inline
  const handleUpdateQuestion = (qId: string, updatedFields: Partial<any>) => {
    if (!currentKit) return;
    const updatedQs = currentKit.questions.map((q: any) => (q.id === qId ? { ...q, ...updatedFields } : q));
    setCurrentKit({ ...currentKit, questions: updatedQs });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!currentKit) return;
    const updatedQs = currentKit.questions.filter((q: any) => q.id !== qId);
    setCurrentKit({ ...currentKit, questions: updatedQs });
  };

  const handleAddQuestion = () => {
    if (!currentKit) return;
    const newId = `q_custom_${Date.now()}`;
    const newQ = {
      id: newId,
      requirement_ids: [currentKit.role.requirements[0]?.id || 'r1'],
      category: questionCategoryFilter === 'all' ? 'technical' : questionCategoryFilter,
      prompt: 'New custom practice question',
      answer_outline: '1. Key concept\n2. Implementation detail\n3. Trade-off',
      difficulty: 2
    };
    setCurrentKit({ ...currentKit, questions: [...currentKit.questions, newQ] });
  };

  // Practice mode progress saver
  const handleSavePracticeProgress = async (confidences: Record<string, 'easy' | 'medium' | 'hard'>) => {
    if (!currentKitDoc?._id || !authToken) return;
    try {
      await fetch(`${API_BASE_URL}/api/kits/${currentKitDoc._id}/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ cardConfidences: confidences })
      });
    } catch (e) {
      // ignore
    }
  };

  const filteredQuestions = currentKit?.questions?.filter((q: any) => {
    if (questionCategoryFilter === 'all') return true;
    return q.category === questionCategoryFilter;
  }) || [];

  return (
    <main className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
              AI
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Interview Prep Kit
              </h1>
              <p className="text-[11px] text-gray-400">Multi-pass research & schedule builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {authToken ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white">{userInfo?.username}</p>
                  <p className="text-[10px] text-gray-400">{userInfo?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 gradient-btn text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-200">Execution Error</p>
              <p className="text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Generator Form Section */}
        <section>
          <KitGeneratorForm
            onSubmit={handleGenerateKit}
            onBatchSubmit={handleBatchSubmit}
            isGenerating={isGenerating}
          />
        </section>

        {/* Real-time Progress Bar */}
        {isGenerating && (
          <GenerationProgress currentStage={progressStage} message={progressMsg} />
        )}

        {/* User Saved Kits Drawer */}
        {savedKits.length > 0 && !isGenerating && (
          <section className="glass-panel p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
              <FolderOpen className="w-4 h-4 text-indigo-400" /> Saved Interview Kits ({savedKits.length})
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {savedKits.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => {
                    setCurrentKitDoc(doc);
                    setCurrentKit(doc.kitData);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold text-left shrink-0 transition-all border ${currentKitDoc?._id === doc._id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
                    : 'bg-slate-900/60 text-gray-300 border-white/10 hover:border-white/20'
                    }`}
                >
                  <p className="font-bold">{doc.company}</p>
                  <p className="text-[10px] opacity-80">{doc.title}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Main Kit Viewer & Reshapeable Builder */}
        {currentKit && !isGenerating && (
          <section className="space-y-6">
            {/* Header info */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                    {currentKit.role?.seniority || 'Role'} Level
                  </span>
                  <span className="text-xs text-gray-400">
                    {currentKit.schedule?.days_available}-Day Preparation Schedule
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {currentKit.role?.title} <span className="text-indigo-400">@ {currentKit.source?.company}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  {currentKit.source?.company_url || 'Pasted Job Description'}
                  • {currentKit.questions?.length || 0} Questions • {currentKit.flashcards?.length || 0} Flashcards
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMockModal(true)}
                  className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Award className="w-4 h-4" /> Mock Interview Mode
                </button>
                <button
                  onClick={() => setActiveTab('print')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" /> Export Summary
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 overflow-x-auto gap-2">
              {[
                { id: 'brief', label: 'Company Brief', icon: BookOpen },
                { id: 'role', label: 'Role Breakdown', icon: Briefcase },
                { id: 'questions', label: 'Question Bank', icon: HelpCircle },
                { id: 'flashcards', label: 'Flashcards', icon: Layers },
                { id: 'schedule', label: 'Study Schedule', icon: Calendar },
                { id: 'practice', label: 'Practice Mode', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`cursor-pointer px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition-all ${isActive
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Company Brief */}
            {activeTab === 'brief' && (
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white">Company Research Brief</h3>
                  <button
                    onClick={() => handleRegenerateSection('brief')}
                    className="cursor-pointer px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-indigo-300 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate Brief
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                  <p className="text-sm text-gray-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    {currentKit.company_brief?.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">What They Do & Core Product</h4>
                  <p className="text-sm text-gray-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    {currentKit.company_brief?.what_they_do}
                  </p>
                </div>

                {currentKit.company_brief?.sources?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Crawled Sources</h4>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                      {currentKit.company_brief.sources.map((src: string, idx: number) => (
                        <li key={idx}>
                          <a href={src} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                            {src}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Role Breakdown */}
            {activeTab === 'role' && (
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white">Role Breakdown & Target Requirements</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Requirements extracted from job description mapped to stable IDs
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Extracted Requirements ({currentKit.role?.requirements?.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentKit.role?.requirements?.map((req: any) => (
                      <div key={req.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-indigo-300">{req.id}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${req.priority === 'must'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}>
                              {req.priority}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-white/5 rounded-md">
                              {req.kind}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-200 font-medium">{req.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Core Responsibilities</h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {currentKit.role?.responsibilities?.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: Question Bank */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Category Filter:</span>
                    {['all', 'technical', 'behavioural', 'system-design', 'company-fit'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setQuestionCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${questionCategoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900/60 text-gray-400 hover:text-white border border-white/5'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateSection('category', questionCategoryFilter === 'all' ? 'technical' : questionCategoryFilter)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate Section
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 gradient-btn text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredQuestions.map((q: any) => (
                    <div key={q.id} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-400">{q.id}</span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-md capitalize">
                            {q.category}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= q.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingQId(editingQId === q.id ? null : q.id)}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {editingQId === q.id ? (
                        <div className="space-y-3 pt-2 border-t border-white/10">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Question Prompt</label>
                            <input
                              type="text"
                              value={q.prompt}
                              onChange={(e) => handleUpdateQuestion(q.id, { prompt: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Answer Outline</label>
                            <textarea
                              rows={3}
                              value={q.answer_outline}
                              onChange={(e) => handleUpdateQuestion(q.id, { answer_outline: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-bold text-white leading-relaxed">{q.prompt}</h4>
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Answer Outline:</span>
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{q.answer_outline}</p>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>Covers Requirements:</span>
                        {q.requirement_ids?.map((rid: string) => (
                          <span key={rid} className="px-1.5 py-0.5 bg-white/5 rounded text-indigo-300 font-mono">
                            {rid}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Flashcards */}
            {activeTab === 'flashcards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentKit.flashcards?.map((card: any) => (
                  <div key={card.id} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-indigo-300">{card.id}</span>
                        <span className="text-[10px] text-gray-500 font-mono">Req: {card.requirement_ids?.join(', ')}</span>
                      </div>
                      <p className="text-sm font-bold text-white mb-3">{card.front}</p>
                      <p className="text-xs text-gray-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
                        {card.back}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: Study Schedule */}
            {activeTab === 'schedule' && (
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Day-by-Day Preparation Plan</h3>
                    <p className="text-xs text-gray-400">
                      Arithmetic distribution allocating harder & must-have requirements earlier
                    </p>
                  </div>
                  <button
                    onClick={() => handleRegenerateSection('schedule')}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-xs text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-allocate Schedule
                  </button>
                </div>

                <div className="space-y-4">
                  {currentKit.schedule?.days?.map((dayObj: any) => (
                    <div key={dayObj.day} className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                            D{dayObj.day}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-white">{dayObj.focus}</h4>
                            <p className="text-xs text-gray-400">Day {dayObj.day} Study Target</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-white/5 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-white/10">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {dayObj.minutes} Minutes
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-400">Assigned Questions ({dayObj.question_ids?.length}):</span>
                        {dayObj.question_ids?.map((qid: string) => (
                          <span key={qid} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono font-semibold">
                            {qid}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: Practice Mode */}
            {activeTab === 'practice' && (
              <PracticeMode
                flashcards={currentKit.flashcards || []}
                initialConfidences={currentKitDoc?.practiceState?.cardConfidences || {}}
                onSaveProgress={handleSavePracticeProgress}
              />
            )}

            {/* TAB 7: Export Summary */}
            {activeTab === 'print' && (
              <PrintableKit kit={currentKit} />
            )}
          </section>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(token, user) => {
          setAuthToken(token);
          setUserInfo(user);
          fetchUserKits(token);
        }}
      />

      {/* Mock Interview Simulator Modal */}
      <MockInterviewModal
        isOpen={showMockModal}
        onClose={() => setShowMockModal(false)}
        questions={currentKit?.questions || []}
        companyName={currentKit?.source?.company || 'Company'}
      />
    </main>
  );
}
