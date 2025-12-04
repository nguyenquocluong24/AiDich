import React, { useState, useCallback, useEffect } from 'react';
import { SubtitleItem, AppConfig, LogEntry, Tab, DEFAULT_CONFIG } from './types';
import { parseSRT } from './services/srtParser';
import { checkContextBatch, translateBatch } from './services/geminiService';
import { SetupTab } from './components/SetupTab';
import { TranslationTab } from './components/TranslationTab';
import { MonitoringTab } from './components/MonitoringTab';
import { MODEL_FLASH, MODEL_PRO } from './constants';
import { Settings, List, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SETUP);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [items, setItems] = useState<SubtitleItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper to add logs
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', model?: LogEntry['model']) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      model
    }]);
  }, []);

  // File Upload Handler
  const handleFileUpload = (content: string, name: string) => {
    try {
      const parsed = parseSRT(content);
      setItems(parsed);
      setFileName(name);
      addLog(`Loaded ${name} with ${parsed.length} subtitles.`, 'success');
      setActiveTab(Tab.DATA);
    } catch (e) {
      addLog("Failed to parse SRT file.", 'error');
    }
  };

  // Apply Context Suggestion Handler
  const handleApplyContext = (id: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.contextSuggestion) {
        return {
          ...item,
          isContextApplied: true,
          // We update the originalText to the suggestion for display purposes in translation context?
          // No, kept original text but translation prompt will use suggestion.
        };
      }
      return item;
    }));
    addLog(`Applied context suggestion for ID ${id}`, 'success');
  };

  // Main Processing Logic
  const startTranslation = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setActiveTab(Tab.MONITORING);
    addLog("Starting batch translation...", 'info');

    // Create chunks
    const chunks: SubtitleItem[][] = [];
    for (let i = 0; i < items.length; i += config.batchSize) {
      chunks.push(items.slice(i, i + config.batchSize));
    }

    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const batchIds = chunk.map(c => c.id);
      
      // Update status to 'checking_context' (simulated parallel/pre-step)
      setItems(prev => prev.map(item => batchIds.includes(item.id) ? { ...item, status: 'checking_context' } : item));
      
      // Step 1: Context Check (Pro Model) - Always run for better quality, or skip based on user? 
      // Requirement: "Tool must always run a pre-processing step ... using Gemini 2.5 Pro".
      try {
        addLog(`[Batch ${i+1}/${chunks.length}] Checking context...`, 'info', 'Pro');
        const contextResults = await checkContextBatch(chunk, config);
        
        // Update items with suggestions
        setItems(prev => prev.map(item => {
          const suggestion = contextResults.find((r: any) => r.id === item.id);
          if (suggestion) {
             return { ...item, contextSuggestion: suggestion.suggestion };
          }
          return item;
        }));
        
        if (contextResults.length > 0) {
            addLog(`[Batch ${i+1}] Flagged ${contextResults.length} potential context issues.`, 'warning', 'Pro');
        }

      } catch (err) {
        addLog(`[Batch ${i+1}] Context check failed (Rate Limit or Error). Proceeding to translate without suggestions.`, 'error', 'Pro');
      }

      // Step 2: Translation
      // Re-fetch current state of this chunk (in case user applied context quickly, though this is async loop)
      // Actually, since this is an automated loop, user can't click "Apply" mid-batch easily unless we pause.
      // For this MVP, we auto-apply logic: If context suggestion exists, prioritize Pro.
      
      // Determine Model Distribution for this batch
      // We can split WITHIN the batch or PER batch. 
      // To keep context consistent, usually per batch is better, but requirement allows splitting.
      // Let's translate the whole batch with ONE model to ensure consistent tone within those 10 lines,
      // UNLESS a line is flagged.
      
      // Hybrid approach: We send the whole batch to ONE model for efficiency, 
      // unless there are specific flagged items that require PRO.
      // If any item in batch has `contextSuggestion` (and we assume we want high quality), we might force Pro for the batch 
      // OR we just stick to the 70/30 probability for the batch, but forced PRO if specific flags exist?
      // Requirement: "Gemini 2.5 Pro will always be prioritized for Flagged sentences".
      
      // Complex Logic: If batch has flagged items, split the batch? No, that breaks the "batch request" structure.
      // Simplification: If batch has flagged items, send WHOLE batch to Pro to maintain context.
      // Else: Use random split.
      
      // Check current items state for this batch
      // Since `setItems` is async, we use a functional update or rely on the local `chunk` + `contextResults` logic.
      const hasFlags = await new Promise<boolean>((resolve) => {
         setItems(currentItems => {
             const currentChunkItems = currentItems.filter(item => batchIds.includes(item.id));
             const flagged = currentChunkItems.some(item => item.contextSuggestion || item.isContextApplied);
             resolve(flagged);
             return currentItems;
         });
      });

      let selectedModel = MODEL_FLASH;
      let modelLabel: 'Flash' | 'Pro' = 'Flash';

      const roll = Math.random() * 100;
      const useProByAllocation = roll < config.proAllocation;

      if (hasFlags) {
        selectedModel = MODEL_PRO;
        modelLabel = 'Pro';
        addLog(`[Batch ${i+1}] Routed to Pro (Context Flags Detected)`, 'info', 'Pro');
      } else if (useProByAllocation) {
        selectedModel = MODEL_PRO;
        modelLabel = 'Pro';
      }

      // Update status to translating
      setItems(prev => prev.map(item => batchIds.includes(item.id) ? { ...item, status: 'translating', modelUsed: modelLabel } : item));

      try {
        // Need to pass the LATEST state of items to translateBatch to get applied suggestions
        let batchToTranslate: SubtitleItem[] = [];
        setItems(current => {
            batchToTranslate = current.filter(item => batchIds.includes(item.id));
            return current;
        });

        const translations = await translateBatch(batchToTranslate, config, selectedModel);
        
        setItems(prev => prev.map(item => {
            const t = translations.find((r: any) => r.id === item.id);
            if (t) {
                return { ...item, translatedText: t.translatedText, status: 'done' };
            }
            return batchIds.includes(item.id) ? { ...item, status: 'error' } : item;
        }));

        addLog(`[Batch ${i+1}] Translation complete.`, 'success', modelLabel);

      } catch (err) {
         addLog(`[Batch ${i+1}] Translation failed. Retrying with Flash...`, 'error', modelLabel);
         // Fallback to Flash if Pro fails (or vice versa, but usually Flash is fallback)
         try {
             const translations = await translateBatch(chunk, config, MODEL_FLASH);
             setItems(prev => prev.map(item => {
                const t = translations.find((r: any) => r.id === item.id);
                if (t) return { ...item, translatedText: t.translatedText, status: 'done', modelUsed: 'Flash' };
                return item;
             }));
              addLog(`[Batch ${i+1}] Recovered with Flash.`, 'warning', 'Flash');
         } catch (e2) {
             setItems(prev => prev.map(item => batchIds.includes(item.id) ? { ...item, status: 'error', errorMessage: 'Failed' } : item));
         }
      }

      processedCount += chunk.length;
      setProgress((processedCount / items.length) * 100);
      
      // Simple rate limit protection delay
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessing(false);
    addLog("Job Complete.", 'success');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar / Nav */}
      <div className="w-20 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <span className="font-bold text-lg">SRT</span>
        </div>
        
        <button 
            onClick={() => setActiveTab(Tab.SETUP)}
            className={`p-3 rounded-xl transition-all ${activeTab === Tab.SETUP ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Setup"
        >
            <Settings className="w-6 h-6" />
        </button>
        <button 
            onClick={() => setActiveTab(Tab.DATA)}
            disabled={items.length === 0}
            className={`p-3 rounded-xl transition-all ${activeTab === Tab.DATA ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
             title="Data"
        >
            <List className="w-6 h-6" />
        </button>
        <button 
            onClick={() => setActiveTab(Tab.MONITORING)}
            disabled={items.length === 0}
            className={`p-3 rounded-xl transition-all ${activeTab === Tab.MONITORING ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
             title="Monitoring"
        >
            <Activity className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 backdrop-blur justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Gemini SRT Master
            </h1>
            <div className="text-sm text-slate-500">
                {items.length > 0 && <span>File: {fileName}</span>}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-hide">
            {activeTab === Tab.SETUP && (
                <SetupTab 
                    config={config} 
                    setConfig={setConfig} 
                    onFileUpload={handleFileUpload}
                    fileName={fileName}
                />
            )}
            {activeTab === Tab.DATA && (
                <TranslationTab 
                    items={items} 
                    isProcessing={isProcessing}
                    onStart={startTranslation}
                    onApplyContext={handleApplyContext}
                />
            )}
            {activeTab === Tab.MONITORING && (
                <MonitoringTab 
                    logs={logs}
                    items={items}
                    progress={progress}
                />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;