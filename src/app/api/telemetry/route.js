import { NextResponse } from 'next/server';
import { createClient } from '@clickhouse/client';

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filterCategory = searchParams.get('category') || 'ALL';

    let whereClause = "";
    if (filterCategory !== 'ALL') {
      whereClause = `WHERE category = '${filterCategory}'`;
    }

    // Measure query execution time
    const start = performance.now();

    const query = `
      SELECT 
        sum(budget * won) as totalCapital,
        count() as count,
        avg(won) * 100 as winRate,
        avg(negotiation_rounds) as avgRounds
      FROM historical_deals
      ${whereClause}
    `;

    const resultSet = await clickhouse.query({ query, format: 'JSONEachRow' });
    const data = await resultSet.json();
    
    // -------------------------------------------------------------
    // RADAR QUERY (Vector Search on `brands` table)
    // -------------------------------------------------------------
    let brandWhereClause = "";
    if (filterCategory !== 'ALL') {
      // historical_deals categories vs brand categories might vary slightly, so we use ILIKE on the main word
      const mainCat = filterCategory.split('/')[0];
      brandWhereClause = `WHERE category ILIKE '%${mainCat}%'`;
    }
    
    // We use a fixed brand's vector as the central "target" so the distances are real and stable
    const radarQuery = `
      SELECT brand_name, cosineDistance(embedding, (SELECT embedding FROM brands ORDER BY id LIMIT 1)) as distance
      FROM brands
      ${brandWhereClause}
      ORDER BY distance ASC
      LIMIT 12
    `;

    const radarResultSet = await clickhouse.query({ query: radarQuery, format: 'JSONEachRow' });
    const radarData = await radarResultSet.json();
    
    // Transform radar data for the UI
    const radarNodes = radarData.map((row, i) => {
       const dist = parseFloat(row.distance) || Math.random();
       // Map distance to a visual radius (0% to 90% of radar bounds)
       const radius = Math.min(dist * 60 + 10, 90); 
       // Spread them out circularly
       const angle = (i / radarData.length) * Math.PI * 2;
       return {
         name: row.brand_name,
         distance: dist.toFixed(3),
         x: Math.cos(angle) * radius,
         y: Math.sin(angle) * radius,
         color: i === 0 ? "#00FF9D" : (i < 3 ? "#00F0FF" : "#8A8A8A")
       };
    });

    const end = performance.now();

    if (data.length === 0) {
      return NextResponse.json({ success: true, data: { count: 0, timeMs: (end - start).toFixed(2) }, radarNodes });
    }

    const row = data[0];

    return NextResponse.json({
      success: true,
      data: {
        totalCapital: parseFloat(row.totalCapital || 0),
        count: parseInt(row.count || 0),
        winRate: parseFloat(row.winRate || 0).toFixed(1),
        avgRounds: parseFloat(row.avgRounds || 0).toFixed(1),
        timeMs: (end - start).toFixed(2)
      },
      radarNodes
    });

  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json({ success: false, error: "Telemetry failed" }, { status: 500 });
  }
}
