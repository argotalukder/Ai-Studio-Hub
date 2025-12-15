import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, MapPin, Zap, Bot, User, Map as MapIcon, Link as LinkIcon, MoreVertical, Sparkles, BrainCircuit, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { ChatMessage } from '../types';
import { smartChatWithGemini } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import ReactMarkdown from 'react-markdown';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hi! I am your intelligent recruitment assistant. Ask me anything, and I will automatically select the best AI model for your task.', timestamp: Date.now(), modelUsed: 'Auto-Detect' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Get location once on mount (for potential maps usage)
  useEffect(() => {
    if (navigator.geolocation && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          // Gracefully handle error - mostly likely permission denied or timeout
          // We use console.warn instead of error to avoid cluttering the console with "errors" for optional features
          console.warn(`Geolocation skipped: ${err.message} (Code: ${err.code})`);
        }
      );
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      
      // Use Smart Chat which handles routing internally
      const response = await smartChatWithGemini(userMsg.text, history, location);
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.text || "I couldn't generate a response.",
          timestamp: Date.now(),
          groundingMetadata: response.groundingMetadata,
          modelUsed: response.modelUsed
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: "Sorry, I encountered a connection error.", timestamp: Date.now() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    // Regex to extract the thinking block: > **Thinking Process:** ... content ...
    // It captures the thinking content in group 1, and the rest (answer) in group 3.
    const thoughtRegex = /(?:^|\n)> \*\*Thinking Process:\*\*([\s\S]*?)(\n\n|$)([\s\S]*)/;
    const match = text.match(thoughtRegex);

    if (match) {
      const thoughts = match[1];
      const answer = match[3] || "";
      
      // If we found a thought block, render it separately
      return (
        <div className="space-y-4">
           <details open className="group bg-slate-900/50 rounded-xl border border-indigo-500/20 overflow-hidden">
             <summary className="flex items-center gap-2 p-3 bg-indigo-500/5 text-xs font-bold text-indigo-300 uppercase tracking-wide cursor-pointer hover:bg-indigo-500/10 transition-colors select-none">
               <BrainCircuit className="w-4 h-4" />
               <span>AI Thinking Process</span>
               <ChevronDown className="w-4 h-4 ml-auto group-open:rotate-180 transition-transform" />
             </summary>
             <div className="p-4 text-slate-400 text-sm font-mono leading-relaxed border-t border-indigo-500/10 bg-slate-950/30">
               <ReactMarkdown 
                 components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                 }}
               >
                 {thoughts.trim()}
               </ReactMarkdown>
             </div>
           </details>
           
           <div className="prose prose-sm prose-invert max-w-none text-slate-200">
             <ReactMarkdown>{answer.trim()}</ReactMarkdown>
           </div>
        </div>
      );
    }

    // Default rendering if no thought block is found
    return (
       <div className="prose prose-sm prose-invert max-w-none text-slate-200">
         <ReactMarkdown>{text}</ReactMarkdown>
       </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-inner relative">
             <Bot className="w-5 h-5" />
             <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
               <Sparkles className="w-3 h-3 text-yellow-400 fill-current" />
             </div>
           </div>
           <div>
             <h2 className="font-bold text-slate-100 text-sm">RecruitChat AI</h2>
             <p className="text-[10px] text-indigo-400 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Auto-Detect Enabled
             </p>
           </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Model Label Badge */}
            {msg.role === 'model' && msg.modelUsed && (
              <div className="mb-1 ml-2 flex items-center gap-1.5 opacity-80">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                   msg.modelUsed.includes('Lite') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                   msg.modelUsed.includes('Search') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                   msg.modelUsed.includes('Maps') ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                   'bg-purple-500/10 text-purple-400 border-purple-500/30'
                }`}>
                  {msg.modelUsed.includes('Lite') && <Zap className="w-3 h-3" />}
                  {msg.modelUsed.includes('Pro') && <BrainCircuit className="w-3 h-3" />}
                  {msg.modelUsed.includes('Search') && <Globe className="w-3 h-3" />}
                  {msg.modelUsed.includes('Maps') && <MapPin className="w-3 h-3" />}
                  {msg.modelUsed}
                </span>
              </div>
            )}

            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-900/20'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm'
              }`}
            >
               {msg.role === 'user' ? (
                 <div className="prose prose-sm prose-invert max-w-none text-white">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
               ) : (
                 // Use custom renderer for Model messages to handle thinking blocks
                 renderMessageContent(msg.text)
               )}

               {/* Grounding Sources */}
               {msg.groundingMetadata?.groundingChunks && (
                 <div className="mt-3 pt-3 border-t border-white/10 text-xs">
                   <p className="font-semibold mb-2 opacity-75 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                     <Globe className="w-3 h-3" /> Sources
                   </p>
                   <div className="flex flex-wrap gap-2">
                     {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                       const uri = chunk.web?.uri || chunk.maps?.uri;
                       const title = chunk.web?.title || chunk.maps?.title || "Source";
                       const Icon = chunk.maps ? MapIcon : LinkIcon;
                       
                       if (!uri) return null;

                       return (
                           <a key={i} href={uri} target="_blank" rel="noreferrer" className="bg-black/20 hover:bg-black/40 px-2 py-1.5 rounded-lg truncate max-w-[200px] flex items-center gap-1.5 transition-colors border border-white/5">
                             <Icon className="w-3 h-3 text-indigo-300" /> {title}
                           </a>
                       )
                     })}
                   </div>
                 </div>
               )}
               
               <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                 {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </p>
            </div>
          </div>
        ))}
        
        {/* Loading / Thinking State */}
        {loading && (
          <div className="flex flex-col items-start animate-in fade-in duration-300">
             <div className="ml-2 mb-1">
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-800 border-slate-700 text-slate-400 flex items-center gap-1">
                 <Bot className="w-3 h-3" /> Analyzing Request...
               </span>
             </div>
             <div className="bg-slate-800 rounded-2xl rounded-tl-sm p-4 border border-slate-700/50 flex items-center gap-3">
               <div className="relative w-4 h-4">
                 <div className="absolute top-0 left-0 w-full h-full border-2 border-indigo-500/30 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-full h-full border-2 border-t-indigo-500 rounded-full animate-spin"></div>
               </div>
               <span className="text-sm text-slate-400 animate-pulse">Thinking...</span>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 safe-bottom">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-800 p-1.5 rounded-3xl border border-slate-700 focus-within:border-indigo-500 transition-colors shadow-lg">
           <textarea
             rows={1}
             value={input}
             onChange={(e) => {
               setInput(e.target.value);
               e.target.style.height = 'auto';
               e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
             }}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSend();
               }
             }}
             placeholder="Ask anything..."
             className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 px-4 py-3 max-h-24 resize-none text-sm"
             disabled={loading}
           />
           <button
             onClick={handleSend}
             disabled={!input.trim() || loading}
             className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-full transition-all shadow-lg shadow-indigo-900/30 mb-0.5 group"
           >
             {loading ? <Spinner className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;