import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateContentWithFallback(prompt, isJson = true) {
  const config = isJson ? { responseMimeType: "application/json" } : undefined;
  
  // Use the ultra-fast 3.5 flash lite model for instant Hackathon response times
  return await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
    config
  });
}
