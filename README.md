# BrandCast: The Agentic Deal Room for Modern Cinema

**🎬 Built for the Google Gemini Agentic Hackathon**

## The Problem
Product placement in cinema is a broken, localized, and painfully slow industry. Producers spend months pitching brands manually, while brands struggle to find organic integrations that don't feel forced. 

## The Solution
**BrandCast** is a complete enterprise platform that uses autonomous AI agents to parse screenplays, identify organic product placement opportunities, and negotiate binding legal contracts in real-time. 

By leveraging the **Gemini Enterprise Agent Platform** and a high-performance **ClickHouse Vector Database**, BrandCast completely automates the Hollywood deal-making pipeline.

---

## 🚀 How It Works (The Agentic Workflow)

1. **The Supervisor Agent (Gemini 1.5 Pro):** Reads your screenplay snippet and isolates physical objects and narrative themes.
2. **The Matchmaker Agent (Vector RAG):** Queries the ClickHouse Vector Database using Gemini Embeddings to find global brands whose target demographics and creative constraints perfectly match the scene.
3. **The Agentic Deal Room:** 
   - A Producer Agent drafts a custom integration pitch.
   - The Brand Manager Agent acts autonomously to accept, reject, or counter the offer based on strict internal budgets and brand guidelines.
4. **Automated Legal Generation:** Once a deal is struck, the AI instantly generates a structured, binding 4-part legal contract.

## 🛠 Tech Stack & Partner Integrations

*   **Google Gemini (Flash/Pro/Embeddings):** Powers all autonomous agents, decision engines, and contract drafting capabilities. Also used to generate dense 3072-dimensional vector embeddings for semantic matching.
*   **ClickHouse (Partner Track):** Serves as our lightning-fast Vector Database AND our high-performance OLAP engine. 
    * **Vector RAG:** We store dense embeddings of brand profiles and perform instantaneous `cosineDistance` searches to match scripts with brands.
    * **Real-time OLAP:** We seeded a `historical_deals` table with 50,000 rows to demonstrate ClickHouse's sub-millisecond aggregation speeds (`sum`, `avg`, `count`) on our Telemetry Dashboard.
*   **Next.js & React:** Powers the highly-polished, cinematic frontend interface, Agentic Deal Room UI, and the dynamic Brand Synergy Radar.

## 💼 Business Viability (The Conceptual Market)
We designed BrandCast not just as a technical demo, but as a viable SaaS startup. The platform features a conceptual Go-To-Market strategy with a 3-tier pricing model:
*   **Indie Creator:** 10% escrow fee per closed deal.
*   **Studio Pro:** $4,999/mo for unlimited agentic outreach.
*   **Enterprise Hub:** Custom on-premise model hosting for massive production houses.

*(Note: The monetization and dashboard sections are conceptual models designed to demonstrate the platform's real-world scalability and market fit).*

## ⚙️ Running Locally

1. Clone the repository and `npm install`
2. Create a `.env.local` file with the following:
   ```env
   GEMINI_API_KEY=your_key
   CLICKHOUSE_HOST=your_host
   CLICKHOUSE_USER=default
   CLICKHOUSE_PASSWORD=your_password
   ```
3. Run the automated database setup to seed the ClickHouse Vector DB and OLAP tables:
   ```bash
   node scripts/setupClickhouse.js
   node scripts/seed_historical_deals.js
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
