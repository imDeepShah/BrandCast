import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateContentWithFallback(prompt, isJson = true) {
  const config = isJson ? { responseMimeType: "application/json" } : undefined;
  
  try {
    // Attempt 1: Try the latest, fastest model
    return await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config
    });
  } catch (error) {
    console.warn(`Primary model gemini-3.6-flash failed. Falling back to gemini-3.5-flash-lite...`);
    
    // Attempt 2: Fallback to the highly stable, battle-tested 3.5 flash lite model
    return await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config
    });
  }
}
