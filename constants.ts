export const GENRES = [
  "Tu Tiên (Xianxia)",
  "Kiếm Hiệp/Cổ Trang (Wuxia/Historical)",
  "Hiện Đại/Đời Sống (Modern/Slice of Life)",
  "Khoa học/Kỹ thuật (Sci-Fi/Tech)",
  "Hài hước/Độ tuổi Teen (Comedy/Teen)",
  "Kinh dị (Horror)",
  "Tài liệu (Documentary)"
];

export const LANGUAGES = [
  "Auto Detect",
  "English",
  "Chinese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Spanish",
  "French",
  "German"
];

// Mapping to specific Gemini Models as per guidelines
// Flash: gemini-2.5-flash
// Pro: gemini-3-pro-preview (For complex tasks/context check)
export const MODEL_FLASH = 'gemini-2.5-flash';
export const MODEL_PRO = 'gemini-3-pro-preview';

export const MAX_RETRY_DELAY = 10000;