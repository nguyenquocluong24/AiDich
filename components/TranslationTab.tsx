import React from 'react';
import { SubtitleItem } from '../types';
import { AlertTriangle, Check, Play, RefreshCw, CheckCircle2 } from 'lucide-react';

interface TranslationTabProps {
  items: SubtitleItem[];
  isProcessing: boolean;
  onStart: () => void;
  onApplyContext: (id: number) => void;
}

export const TranslationTab: React.FC<TranslationTabProps> = ({ items, isProcessing, onStart, onApplyContext }) => {
  
  if (items.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>No subtitles loaded.</p>
            <p className="text-sm">Go to Setup to upload a file.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 flex justify-between items-center">
        <div>
            <span className="text-slate-400 text-sm">Loaded: <span className="text-white font-mono">{items.length}</span> lines</span>
        </div>
        <button 
            onClick={onStart}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all ${isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}
        >
            {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
                <><Play className="w-4 h-4 fill-current" /> Start Batch Translation</>
            )}
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-semibold sticky top-0 z-0">
                <tr>
                    <th className="p-3 w-16 text-center">ID</th>
                    <th className="p-3 w-32">Time</th>
                    <th className="p-3 w-1/3">Original</th>
                    <th className="p-3 w-1/4">Context Suggestion (Pro)</th>
                    <th className="p-3 w-1/3">Translation</th>
                    <th className="p-3 w-20 text-center">Model</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                {items.map(item => (
                    <tr key={item.id} className={`hover:bg-slate-800/50 transition-colors ${item.status === 'translating' ? 'bg-blue-900/10' : ''}`}>
                        <td className="p-3 text-center text-slate-500 font-mono">{item.id}</td>
                        <td className="p-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {item.startTime}<br/>{item.endTime}
                        </td>
                        <td className="p-3 relative group">
                            {item.isContextApplied ? (
                                <span className="text-purple-300 decoration-dotted underline" title="Context modification applied">{item.originalText}</span> // Actually displayed text should be suggestion if applied? 
                                // Logic: If applied, originalText state might be updated or we check flag. 
                                // In this component render, let's show original. If context applied, show what was actually sent.
                                // But `originalText` in `items` is the SOURCE. 
                            ) : (
                                <span>{item.originalText}</span>
                            )}
                        </td>
                        <td className="p-3">
                            {item.contextSuggestion && !item.isContextApplied && (
                                <div className="bg-purple-900/20 border border-purple-500/30 p-2 rounded text-xs flex flex-col gap-2">
                                    <div className="flex items-start gap-2 text-purple-200">
                                        <AlertTriangle className="w-3 h-3 min-w-[12px] mt-0.5 text-yellow-500" />
                                        <span>{item.contextSuggestion}</span>
                                    </div>
                                    <button 
                                        onClick={() => onApplyContext(item.id)}
                                        disabled={isProcessing || item.status === 'done'}
                                        className="self-end text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Check className="w-3 h-3" /> Apply
                                    </button>
                                </div>
                            )}
                            {item.isContextApplied && (
                                <div className="text-green-400 text-xs flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Applied
                                </div>
                            )}
                        </td>
                        <td className="p-3">
                           {item.status === 'pending' && <span className="text-slate-600 italic">Pending...</span>}
                           {item.status === 'checking_context' && <span className="text-purple-400 animate-pulse text-xs">Checking Context...</span>}
                           {item.status === 'translating' && <span className="text-blue-400 animate-pulse text-xs">Translating...</span>}
                           {item.status === 'done' && <span className="text-white">{item.translatedText}</span>}
                           {item.status === 'error' && <span className="text-red-400 text-xs">{item.errorMessage || "Error"}</span>}
                        </td>
                        <td className="p-3 text-center">
                            {item.modelUsed === 'Flash' && <span className="inline-block px-2 py-0.5 bg-yellow-900/30 text-yellow-500 text-xs rounded border border-yellow-800">Flash</span>}
                            {item.modelUsed === 'Pro' && <span className="inline-block px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded border border-purple-800">Pro</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};