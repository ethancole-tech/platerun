export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method === 'GET') {
      return new Response('PlateRun Chat API running! 🍕', {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (request.method === 'POST') {
      try {
        const { message } = await request.json();

        if (!message) {
          return Response.json(
            { response: 'No message received' },
            { headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: `You are PlateRun AI Assistant — a friendly food delivery chatbot for PlateRun in Johar Town, Lahore, Pakistan.

You help customers with:
- Menu questions (Little Olives restaurant: Italian, Pan Asian, Chinese food)
- Delivery info: Rs. 200 fee, FREE delivery over Rs. 3000, 25-45 min delivery
- Payment: Cash on Delivery, JazzCash, EasyPaisa
- Order support via WhatsApp

Key contacts:
- WhatsApp: 0307-606-4194
- Area: Johar Town, Lahore only

Be friendly, helpful, and concise. Max 2-3 sentences. If unsure, direct to WhatsApp.`,
            messages: [{ role: 'user', content: message }]
          })
        });

        const data = await anthropicResponse.json();

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
        return Response.json(
          { response: 'Something went wrong. WhatsApp: 0307-606-4194 💬' },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
