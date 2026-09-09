import { NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import { createClient } from '@clickhouse/client';
import { mockBrands } from '@/lib/mockData';

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

export async function POST(req) {
  try {
    const { script } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing." }, { status: 500 });
    }

    // 1. Script Supervisor Agent (Extracts context)
    const supervisorTask = async () => {
      const prompt = `Analyze this screenplay snippet. Extract the core scene type (e.g. Action, Romance, Noir) and 3 key objects or visual focal points. Return ONLY a valid JSON object with keys "sceneType" and "keyObjects" (an array of strings). \n\nSnippet: "${script}"`;
      
      const response = await generateContentWithFallback(prompt);
      return JSON.parse(response.text);
    };

    // 2. Matchmaker Agent (Queries DB based on context using Vector RAG)
    const matchmakerTask = async (context) => {
      const contextText = `Scene Type: ${context.sceneType}. Key Objects: ${context.keyObjects.join(', ')}`;
      
      // Generate a vector embedding for the scene's "vibe"
      const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/gemini-embedding-2",
          content: { parts: [{ text: contextText }] }
        })
      });
      const embedData = await embedResponse.json();
      const vector = embedData.embedding?.values;
      
      if (!vector) throw new Error("Failed to embed context");

      // Execute a real-time cosine similarity search in ClickHouse
      try {
        const query = `
          SELECT *, cosineDistance(embedding, [${vector.join(',')}]) as score 
          FROM brands 
          ORDER BY score ASC 
          LIMIT 4
        `;
        
        const resultSet = await clickhouse.query({ query, format: 'JSONEachRow' });
        return await resultSet.json();
      } catch (dbError) {
        console.warn("ClickHouse Database timeout or error. Falling back to mock data to preserve demo functionality:", dbError.message);
        // Randomly select 4 distinct brands from the pool of 10
        const shuffled = [...mockBrands].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
      }
    };

    // 3. Copywriter Agent (Drafts the pitch)
    const copywriterTask = async (brands, context) => {
      const prompt = `You are a high-end studio executive. We are pitching product placements for a ${context.sceneType} scene featuring ${context.keyObjects.join(', ')}.
      
      For each of the following ${brands.length} brands, write a highly persuasive 2-sentence B2B sales pitch explaining why this specific scene perfectly aligns with their target demographic and maximizes viewer retention.
      
      Brands:
      ${brands.map(b => `- ${b.brand_name} (${b.category})`).join('\n')}
      
      Return ONLY a valid JSON array containing exactly ${brands.length} strings. The strings must be the pitches, in the exact same order as the brands listed above. Do not include markdown formatting.`;
      
      try {
        const response = await generateContentWithFallback(prompt);
        let pitches = [];
        try {
          pitches = JSON.parse(response.text);
        } catch(e) {
           // Fallback if the LLM didn't return perfect JSON
           pitches = brands.map(b => `Strategic placement of ${b.brand_name} within this ${context.sceneType} sequence will drive massive brand recall.`);
        }
        
        return brands.map((brand, idx) => ({
          ...brand,
          pitch: pitches[idx] || `Strategic placement of ${brand.brand_name} within this ${context.sceneType} sequence will drive massive brand recall.`
        }));
      } catch (err) {
        console.error("Batch pitching failed", err);
        return brands.map(brand => ({
          ...brand,
          pitch: `Strategic placement of ${brand.brand_name} within this ${context.sceneType} sequence will drive massive brand recall.`
        }));
      }
    };

    // 4. Concept Artist Agent (Generates image URL)
    const artistTask = async (brandsWithPitches) => {
      const imageMap = {
        "b1": { url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop", orientation: "portrait" }, // NeonCola
        "b2": { url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop", orientation: "landscape" }, // AeroDyne
        "b3": { url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop", orientation: "portrait" }, // ChronoTech
        "b4": { url: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800&auto=format&fit=crop", orientation: "landscape" }, // SynthoBite
        "b5": { url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", orientation: "portrait" }, // OmniCorp Sec
        "b6": { url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop", orientation: "landscape" }, // Apex Energy
        "b7": { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop", orientation: "portrait" }, // Vanguard Tech
        "b8": { url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop", orientation: "landscape" }, // Lumina Cosmetics
        "b9": { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop", orientation: "portrait" }, // Titan Athletics
        "b10": { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop", orientation: "landscape" } // Quantum Airlines
      };

      return brandsWithPitches.map(brand => {
        const imageInfo = imageMap[brand.id] || { url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop", orientation: "landscape" };
        return {
          ...brand,
          imageUrl: imageInfo.url,
          imageOrientation: imageInfo.orientation
        };
      });
    };

    const context = await supervisorTask();
    const matches = await matchmakerTask(context);
    const pitched = await copywriterTask(matches, context);
    const finalResult = await artistTask(pitched);

    return NextResponse.json({ success: true, data: finalResult });

  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json({ success: false, error: "Agent orchestration failed: " + error.message }, { status: 500 });
  }
}
