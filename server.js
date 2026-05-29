const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ response: 'No message' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are PlateRun AI Assistant for a food delivery service in Johar Town, Lahore. Help with menu questions, delivery info, and orders. Be friendly and concise. If unsure, suggest WhatsApp: 0307-606-4194.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ response: data.choices[0].message.content });
    } else {
      console.error('Unexpected:', JSON.stringify(data));
      res.json({ response: 'Sorry, something went wrong.' });
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ response: 'Something went wrong.' });
  }
});

app.get('/', (req, res) => res.send('PlateRun Chat API running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port ' + PORT));
