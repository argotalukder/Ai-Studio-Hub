import React, { useState } from 'react';
import { AppView } from './types';
import JobGenerator from './components/JobGenerator';
import ChatBot from './components/ChatBot';
import MediaLab from './components/MediaLab';
import JobTracker from './components/JobTracker';
import { Briefcase, MessageSquare, Video, BrainCircuit, Radar } from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.JOB_GENERATOR);

  const NavItem = ({ view, icon: Icon, label, mobile = false }: { view: AppView, icon: any, label: string, mobile?: boolean }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`
        relative flex items-center justify-center transition-all duration-300
        ${mobile ? 'flex-col gap-1 p-2 w-full' : 'w-full gap-3 px-4 py-3.5 rounded-xl text-left'}
        ${currentView === view 
          ? (mobile ? 'text-indigo-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20') 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
      `}
    >
      <Icon className={`${mobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
      <span className={`${mobile ? 'text-[10px] font-medium' : 'font-medium'}`}>{label}</span>
      
      {/* Active Indicator for Mobile */}
      {mobile && currentView === view && (
        <span className="absolute top-1 right-1/2 translate-x-1/2 -mt-1 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-950 font-sans text-slate-200">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex-col shrink-0 p-4">
        <div className="px-2 py-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
             <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">RecruitAI</h1>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view={AppView.JOB_GENERATOR} icon={Briefcase} label="Job Sandbox" />
          <NavItem view={AppView.CHATBOT} icon={MessageSquare} label="AI Chat" />
          <NavItem view={AppView.MEDIA_LAB} icon={Video} label="Media Lab" />
          <NavItem view={AppView.JOB_TRACKER} icon={Radar} label="Job Radar" />
        </nav>

        <div className="mt-auto p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
           <div className="flex items-center justify-between text-xs text-slate-400">
             <span>Gemini 3 Pro</span>
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
           </div>
        </div>
      </aside>

      {/* Main Content Area - Using CSS display to persist state */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-950 md:rounded-l-3xl shadow-2xl z-10">
        <div className="flex-1 overflow-hidden h-full relative">
          
          <div className={`h-full w-full ${currentView === AppView.JOB_GENERATOR ? 'block' : 'hidden'}`}>
            <JobGenerator />
          </div>
          
          <div className={`h-full w-full ${currentView === AppView.CHATBOT ? 'block' : 'hidden'}`}>
             <ChatBot />
          </div>

          <div className={`h-full w-full ${currentView === AppView.MEDIA_LAB ? 'block' : 'hidden'}`}>
             <MediaLab />
          </div>

          <div className={`h-full w-full ${currentView === AppView.JOB_TRACKER ? 'block' : 'hidden'}`}>
             <JobTracker />
          </div>

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-slate-900 border-t border-slate-800 pb-safe pt-1 px-1 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <NavItem view={AppView.JOB_GENERATOR} icon={Briefcase} label="Create" mobile />
        <NavItem view={AppView.CHATBOT} icon={MessageSquare} label="Chat" mobile />
        <NavItem view={AppView.JOB_TRACKER} icon={Radar} label="Radar" mobile />
        <NavItem view={AppView.MEDIA_LAB} icon={Video} label="Media" mobile />
      </div>
    </div>
  );
};

export default App;