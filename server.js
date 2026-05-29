const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ response: 'No message' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are PlateRun AI Assistant for a food delivery service in Johar Town, Lahore. Help with menu questions, delivery info, and orders. Be friendly and concise. If unsure, suggest WhatsApp: 0307-606-4194.\n\nUser: ${message}`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    res.json({ response: reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ response: 'Something went wrong.' });
  }
});

app.get('/', (req, res) => res.send('PlateRun Chat API running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port ' + PORT));
