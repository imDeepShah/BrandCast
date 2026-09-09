import { NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import { createClient } from '@clickhouse/client';

export const maxDuration = 60; // Allow Vercel functions to run for up to 60 seconds

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

export async function POST(req) {
  try {
    const { brandId, producerAsk, proposalText, lastCounterOffer } = await req.json();
    const askAmount = parseInt(producerAsk, 10);

    // Fetch the specific brand from ClickHouse
    const query = `SELECT * FROM brands WHERE id = '${brandId}' LIMIT 1`;
    const resultSet = await clickhouse.query({ query, format: 'JSONEachRow' });
    const brands = await resultSet.json();
    
    if (brands.length === 0) {
      return NextResponse.json({ success: false, error: "Brand not found in database" }, { status: 404 });
    }
    const brand = brands[0];

    const prompt = `You are the AI Brand Manager for "${brand.brand_name}" (${brand.category}). 
    Your ideal placement budget is $${brand.min_placement_budget}, and your absolute maximum ceiling is $${brand.max_budget}. 
    A film producer has just sent you a proposal asking for $${askAmount}.
    
    Here is their proposed creative integration:
    "${proposalText}"
    
    Rules for your decision:
    1. You must evaluate BOTH the price and the creative terms.
    2. If the ask is high (above ideal) AND their creative terms are highly restrictive, you MUST COUNTER-OFFER demanding better terms or counter with a strictly lower dollar amount.
    3. If the ask is reasonable or near your budget, ACCEPT eagerly. 
    4. If the ask is above $${brand.max_budget}, REJECT it firmly or make a final aggressive counter at $${brand.max_budget}.
    5. CRITICAL RULE: NEVER counter with the exact same dollar amount the producer asked for. If you agree with their price, your status MUST be "ACCEPT".
    
    Return ONLY a valid JSON object with the following keys:
    "status": must be "ACCEPT", "COUNTER", or "REJECT".
    "message": A highly realistic, in-character 2-sentence response explaining your decision regarding both the price and their specific creative terms. IMPORTANT: If your status is COUNTER, you MUST wrap any specific modified integration terms or key differences you are demanding in exactly this HTML: <span class='contract-highlight'>DIFFERENCE HERE</span>.
    "counterOffer": The numerical dollar amount of your counter offer, or null if accepted/rejected.`;

    const response = await generateContentWithFallback(prompt);
    let decision = JSON.parse(response.text);

    // Hardcode override: if the producer matches or beats the brand's previous counter-offer, force ACCEPT
    if (lastCounterOffer && askAmount <= lastCounterOffer) {
      decision.status = "ACCEPT";
      delete decision.counterOffer;
      decision.message = `We have a deal. $${askAmount} is acceptable based on our previous negotiation.`;
    }

    return NextResponse.json({
      success: true,
      data: decision
    });

  } catch (error) {
    console.error("Negotiation error:", error);
    return NextResponse.json({ success: false, error: `Server Error: ${error.message || error.toString()}` }, { status: 500 });
  }
}
