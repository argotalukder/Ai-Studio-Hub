import React, { useState } from 'react';
import { searchJobs } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import ReactMarkdown from 'react-markdown';
import { Radar, Search, MapPin, Building2, ExternalLink } from 'lucide-react';

const JobTracker: React.FC = () => {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{text: string, groundingMetadata: any} | null>(null);

  const handleSearch = async () => {
    if (!role.trim() || !location.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await searchJobs(role, location);
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shadow-lg z-10">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
             <Radar className="w-6 h-6 text-emerald-400" />
           </div>
           <div>
             <h2 className="text-lg font-bold text-white tracking-tight">Job Radar</h2>
             <p className="text-xs text-slate-400">Real-time market scanner</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Job Role (e.g. React Developer)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Location (e.g. Dhaka, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !role || !location}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all"
          >
            {loading ? <Spinner className="text-white" /> : "Scan Market"}
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {!results && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
            <Building2 className="w-16 h-16 mb-4 stroke-1" />
            <p>Enter role and location to scan for jobs</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse mt-4">
             {[1,2,3].map(i => (
               <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
             ))}
          </div>
        )}

        {results && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Main AI Text Response */}
             <div className="prose prose-invert prose-headings:text-emerald-400 prose-a:text-indigo-400 max-w-none bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800 shadow-xl">
               <ReactMarkdown>{results.text}</ReactMarkdown>
             </div>

             {/* Source Chips - "Apply" Links */}
             {results.groundingMetadata?.groundingChunks && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {results.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                   if (!chunk.web?.uri) return null;
                   return (
                     <a 
                       key={i} 
                       href={chunk.web.uri} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group shadow-md"
                     >
                       <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                           <ExternalLink className="w-4 h-4 text-emerald-500" />
                         </div>
                         <div className="truncate">
                           <p className="text-sm font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                             {chunk.web.title || "Job Listing"}
                           </p>
                           <p className="text-xs text-slate-500 truncate">{new URL(chunk.web.uri).hostname}</p>
                         </div>
                       </div>
                     </a>
                   );
                 })}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTracker;