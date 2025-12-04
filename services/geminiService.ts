import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MODEL_FLASH, MODEL_PRO } from "../constants";
import { SubtitleItem, AppConfig } from "../types";

// Initialize AI Client
// Note: In a real app, strict error handling for missing key is needed.
// Based on instructions, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const checkContextBatch = async (
  items: SubtitleItem[],
  config: AppConfig
): Promise<Array<{ id: number; suggestion: string }>> => {
  const modelId = MODEL_PRO; // Always use Pro for context checking
  
  const prompt = `
    You are a professional subtitle context editor specializing in the genre: ${config.genre}.
    Analyze the following list of subtitle lines (ID and Text).
    
    Task:
    1. Identify words or phrases that are ambiguous, homonyms, or culturally inappropriate for the '${config.genre}' genre.
    2. Specifically look for mistranslations common in this genre (e.g., 'crane' as bird vs machine, 'cultivation' in farming vs spiritual).
    3. If a line is potentially ambiguous or wrong in context, provide a "rewritten_text" that clarifies the meaning for the translator.
    4. ONLY return items that need correction. If a line is fine, do not include it in the output.
    
    Input Data:
    ${JSON.stringify(items.map(i => ({ id: i.id, text: i.originalText })))}
  `;

  // Define Schema for structured JSON
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        suggestion: { type: Type.STRING, description: "The corrected or context-clarified version of the source text." }
      },
      required: ["id", "suggestion"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a helpful AI editor detecting context errors.",
        temperature: 0.2 // Low temp for precision
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Context Check Error:", error);
    throw error;
  }
};

export const translateBatch = async (
  items: SubtitleItem[],
  config: AppConfig,
  modelName: string
): Promise<Array<{ id: number; translatedText: string }>> => {
  
  const systemPrompt = `
    You are a professional subtitle translator.
    Source Language: ${config.sourceLang}
    Target Language: ${config.targetLang}
    Genre: ${config.genre}
    User Instructions: ${config.customPrompt}
    
    Rules:
    1. Maintain the tone and style of the specified Genre.
    2. Keep translations concise to fit subtitle limits.
    3. Respect the context of the lines provided.
    4. Output strictly valid JSON.
  `;

  const inputContent = items.map(i => ({
    id: i.id,
    text: i.isContextApplied && i.contextSuggestion ? i.contextSuggestion : i.originalText
  }));

  const prompt = `Translate the following array of subtitles:\n${JSON.stringify(inputContent)}`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        translatedText: { type: Type.STRING }
      },
      required: ["id", "translatedText"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: systemPrompt,
        temperature: 0.4
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error(`Translation Error (${modelName}):`, error);
    throw error;
  }
};