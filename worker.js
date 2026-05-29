export default {
  async fetch(request, env) {

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // ── Health check ──────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      return new Response('PlateRun Chat API running! 🍕', {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ── Main chat handler ─────────────────────────────────────────────────────
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const { message, history } = body;

        if (!message || typeof message !== 'string' || !message.trim()) {
          return Response.json(
            { response: 'No message received.' },
            { headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        // Build messages array: past history + current user message
        // history comes from chatbot.js as [{role, content}, ...]
        const pastMessages = Array.isArray(history)
          ? history
              .filter(m => m.role && m.content && typeof m.content === 'string')
              .slice(-10) // max 10 past turns to stay within token limits
          : [];

        const messages = [
          ...pastMessages,
          { role: 'user', content: message.trim() }
        ];

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: `You are PlateRun AI Assistant — a friendly, concise food delivery chatbot for PlateRun in Johar Town, Lahore, Pakistan.

You help customers with:
- Menu questions (Little Olives restaurant: Italian, Pan Asian, Chinese food)
- Delivery info: Rs. 200 fee, FREE delivery over Rs. 3000, 25–45 min delivery time
- Payment methods: Cash on Delivery, JazzCash, EasyPaisa
- Order tracking and support via WhatsApp

Key info:
- WhatsApp: 0307-606-4194
- Delivery area: Johar Town, Lahore only
- Website: platerun.vercel.app

Rules:
- Be friendly, warm, and helpful
- Keep replies to 2–3 sentences max
- If you don't know something specific, direct the customer to WhatsApp
- Never make up menu items, prices, or delivery times you are unsure about
- If asked something unrelated to food/PlateRun, politely redirect`,
            messages
          })
        });

        const data = await anthropicResponse.json();

        // Handle Anthropic API errors gracefully
        if (data.error) {
          console.error('Anthropic API error:', data.error);
          return Response.json(
            { response: 'Sorry, our AI is taking a break. Please WhatsApp us at 0307-606-4194 💬' },
            { headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        if (data.content && data.content[0]?.text) {
          return Response.json(
            { response: data.content[0].text.trim() },
            { headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        return Response.json(
          { response: 'Sorry, could not process that. WhatsApp: 0307-606-4194 💬' },
          { headers: { 'Access-Control-Allow-Origin': '*' } }
        );

      } catch (err) {
        console.error('Worker error:', err);
        return Response.json(
          { response: 'Something went wrong. WhatsApp: 0307-606-4194 💬' },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
