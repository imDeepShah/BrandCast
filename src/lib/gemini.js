import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateContentWithFallback(prompt, isJson = true) {
  const config = isJson ? { responseMimeType: "application/json" } : undefined;
  
  try {
    // Attempt 1: Try the latest, fastest model
    return await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config
    });
  } catch (error) {
    console.warn(`Primary model gemini-2.0-flash failed. Falling back to gemini-1.5-flash-8b...`);
    
    // Attempt 2: Fallback to the highly stable, ultra-fast 8b model
    return await ai.models.generateContent({
      model: 'gemini-1.5-flash-8b',
      contents: prompt,
      config
    });
  }
}
