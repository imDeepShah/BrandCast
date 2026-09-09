import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateContentWithFallback(prompt, isJson = true) {
  const config = isJson ? { responseMimeType: "application/json" } : undefined;
  
  // Use the standard, ultra-fast 1.5 flash model. No fallbacks to prevent double-latency.
  return await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config
  });
}
