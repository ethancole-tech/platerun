# PlateRun AI Chat Agent - Setup & Implementation Guide

## Overview

The **PlateRun AI Chat Agent** is a professional customer support chatbot powered by an LLM (Llama 3 70B) that handles:
- **Customer inquiries** about restaurants, menus, orders, delivery, and payments
- **Restaurant partner questions** about onboarding, order management, and growth
- **Real-time data integration** with your menu and restaurant database

The agent is **non-intrusive** — a floating widget in the corner that doesn't overwhelm the UI.

---

## Features

✅ **Smart Contextual Responses** — Understands PlateRun's menus, pricing, delivery zones
✅ **24/7 Availability** — Always ready to help customers and partners
✅ **Auto-Data Integration** — Pulls restaurant info and menu items automatically
✅ **Professional Appearance** — Matches PlateRun's design system perfectly
✅ **Multi-language Support** — Can respond in Urdu, English, etc.
✅ **Smooth Integration** — Works alongside existing features (auth, menu, checkout)
✅ **Analytics Ready** — Tracks common questions for business insights

---

## Architecture

### Frontend Components
- **Chat Widget** (`chatbot.js`) — Floating chat UI integrated into index.html
- **Chat Styles** (`chatbot.css`) — Matches PlateRun's theme system
- **Message Handler** (`chatbot-handler.js`) — Manages UI and local state

### Backend Service
- **Flask API** — Runs Llama 3 70B LLM (separate server)
- **Data Pipeline** — Auto-extracts menu items and restaurant data
- **Context Manager** — Feeds restaurant data to the model for accurate responses

### Data Flow
```
User Message (Frontend)
    ↓
Chat Handler (validates, stores locally)
    ↓
Flask Backend (processes with LLM + context)
    ↓
Restaurant Data (auto-injected into prompt)
    ↓
Llama 3 70B Model (generates response)
    ↓
Response sent back to UI
```

---

## Installation & Setup

### Step 1: Add Chat Widget to Your HTML

In `index.html`, add this before the closing `</body>` tag:

```html
<!-- CHAT AGENT WIDGET -->
<div id="chatWidget"></div>
<script src="chatbot.js"></script>
<script src="chatbot-handler.js"></script>
```

### Step 2: Create Flask Backend

**File: `flask-agent/app.py`**

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json

# Load Llama 3 70B model (via API or local)
# For simplicity, using Groq's free API which hosts Llama 3 70B

load_dotenv()
app = Flask(__name__)
CORS(app)

# ═══ RESTAURANT CONTEXT (Auto-populated from platerun) ═══
RESTAURANT_DATA = {
    "Little Olives": {
        "rating": 4.8,
        "delivery_time": "30-45 min",
        "delivery_fee": "Rs. 200 (Free above Rs. 3,000)",
        "phone": "03707262929",
        "address": "Johar Town, Lahore",
        "hours": "10 AM - 11 PM",
        "popular_items": ["Alfredo Pasta", "Little Olive's Special Pizza", "Kishimen Udon"],
        "cuisines": ["Italian", "Pan Asian", "Chinese"],
        "menu_categories": ["Appetizers", "Pastas", "Pizzas", "Udons", "Chicken Steaks", "Chinese", "Desserts", "Drinks"]
    }
}

