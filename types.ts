export interface SubtitleItem {
  id: number;
  startTime: string;
  endTime: string;
  originalText: string;
  contextSuggestion?: string;
  isContextApplied: boolean;
  translatedText?: string;
  modelUsed?: 'Flash' | 'Pro';
  status: 'pending' | 'checking_context' | 'translating' | 'done' | 'error';
  errorMessage?: string;
}

export interface AppConfig {
  flashAllocation: number; // 0-100
  proAllocation: number;   // 0-100
  sourceLang: string;
  targetLang: string;
  genre: string;
  customPrompt: string;
  batchSize: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  model?: 'Flash' | 'Pro';
}

export enum Tab {
  SETUP = 'setup',
  DATA = 'data',
  MONITORING = 'monitoring'
}

export const DEFAULT_CONFIG: AppConfig = {
  flashAllocation: 70,
  proAllocation: 30,
  sourceLang: 'Auto Detect',
  targetLang: 'Vietnamese',
  genre: 'Modern/Life',
  customPrompt: '',
  batchSize: 10,
};