const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

async function tryGemini(message) {
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: 'You are PlateRun AI Assistant for a food delivery service in Johar Town, Lahore. Help with menu questions, delivery info, and orders. Be friendly and concise. If unsure, suggest WhatsApp: 0307-606-4194.' }]
            },
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const data = await response.json();
      console.log(`${model} response:`, JSON.stringify(data));

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.error?.code === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
        console.log(`${model} rate limited, trying next...`);
        continue;
      }

    } catch (err) {
      console.log(`${model} failed:`, err.message);
      continue;
    }
  }
  return null;
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ response: 'No message' });

  const result = await tryGemini(message);

  if (result) {
    res.json({ response: result });
  } else {
    res.json({ response: 'Sorry, I am busy right now. Please contact us on WhatsApp: 0307-606-4194' });
  }
});

app.get('/', (req, res) => res.send('PlateRun Chat API running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
