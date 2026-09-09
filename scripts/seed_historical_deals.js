import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

const CATEGORIES = [
  "Beverage/Energy", "Automotive", "Fashion/Accessories", "Food", 
  "Technology/Security", "Travel/Aviation", "Apparel/Footwear",
  "Finance/Banking", "Real Estate", "Gaming/Esports", "Healthcare", "Entertainment"
];
const DEMOGRAPHICS = ["Gen-Z", "Millennials", "High-Income", "Professionals", "Athletes"];

async function setup() {
  try {
    console.log("Connecting to ClickHouse...");
    const ping = await clickhouse.ping();
    if (!ping) throw new Error("Could not connect to ClickHouse");
    
    console.log("Connected successfully. Creating table 'historical_deals'...");
    
    await clickhouse.exec({ query: 'DROP TABLE IF EXISTS historical_deals' });
    
    await clickhouse.exec({
      query: `
        CREATE TABLE historical_deals (
          id String,
          category String,
          demographic String,
          budget Float32,
          won UInt8,
          negotiation_rounds UInt8,
          created_at DateTime
        ) ENGINE = MergeTree()
        ORDER BY (category, created_at)
      `
    });

    console.log("Table created. Generating 50,000 mock rows...");
    
    const rows = [];
    for (let i = 0; i < 50000; i++) {
      rows.push({
        id: `deal_${i}`,
        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        demographic: DEMOGRAPHICS[Math.floor(Math.random() * DEMOGRAPHICS.length)],
        budget: Math.floor(Math.random() * 450000) + 10000,
        won: Math.random() > 0.3 ? 1 : 0,
        negotiation_rounds: Math.floor(Math.random() * 5) + 1,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
      });
    }

    console.log("Inserting 50,000 rows into ClickHouse...");
    
    // Insert in chunks of 10,000
    for(let i = 0; i < rows.length; i += 10000) {
      await clickhouse.insert({
        table: 'historical_deals',
        values: rows.slice(i, i + 10000),
        format: 'JSONEachRow'
      });
      console.log(`Inserted chunk ${i / 10000 + 1}/5`);
    }
    
    console.log("✅ Success! ClickHouse historical_deals table is seeded and ready.");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setup();
