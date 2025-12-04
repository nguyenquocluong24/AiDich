import { SubtitleItem } from '../types';

export const parseSRT = (content: string): SubtitleItem[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  
  const items: SubtitleItem[] = [];
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0].trim());
      // Timecode line: 00:00:01,000 --> 00:00:04,000
      const timecodeRegex = /(\d{2}:\d{2}:\d{2},\d{3})\s-->\s(\d{2}:\d{2}:\d{2},\d{3})/;
      const match = lines[1].match(timecodeRegex);
      
      if (!isNaN(id) && match) {
        const text = lines.slice(2).join('\n').trim();
        if (text) {
            items.push({
                id,
                startTime: match[1],
                endTime: match[2],
                originalText: text,
                isContextApplied: false,
                status: 'pending'
            });
        }
      }
    }
  });
  
  return items;
};

export const generateSRT = (items: SubtitleItem[]): string => {
  return items.map(item => {
    return `${item.id}\n${item.startTime} --> ${item.endTime}\n${item.translatedText || item.originalText}`;
  }).join('\n\n');
};