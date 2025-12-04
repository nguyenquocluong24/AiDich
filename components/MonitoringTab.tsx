import React from 'react';
import { LogEntry, SubtitleItem } from '../types';
import { Terminal, Download, Zap, BrainCircuit, Activity } from 'lucide-react';
import { generateSRT } from '../services/srtParser';

interface MonitoringTabProps {
  logs: LogEntry[];
  items: SubtitleItem[];
  progress: number;
}

export const MonitoringTab: React.FC<MonitoringTabProps> = ({ logs, items, progress }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const completedCount = items.filter(i => i.status === 'done').length;
  const totalCount = items.length;
  
  const flashCount = items.filter(i => i.modelUsed === 'Flash' && i.status === 'done').length;
  const proCount = items.filter(i => i.modelUsed === 'Pro' && i.status === 'done').length;

  const handleDownload = () => {
    const srtContent = generateSRT(items);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translated_subtitle.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-6xl mx-auto">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-4">
            <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400"><Activity className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-slate-400">Total Progress</p>
                <p className="text-xl font-bold text-white">{completedCount} / {totalCount}</p>
            </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-4">
             <div className="p-3 bg-yellow-900/30 rounded-lg text-yellow-400"><Zap className="w-6 h-6" /></div>
             <div>
                <p className="text-sm text-slate-400">Flash Processed</p>
                <p className="text-xl font-bold text-white">{flashCount}</p>
             </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-4">
             <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400"><BrainCircuit className="w-6 h-6" /></div>
             <div>
                <p className="text-sm text-slate-400">Pro Processed</p>
                <p className="text-xl font-bold text-white">{proCount}</p>
             </div>
        </div>
         <div className="flex items-center justify-center">
            <button 
                onClick={handleDownload}
                disabled={completedCount === 0}
                className="w-full h-full bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex flex-col items-center justify-center gap-1 transition-colors border border-green-600"
            >
                <Download className="w-6 h-6" />
                Download SRT
            </button>
         </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-full h-4 w-full overflow-hidden border border-slate-700">
        <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Detailed Log Console */}
      <div className="flex-1 bg-black/40 rounded-xl border border-slate-700 overflow-hidden flex flex-col font-mono text-sm">
        <div className="bg-slate-900 p-3 border-b border-slate-700 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold">System Logs</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-1" ref={scrollRef}>
            {logs.length === 0 && <span className="text-slate-600">Waiting for process to start...</span>}
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                    <span className="text-slate-600 min-w-[80px]">{log.timestamp.toLocaleTimeString()}</span>
                    <span className={`
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'warning' ? 'text-yellow-400' : ''}
                        ${log.type === 'success' ? 'text-green-400' : ''}
                        ${log.type === 'info' ? 'text-slate-300' : ''}
                    `}>
                        {log.model && (
                             <span className={`px-1 py-0.5 rounded text-[10px] mr-2 border ${
                                 log.model === 'Flash' ? 'border-yellow-800 text-yellow-500' : 'border-purple-800 text-purple-400'
                             }`}>
                                {log.model}
                             </span>
                        )}
                        {log.message}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};