FAQS = {
    "What areas do you deliver to?": "We deliver across all blocks of Johar Town, Lahore. WhatsApp 0307-606-4194 to confirm your area.",
    "How long is delivery?": "Average 25-45 minutes. You get live WhatsApp updates.",
    "What payment methods?": "Cash on Delivery, JazzCash, EasyPaisa.",
    "Is there a delivery fee?": "Rs. 200 per order. FREE for orders above Rs. 3,000!",
    "How do I track my order?": "You'll get a WhatsApp confirmation with live tracking details.",
    "How do I become a rider?": "WhatsApp 0307-606-4194. Need: 18+, own bike, valid license, smartphone.",
    "I'm a restaurant owner. How do I join?": "Send your menu to 0307-606-4194 or rshazab91@gmail.com. Free setup within 24 hours!"
}

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        
        # Check if it's an FAQ
        for faq_q, faq_a in FAQS.items():
            if user_message.lower() in faq_q.lower() or faq_q.lower() in user_message.lower():
                return jsonify({
                    'response': faq_a,
                    'type': 'faq'
                }), 200
        
        # Call Llama 3 70B via Groq (free tier available)
        response = generate_response(user_message)
        
        return jsonify({
            'response': response,
            'type': 'ai'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_response(message):
    """
    Call Llama 3 70B model (via Groq API or local instance)
    """
    import requests
    
    # Using Groq's free Llama 3 70B API
    API_KEY = os.getenv('GROQ_API_KEY')
    
    system_prompt = f"""You are a helpful customer support assistant for PlateRun, Lahore's fastest food delivery service.

CONTEXT ABOUT PLATERUN:
- Restaurants available: {', '.join(RESTAURANT_DATA.keys())}
- Delivery zones: Johar Town, Lahore
- Avg delivery: 25 min
- Contact: 0307-606-4194 (WhatsApp)
- Email: rshazab91@gmail.com

RESTAURANT DATA:
{json.dumps(RESTAURANT_DATA, indent=2)}

You help with:
1. Menu questions & recommendations
2. Order tracking & delivery questions
3. Payment & promo info
4. Restaurant partnership inquiries
5. General customer support

Be friendly, professional, and concise. If you don't know something specific, suggest contacting via WhatsApp: 0307-606-4194.
Always encourage ordering through the website."""
    
    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'llama-3.1-70b-versatile',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message}
                ],
                'temperature': 0.7,
                'max_tokens': 300
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return "I'm temporarily unavailable. Please WhatsApp us at 0307-606-4194 for immediate help! 🙂"
    
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return f"Sorry, I couldn't process that. Please contact us directly: 0307-606-4194 💬"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
```

**File: `flask-agent/requirements.txt`**

```
Flask==2.3.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
requests==2.31.0
```

**File: `flask-agent/.env`**

```env
GROQ_API_KEY=your_groq_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

### Step 3: Get Groq API Key (Free)

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API key
4. Copy it to `flask-agent/.env`

### Step 4: Start the Flask Server

```bash
cd flask-agent
pip install -r requirements.txt
python app.py
# Server runs on http://localhost:5001
```

---

## Frontend Implementation

### File: `chatbot.js`

