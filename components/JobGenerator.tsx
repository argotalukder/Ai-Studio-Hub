import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateRecruitmentMaterials } from '../services/geminiService';
import { JobGenerationResult } from '../types';
import { Spinner } from './ui/Spinner';
import { FileText, ListChecks, Sparkles, BrainCircuit, ChevronRight } from 'lucide-react';

const JobGenerator: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobGenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'jd' | 'interview'>('jd');

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await generateRecruitmentMaterials(notes);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6 overflow-hidden">
      {/* Input Section */}
      <div className={`w-full lg:w-1/3 flex flex-col h-full z-20 ${result ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex-1 bg-slate-900 lg:rounded-2xl border-b lg:border border-slate-800 p-6 flex flex-col shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Role</h2>
          </div>
          
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ml-1">Role Notes</label>
          <div className="flex-1 relative group">
            <textarea
              className="w-full h-full bg-slate-950/50 rounded-xl border border-slate-700 p-4 resize-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-mono leading-relaxed text-slate-200 placeholder-slate-600 group-hover:border-slate-600"
              placeholder="- Senior Android Developer&#10;- Kotlin Expert&#10;- 5+ Years Exp&#10;- Remote First&#10;- Team Lead experience required"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !notes.trim()}
            className="mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Spinner className="text-white" />
                <span className="text-indigo-100">Analyzing...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className={`w-full lg:w-2/3 h-full flex flex-col ${!result ? 'hidden lg:flex' : 'flex'}`}>
        {!result ? (
          <div className="flex-1 bg-slate-900/50 lg:rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center flex-col text-slate-500 p-8 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium text-lg text-slate-300">Workspace Empty</p>
            <p className="text-sm max-w-xs mt-2">Enter your role notes on the left to generate professional assets.</p>
          </div>
        ) : (
          <div className="bg-slate-900 lg:rounded-2xl border-none lg:border border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">
            
            {/* Mobile Header / Back Button */}
            <div className="lg:hidden p-4 border-b border-slate-800 flex items-center gap-2">
               <button onClick={() => setResult(null)} className="text-sm text-indigo-400 font-medium flex items-center">
                 ← Back to Edit
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 backdrop-blur">
              <button
                onClick={() => setActiveTab('jd')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative ${
                  activeTab === 'jd' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Description
                {activeTab === 'jd' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_-2px_8px_rgba(99,102,241,0.6)]"></div>}
              </button>
              <button
                onClick={() => setActiveTab('interview')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative ${
                  activeTab === 'interview' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Interview Guide
                {activeTab === 'interview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_-2px_8px_rgba(99,102,241,0.6)]"></div>}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
              {activeTab === 'jd' ? (
                <article className="prose prose-invert prose-headings:text-indigo-200 prose-a:text-indigo-400 prose-strong:text-slate-100 text-slate-300 max-w-none">
                  <ReactMarkdown>{result.jobDescription}</ReactMarkdown>
                </article>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-indigo-400" />
                    Interview Questions
                  </h3>
                  {result.interviewQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                          {idx + 1}
                        </span>
                        <p className="text-slate-200 font-medium leading-relaxed">{q}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobGenerator;