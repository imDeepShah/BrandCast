import { NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';

export async function POST(req) {
  try {
    const { brandName, category } = await req.json();

    const prompt = `Act as a protective Hollywood Film Producer. You are offering a product placement integration to ${brandName} (${category}). Draft a single, highly realistic 1-paragraph proposal. You must include at least 2 strict creative boundaries to protect the film's artistic integrity (e.g., "Product visibility limited to 3 seconds", "No direct dialogue references allowed", or "Can only appear blurred in the background"). Keep it professional but creatively firm.

    Return ONLY a valid JSON object with the following key:
    { "proposalText": "your drafted paragraph here" }`;

    const response = await generateContentWithFallback(prompt);
    const data = JSON.parse(response.text);

    return NextResponse.json({ success: true, data: data.proposalText });
  } catch (error) {
    console.error("Drafting error:", error);
    return NextResponse.json({ success: false, error: "Drafting failed" }, { status: 500 });
  }
}
