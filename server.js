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
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HF_API_KEY}`
        },
        body: JSON.stringify({
          inputs: `<s>[INST] You are PlateRun AI Assistant for a food delivery service in Johar Town, Lahore. Help with menu questions, delivery info, and orders. Be friendly and concise. If unsure, suggest WhatsApp: 0307-606-4194.\n\nUser: ${message} [/INST]`,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    const data = await response.json();
    console.log('HF response:', JSON.stringify(data));

    if (Array.isArray(data) && data[0]?.generated_text) {
      res.json({ response: data[0].generated_text.trim() });
    } else {
      console.error('Unexpected:', JSON.stringify(data));
      res.json({ response: 'Sorry, please contact WhatsApp: 0307-606-4194' });
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ response: 'Something went wrong.' });
  }
});

app.get('/', (req, res) => res.send('PlateRun Chat API running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
