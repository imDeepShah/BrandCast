import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
  console.log(generateModels.map(m => m.name));
}

test();