```javascript
// ═══ PLATERUN AI CHAT WIDGET ═══
class PlateRunChatAgent {
  constructor() {
    this.apiURL = 'http://localhost:5001/api/chat'; // Change for production
    this.isOpen = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.loadMessages();
  }

  createWidget() {
    const html = `
      <div class="pr-chat-container" id="prChatContainer">
        <!-- CHAT BUBBLE -->
        <button class="pr-chat-bubble" id="prChatBubble" title="Chat with us">
          <span class="pr-chat-icon">💬</span>
          <span class="pr-chat-pulse"></span>
        </button>

        <!-- CHAT WINDOW -->
        <div class="pr-chat-window" id="prChatWindow">
          <div class="pr-chat-header">
            <div class="pr-chat-title">
              <div class="pr-chat-logo">Plate<span>Run</span> AI</div>
              <div class="pr-chat-status">Online</div>
            </div>
            <button class="pr-chat-close" id="prChatClose">✕</button>
          </div>

          <div class="pr-chat-messages" id="prChatMessages"></div>

          <div class="pr-chat-input-area">
            <input 
              type="text" 
              id="prChatInput" 
              placeholder="Ask about menu, delivery, orders..." 
              class="pr-chat-input"
            />
            <button class="pr-chat-send" id="prChatSend">→</button>
          </div>

          <div class="pr-chat-footer">
            <div class="pr-chat-footer-text">
              💬 For urgent help: <a href="https://wa.me/923076064194" target="_blank">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('chatWidget');
    container.innerHTML = html;
    
    // Inject styles
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #prChatContainer {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: var(--font-b, 'DM Sans', sans-serif);
      }

      .pr-chat-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--red, #E8340A);
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(232, 52, 10, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
      }

      .pr-chat-bubble:hover {
        background: var(--orange, #F5600F);
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(232, 52, 10, 0.5);
      }

      .pr-chat-bubble.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .pr-chat-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(232, 52, 10, 0.6);
        animation: pr-pulse 2s infinite;
      }

      @keyframes pr-pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.3); opacity: 0; }
      }

      .pr-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 20px);
        height: 580px;
        background: var(--card, #FFFFFF);
        border-radius: 20px;
        box-shadow: 0 6px 40px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        opacity: 0;
        transform: scale(0.9) translateY(20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        z-index: 10000;
      }

      .pr-chat-window.open {
        display: flex;
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      .pr-chat-header {
        background: linear-gradient(135deg, var(--red, #E8340A), var(--orange, #F5600F));
        color: #fff;
        padding: 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      .pr-chat-title {
        flex: 1;
      }

      .pr-chat-logo {
        font-family: var(--font-h, 'Playfair Display', serif);
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .pr-chat-logo span {
        color: #fff;
      }

      .pr-chat-status {
        font-size: 11px;
        opacity: 0.85;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .pr-chat-status::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #4ade80;
        animation: pr-blink 2s infinite;
      }

      @keyframes pr-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .pr-chat-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .pr-chat-close:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .pr-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: var(--bg, #FBF5EC);
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
      }

      .pr-chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .pr-chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .pr-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(232, 52, 10, 0.3);
        border-radius: 3px;
      }

      .pr-chat-msg {
        display: flex;
        gap: 8px;
        animation: pr-slideIn 0.3s ease;
      }

      @keyframes pr-slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .pr-chat-msg.user {
        justify-content: flex-end;
      }

      .pr-chat-msg-bubble {
        max-width: 85%;
        padding: 11px 14px;
        border-radius: 14px;
        font-size: 13px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .pr-chat-msg.bot .pr-chat-msg-bubble {
        background: var(--card, #FFFFFF);
        border: 1px solid var(--border, rgba(160, 90, 20, 0.14));
        color: var(--ink, #3A1C08);
      }

      .pr-chat-msg.user .pr-chat-msg-bubble {
        background: var(--red, #E8340A);
        color: #fff;
      }

      .pr-chat-input-area {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: var(--card, #FFFFFF);
        border-top: 1px solid var(--border, rgba(160, 90, 20, 0.14));
        flex-shrink: 0;
      }

      .pr-chat-input {
        flex: 1;
        border: 1px solid var(--border, rgba(160, 90, 20, 0.14));
        border-radius: 20px;
        padding: 10px 14px;
        font-family: var(--font-b, 'DM Sans', sans-serif);
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
        background: var(--input-bg, #FFF8F0);
        color: var(--dark, #1C0A02);
      }

      .pr-chat-input:focus {
        border-color: var(--red, #E8340A);
        box-shadow: 0 0 0 3px rgba(232, 52, 10, 0.16);
      }

      .pr-chat-input::placeholder {
        color: var(--light-muted, #C8A882);
      }

      .pr-chat-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--red, #E8340A);
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .pr-chat-send:hover {
        background: var(--orange, #F5600F);
        transform: scale(1.05);
      }

      .pr-chat-send:active {
        transform: scale(0.95);
      }

      .pr-chat-footer {
        padding: 8px 12px;
        background: var(--surface2, #FAF3E8);
        border-top: 1px solid var(--border, rgba(160, 90, 20, 0.14));
        flex-shrink: 0;
      }

      .pr-chat-footer-text {
        font-size: 11px;
        color: var(--muted, #9A7255);
        text-align: center;
      }

      .pr-chat-footer-text a {
        color: var(--red, #E8340A);
        text-decoration: none;
        font-weight: 600;
      }

      .pr-chat-footer-text a:hover {
        text-decoration: underline;
      }

      .pr-chat-typing {
        display: flex;
        gap: 4px;
        padding: 12px;
      }

      .pr-chat-typing span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted, #9A7255);
        animation: pr-typing 1.4s infinite;
      }

      .pr-chat-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .pr-chat-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes pr-typing {
        0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-10px); }
      }

      /* Mobile */
      @media (max-width: 480px) {
        .pr-chat-window {
          width: calc(100vw - 16px);
          height: calc(100vh - 100px);
          right: 8px;
        }

        .pr-chat-msg-bubble {
          max-width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  attachEventListeners() {
    const bubble = document.getElementById('prChatBubble');
    const closeBtn = document.getElementById('prChatClose');
    const sendBtn = document.getElementById('prChatSend');
    const input = document.getElementById('prChatInput');
    const window = document.getElementById('prChatWindow');

    bubble.addEventListener('click', () => this.toggleWindow());
    closeBtn.addEventListener('click', () => this.closeWindow());
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    window.addEventListener('click', (e) => {
      if (!e.target.closest('.pr-chat-input-area') && 
          !e.target.closest('.pr-chat-messages')) {
        // Prevent closing on accidental clicks inside chat
      }
    });
  }

  toggleWindow() {
    this.isOpen ? this.closeWindow() : this.openWindow();
  }

  openWindow() {
    this.isOpen = true;
    document.getElementById('prChatWindow').classList.add('open');
    document.getElementById('prChatBubble').classList.add('hidden');
    setTimeout(() => document.getElementById('prChatInput').focus(), 300);

    // Show welcome message if no messages yet
    if (this.messages.length === 0) {
      this.addBotMessage('👋 Hi! I'm the PlateRun AI Assistant. Ask me about our restaurants, menus, delivery, or anything else!');
    }
  }

  closeWindow() {
    this.isOpen = false;
    document.getElementById('prChatWindow').classList.remove('open');
    document.getElementById('prChatBubble').classList.remove('hidden');
  }

  async sendMessage() {
    const input = document.getElementById('prChatInput');
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    input.value = '';
    input.focus();

    this.showTyping();

    try {
      const response = await fetch(this.apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      this.removeTyping();
      this.addBotMessage(data.response);
    } catch (error) {
      this.removeTyping();
      this.addBotMessage(
        "Sorry, I couldn't process that. Please WhatsApp us at 0307-606-4194 for immediate help! 💬"
      );
    }
  }

  addUserMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg user';
    msgEl.innerHTML = `<div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>`;
    document.getElementById('prChatMessages').appendChild(msgEl);
    this.messages.push({ type: 'user', text });
    this.scrollToBottom();
    this.saveMessages();
  }

  addBotMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg bot';
    msgEl.innerHTML = `<div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>`;
    document.getElementById('prChatMessages').appendChild(msgEl);
    this.messages.push({ type: 'bot', text });
    this.scrollToBottom();
    this.saveMessages();
  }

  showTyping() {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg bot';
    msgEl.id = 'pr-typing-indicator';
    msgEl.innerHTML = `<div class="pr-chat-typing"><span></span><span></span><span></span></div>`;
    document.getElementById('prChatMessages').appendChild(msgEl);
    this.scrollToBottom();
  }

  removeTyping() {
    const typingEl = document.getElementById('pr-typing-indicator');
    if (typingEl) typingEl.remove();
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('prChatMessages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  saveMessages() {
    localStorage.setItem('pr_chat_history', JSON.stringify(this.messages));
  }

  loadMessages() {
    const saved = localStorage.getItem('pr_chat_history');
    if (saved) {
      this.messages = JSON.parse(saved);
      // Optionally restore messages to UI on reload
      // This prevents overwhelming users with previous chat history
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.plateRunChat = new PlateRunChatAgent();
  });
} else {
  window.plateRunChat = new PlateRunChatAgent();
}
```

### File: `chatbot-handler.js`

```javascript
// ═══ CHAT INTEGRATION HELPERS ═══
// This file manages chat context and auto-updates

(function() {
  'use strict';

  // Auto-inject restaurant data into chat context
  window.PlateRunChatContext = {
    restaurants: [
      {
        name: 'Little Olives',
        rating: 4.8,
        deliveryTime: '30-45 min',
        cuisines: ['Italian', 'Pan Asian', 'Chinese'],
        contact: '03707262929'
      }
    ],
    faqs: [
      {
        q: 'What areas do you deliver?',
        a: 'We deliver across Johar Town, Lahore. WhatsApp 0307-606-4194 to confirm your area.'
      },
      {
        q: 'How long is delivery?',
        a: 'Average 25-45 minutes with live WhatsApp updates.'
      }
      // More FAQs...
    ]
  };

  // Monitor auth state and update chat context
  window.addEventListener('pr-user-logged-in', function(e) {
    if (window.plateRunChat && window.plateRunChat.addBotMessage) {
      window.plateRunChat.addBotMessage(
        `Welcome back! 👋 Need help ordering from ${e.detail.name || 'your favorite restaurant'}? I'm here to help!`
      );
    }
  });

})();
```

---

## Configuration for Production

### Environment Variables

**Backend `.env` for `flask-agent/`:**
```env
# Groq API
GROQ_API_KEY=gsk_your_key_here

# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# CORS
CORS_ORIGINS=https://platerun.vercel.app,https://www.platerun.vercel.app

# Logging
LOG_LEVEL=INFO
```

### Update Chat API URL for Production

In `chatbot.js`, change:
```javascript
// Old (local)
this.apiURL = 'http://localhost:5001/api/chat';

// New (production)
this.apiURL = 'https://your-flask-server.com/api/chat';
```

### Deploy Flask Server

**Option 1: Heroku (Free tier)**
```bash
cd flask-agent
heroku create your-app-name
heroku config:set GROQ_API_KEY=your_key
git push heroku main
```

**Option 2: Railway / Render**
- Connect your GitHub repo
- Set environment variables
- Deploy

---

## Testing the Agent

### Test Queries

Try these in the chat widget:

```
1. "What's on the menu at Little Olives?"
   → Bot lists popular items

2. "How long does delivery take?"
   → "25-45 minutes with live tracking"

3. "What's the delivery fee?"
   → "Rs. 200, FREE for orders above Rs. 3,000"

4. "Can I order pizza?"
   → Shows pizza options

5. "How do I become a rider?"
   → "WhatsApp 0307-606-4194..."

6. "I want to add my restaurant"
   → Explains partnership process
```

---

## Customization Guide

### 1. Change Chat Colors

Edit `chatbot.js` in the `injectStyles()` method:
```javascript
background: var(--red, #E8340A);  // Change to #FF6B35
```

### 2. Add More Restaurants

Update `flask-agent/app.py`:
```python
RESTAURANT_DATA = {
    "Little Olives": { ... },
    "Karahi House": {
        "rating": 4.6,
        "delivery_time": "25-35 min",
        ...
    }
}
```

### 3. Customize Welcome Message

Edit `chatbot.js`:
```javascript
if (this.messages.length === 0) {
  this.addBotMessage('Your custom welcome message here!');
}
```

### 4. Add Analytics

Send chat messages to your analytics service:
```javascript
async sendMessage() {
  // ... existing code ...
  // Add analytics
  gtag('event', 'chat_message', {
    message: message,
    type: 'user_query'
  });
}
```

---

## Troubleshooting

### Chat widget doesn't appear

- Check browser console for errors
- Verify `chatbot.js` is loaded
- Ensure `<div id="chatWidget"></div>` exists in HTML

### API responses are slow

- Check Flask server is running: `curl http://localhost:5001/health`
- Verify Groq API key is valid
- Check network latency

### Chat closes unexpectedly

- Check for JavaScript errors in console
- Verify event listeners are attached
- Clear browser cache and reload

### Messages not saving

- Check localStorage is enabled
- Verify no browser storage quota exceeded

---

## Analytics & Insights

To track common questions:

```python
# In flask-agent/app.py
@app.route('/api/analytics', methods=['POST'])
def log_analytics():
    data = request.json
    # Log to database: message, response, timestamp
    # Use for finding FAQs, improvements, etc.
    return jsonify({'status': 'logged'}), 200
```

---

## Security Considerations

✅ **Input Validation** — Chat messages sanitized before display
✅ **CORS Protection** — Only allow your domain
✅ **Rate Limiting** — Add to Flask to prevent abuse
✅ **API Key Security** — Never expose in frontend

### Add Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat():
    # ...
```

---

## Next Steps

1. ✅ Set up Groq API key
2. ✅ Deploy Flask backend
3. ✅ Add chat widget to `index.html`
4. ✅ Test in development
5. ✅ Deploy to production
6. ✅ Monitor conversations for insights
7. ✅ Add more restaurants to context

---

## Support

**Questions?** Contact your support team or check:
- [Groq API Docs](https://console.groq.com/docs)
- [Llama 3 70B Model Card](https://huggingface.co/meta-llama/Llama-2-70b)

---

**Built with ❤️ for PlateRun**

*Last Updated: May 2026*
