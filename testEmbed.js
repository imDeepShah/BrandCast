import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch'; // NextJS polyfills fetch, but in raw node we might need this if node < 18, but node >= 18 has fetch. Let's assume global fetch is available.

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/embedding-001",
      content: { parts: [{ text: "Hello" }] }
    })
  });
  const data = await embedResponse.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
