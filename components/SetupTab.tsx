import React, { useRef } from 'react';
import { AppConfig, DEFAULT_CONFIG } from '../types';
import { GENRES, LANGUAGES } from '../constants';
import { Settings, Upload, Zap, BrainCircuit, Info } from 'lucide-react';

interface SetupTabProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onFileUpload: (content: string, fileName: string) => void;
  fileName: string | null;
}

export const SetupTab: React.FC<SetupTabProps> = ({ config, setConfig, onFileUpload, fileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasApiKey = !!process.env.API_KEY;

  const handleAllocationChange = (flash: number) => {
    setConfig(prev => ({ ...prev, flashAllocation: flash, proAllocation: 100 - flash }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Section A: API Configuration */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">API & Model Configuration</h2>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">API Key Status</label>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-2 rounded-lg border ${hasApiKey ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'} flex-1`}>
                         {hasApiKey ? '● Active (Loaded from Environment)' : '● Inactive (Missing API_KEY)'}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Using Gemini 2.5 Flash for speed & Gemini 3 Pro for context/complex tasks.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    Allocation Split (Flash vs Pro)
                </label>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                        <span className="text-xs text-yellow-400 font-mono">Flash {config.flashAllocation}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={config.flashAllocation}
                        onChange={(e) => handleAllocationChange(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                     <div className="flex flex-col items-center">
                        <BrainCircuit className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="text-xs text-purple-400 font-mono">Pro {config.proAllocation}%</span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5" />
                    <span>Gemini Pro will <strong>always</strong> be used for segments flagged with context errors, regardless of this split.</span>
                </div>
            </div>
        </div>
      </div>

      {/* Section B: Language & Context */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
         <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Language & Context</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Source Language</label>
                <select 
                    value={config.sourceLang}
                    onChange={(e) => setConfig({...config, sourceLang: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Language</label>
                <select 
                    value={config.targetLang}
                    onChange={(e) => setConfig({...config, targetLang: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Genre / Context Preset</label>
                <select 
                    value={config.genre}
                    onChange={(e) => setConfig({...config, genre: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Custom System Instructions (Prompt)</label>
                <textarea 
                    value={config.customPrompt}
                    onChange={(e) => setConfig({...config, customPrompt: e.target.value})}
                    placeholder="e.g., You are translating a romantic drama. Use poetic language."
                    className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
            </div>
        </div>
      </div>

       {/* Section C: Batch & File */}
       <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
         <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Input Source</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">Batch Size (Lines per Request)</label>
                 <input 
                    type="number"
                    min="1"
                    max="50"
                    value={config.batchSize}
                    onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value) || 10})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 />
            </div>
            <div>
                <input 
                    type="file" 
                    accept=".srt,.txt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg border border-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    {fileName ? fileName : "Upload .SRT File"}
                </button>
            </div>
        </div>
       </div>

    </div>
  );
};