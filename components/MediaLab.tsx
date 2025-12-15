import React, { useState } from 'react';
import { generateRecruitmentVideo, analyzeImage, analyzeVideo } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import ReactMarkdown from 'react-markdown';
import { Video, Image as ImageIcon, Play, Upload, Film, Eye } from 'lucide-react';

type MediaType = 'video-gen' | 'image-analyze' | 'video-analyze';

const MediaLab: React.FC = () => {
  const [activeTool, setActiveTool] = useState<MediaType>('video-gen');
  
  // States
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState<string>(''); // Text result or Video URL
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const executeAction = async () => {
    if (!prompt && activeTool === 'video-gen' && !file) return; // Need prompt for Veo unless image to video
    if (!file && (activeTool === 'image-analyze' || activeTool === 'video-analyze')) return;
    
    setLoading(true);
    setOutput('');

    try {
      if (activeTool === 'video-gen') {
        const win = window as any;
        if (win.aistudio && win.aistudio.hasSelectedApiKey) {
          const hasKey = await win.aistudio.hasSelectedApiKey();
          if (!hasKey) {
             try { await win.aistudio.openSelectKey(); } catch (e) {}
          }
        }
        
        let imgBase64 = undefined;
        if (file) imgBase64 = await fileToBase64(file);
        
        const videoUrl = await generateRecruitmentVideo(prompt || "animate this", aspectRatio, imgBase64);
        setOutput(videoUrl);
      } 
      else if (activeTool === 'image-analyze' && file) {
        const base64 = await fileToBase64(file);
        const result = await analyzeImage(base64, file.type, prompt || "Analyze this image for recruitment purposes.");
        setOutput(result);
      }
      else if (activeTool === 'video-analyze' && file) {
        if (file.size > 20 * 1024 * 1024) {
          alert("For this demo, please use video clips under 20MB.");
          setLoading(false);
          return;
        }
        const base64 = await fileToBase64(file);
        const result = await analyzeVideo(base64, file.type, prompt || "Describe the key events in this video.");
        setOutput(result);
      }
    } catch (err) {
      console.error(err);
      alert("Action failed. Check console or ensure valid API Key.");
    } finally {
      setLoading(false);
    }
  };

  const ToolTab = ({ id, icon: Icon, label }: { id: MediaType, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTool(id); setOutput(''); setFile(null); setPreview(null); }}
      className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-all border ${
        activeTool === id 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Tool Selector */}
      <div className="p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <ToolTab id="video-gen" icon={Film} label="Veo Video" />
          <ToolTab id="image-analyze" icon={ImageIcon} label="Image AI" />
          <ToolTab id="video-analyze" icon={Eye} label="Video AI" />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
           
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
             <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
             {activeTool === 'video-gen' && 'Generate Recruitment Video'}
             {activeTool === 'image-analyze' && 'Analyze Candidate Image'}
             {activeTool === 'video-analyze' && 'Analyze Video Interview'}
           </h2>

           {/* Media Upload Area */}
           <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors group relative overflow-hidden">
             {preview ? (
                <div className="relative inline-block w-full max-w-sm rounded-lg overflow-hidden shadow-lg border border-slate-700">
                  {activeTool === 'video-analyze' || (file?.type.startsWith('video')) ? (
                    <video src={preview} className="w-full h-48 object-cover bg-black" controls />
                  ) : (
                    <img src={preview} alt="Upload" className="w-full h-48 object-cover" />
                  )}
                  <button 
                    onClick={() => { setFile(null); setPreview(null); }} 
                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors backdrop-blur"
                  >
                    <div className="w-4 h-4 flex items-center justify-center font-bold">×</div>
                  </button>
                </div>
             ) : (
               <label className="cursor-pointer flex flex-col items-center py-6">
                 <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7 text-indigo-400" />
                 </div>
                 <span className="text-sm font-semibold text-slate-300">Tap to upload media</span>
                 <span className="text-xs text-slate-500 mt-1">
                   {activeTool === 'video-gen' ? 'Optional reference image' : 'Required for analysis'}
                 </span>
                 <input 
                   type="file" 
                   accept={activeTool === 'image-analyze' ? "image/*" : activeTool === 'video-analyze' ? "video/*" : "image/*"} 
                   className="hidden" 
                   onChange={handleFileChange} 
                 />
               </label>
             )}
           </div>

           {/* Config / Prompt */}
           <div className="space-y-4">
             {activeTool === 'video-gen' && (
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <label className="text-xs font-semibold text-slate-400 block mb-2">Aspect Ratio</label>
                 <div className="flex gap-2">
                   {['16:9', '9:16'].map(ratio => (
                     <button
                       key={ratio}
                       onClick={() => setAspectRatio(ratio as any)}
                       className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${
                         aspectRatio === ratio 
                           ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                           : 'bg-slate-800 border-transparent text-slate-400'
                       }`}
                     >
                       {ratio}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
               <label className="text-xs font-semibold text-slate-400 block mb-2">
                 {activeTool === 'video-gen' ? 'Prompt' : 'Question'}
               </label>
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder={
                   activeTool === 'video-gen' ? "Describe the video you want..." :
                   "What should I look for in this media?"
                 }
                 className="w-full bg-transparent border-none outline-none text-slate-200 text-sm h-20 resize-none placeholder-slate-600"
               />
             </div>
           </div>

           {/* Action Button */}
           <button
             onClick={executeAction}
             disabled={loading}
             className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {loading ? <Spinner className="text-white" /> : <Play className="w-5 h-5 fill-current" />}
             {loading ? 'Processing...' : 'Run Analysis'}
           </button>

            {/* Output */}
            {output && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-3 bg-slate-800/50 border-b border-slate-800 font-semibold text-xs text-slate-400 uppercase tracking-wider">
                  Result
                </div>
                <div className="p-4">
                  {activeTool === 'video-gen' ? (
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <video src={output} controls autoPlay loop className="w-full" />
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                      <ReactMarkdown>{output}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MediaLab;