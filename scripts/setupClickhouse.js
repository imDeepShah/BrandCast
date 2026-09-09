import { createClient } from '@clickhouse/client';
import { GoogleGenAI } from '@google/genai';
import { mockBrands } from '../src/lib/mockData.js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function setup() {
  try {
    console.log("Connecting to ClickHouse...");
    const ping = await clickhouse.ping();
    if (!ping) throw new Error("Could not connect to ClickHouse");
    
    console.log("Connected successfully. Creating table...");
    
    // Drop table if exists to ensure clean slate for demo
    await clickhouse.exec({ query: 'DROP TABLE IF EXISTS brands' });
    
    await clickhouse.exec({
      query: `
        CREATE TABLE brands (
          id String,
          brand_name String,
          category String,
          target_demographic String,
          min_placement_budget Int32,
          max_budget Int32,
          max_proposals Int32,
          brand_guideliness String,
          embedding Array(Float32)
        ) ENGINE = MergeTree()
        ORDER BY id
      `
    });

    console.log("Table 'brands' ready. Generating embeddings for mock data...");
    
    const rows = [];
    for (const brand of mockBrands) {
      console.log(`Generating vector for ${brand.brand_name}...`);
      const contextText = `Brand: ${brand.brand_name}. Category: ${brand.category}. Target Demographic: ${brand.target_demographic}. Guidelines: ${brand.brand_guideliness}`;
      
      const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/gemini-embedding-2",
          content: { parts: [{ text: contextText }] }
        })
      });
      const data = await embedResponse.json();
      
      const vector = data.embedding?.values;
      if (!vector) {
        console.error("Gemini API Error Response:", JSON.stringify(data, null, 2));
        throw new Error("Failed to extract vector from Gemini response");
      }
      
      rows.push({
        id: brand.id,
        brand_name: brand.brand_name,
        category: brand.category,
        target_demographic: brand.target_demographic,
        min_placement_budget: brand.min_placement_budget,
        max_budget: brand.max_budget,
        max_proposals: brand.max_proposals,
        brand_guideliness: brand.brand_guideliness,
        embedding: vector
      });
    }

    console.log("Inserting brands into ClickHouse...");
    await clickhouse.insert({
      table: 'brands',
      values: rows,
      format: 'JSONEachRow'
    });
    
    console.log("✅ Success! ClickHouse Vector database is seeded and ready.");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setup();
