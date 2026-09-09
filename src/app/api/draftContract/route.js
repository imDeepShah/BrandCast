import { generateContentStreamWithFallback } from '@/lib/gemini';

export const maxDuration = 60; // Prevent Vercel timeouts

export async function POST(req) {
  try {
    const { brandName, askAmount, proposalText } = await req.json();

    const contractPrompt = `Draft a highly professional, strictly bulleted "Memorandum of Understanding / Term Sheet" between "${brandName}" and the Producer for $${askAmount}.
    The agreed integration terms are: "${proposalText}".
    Keep it concise and realistic. Do not include excessive legal boilerplate.
    IMPORTANT: Wrap the dollar amount, the brand name, and the core creative integration terms in exactly this HTML: <span class='contract-highlight'>VALUE</span>. (Use single quotes for the class).
    Return ONLY the raw Term Sheet text.`;

    const stream = await generateContentStreamWithFallback(contractPrompt);

    // Convert the AsyncGenerator from Gemini into a ReadableStream for the Web API
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error("Drafting error:", error);
    return new Response("Server Error: Failed to stream Term Sheet.", { status: 500 });
  }
}
