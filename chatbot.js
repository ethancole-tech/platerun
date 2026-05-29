// ═══════════════════════════════════════════════════════════════════════════════
// PlateRun AI Chat Agent - Frontend Widget
// Floating chat bot for customer support, menu questions, and restaurant inquiries
// ═══════════════════════════════════════════════════════════════════════════════

class PlateRunChatAgent {
  constructor() {
    this.apiURL = 'https://platerun.rshazab91.workers.dev';
    this.isOpen = false;
    this.messages = [];
    this.isLoading = false;
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
        <button class="pr-chat-bubble" id="prChatBubble" title="Chat with PlateRun AI">
          <span class="pr-chat-icon">💬</span>
          <span class="pr-chat-pulse"></span>
        </button>
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
              autocomplete="off"
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

    const container = document.getElementById('chatWidget') || document.body;
    const chatDiv = document.createElement('div');
    chatDiv.id = 'chatWidget';
    chatDiv.innerHTML = html;
    
    if (!document.getElementById('chatWidget')) {
      document.body.appendChild(chatDiv);
    } else {
      document.getElementById('chatWidget').innerHTML = html;
    }
    
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('pr-chat-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pr-chat-styles';
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
        transform: scale(0);
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
      .pr-chat-title { flex: 1; }
      .pr-chat-logo {
        font-family: var(--font-h, 'Playfair Display', serif);
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .pr-chat-logo span { color: #fff; }
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
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pr-chat-close:hover { background: rgba(255, 255, 255, 0.4); }
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
      .pr-chat-messages::-webkit-scrollbar { width: 6px; }
      .pr-chat-messages::-webkit-scrollbar-track { background: transparent; }
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
      .pr-chat-msg.user { justify-content: flex-end; }
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
      .pr-chat-input::placeholder { color: var(--light-muted, #C8A882); }
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
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pr-chat-send:hover {
        background: var(--orange, #F5600F);
        transform: scale(1.05);
      }
      .pr-chat-send:active { transform: scale(0.95); }
      .pr-chat-send:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
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
      .pr-chat-footer-text a:hover { text-decoration: underline; }
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
      .pr-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
      .pr-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pr-typing {
        0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-10px); }
      }
      @media (max-width: 480px) {
        .pr-chat-window {
          width: calc(100vw - 16px);
          height: calc(100vh - 100px);
          right: 8px;
        }
        .pr-chat-msg-bubble { max-width: 100%; }
      }
      [data-theme="dark"] .pr-chat-window { background: var(--card, #1C0E07); }
      [data-theme="dark"] .pr-chat-messages { background: var(--bg, #110804); }
      [data-theme="dark"] .pr-chat-input {
        background: var(--input-bg, #140900);
        color: var(--dark, #F5EAD8);
      }
      [data-theme="dark"] .pr-chat-msg.bot .pr-chat-msg-bubble {
        background: var(--card, #1C0E07);
        color: var(--ink, #DEC89A);
        border-color: rgba(245,166,35,0.09);
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    const bubble = document.getElementById('prChatBubble');
    const closeBtn = document.getElementById('prChatClose');
    const sendBtn = document.getElementById('prChatSend');
    const input = document.getElementById('prChatInput');

    if (bubble) bubble.addEventListener('click', () => this.toggleWindow());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeWindow());
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  toggleWindow() {
    this.isOpen ? this.closeWindow() : this.openWindow();
  }

  openWindow() {
    this.isOpen = true;
    const win = document.getElementById('prChatWindow');
    const bubble = document.getElementById('prChatBubble');
    if (win) win.classList.add('open');
    if (bubble) bubble.classList.add('hidden');
    setTimeout(() => {
      const input = document.getElementById('prChatInput');
      if (input) input.focus();
    }, 300);
    if (this.messages.length === 0) {
      this.addBotMessage('👋 Hi! I\'m the PlateRun AI Assistant. Ask me about our restaurants, menus, delivery, orders, or anything else! What can I help you with?');
    }
  }

  closeWindow() {
    this.isOpen = false;
    const win = document.getElementById('prChatWindow');
    const bubble = document.getElementById('prChatBubble');
    if (win) win.classList.remove('open');
    if (bubble) bubble.classList.remove('hidden');
  }

  async sendMessage() {
    const input = document.getElementById('prChatInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message || this.isLoading) return;

    this.addUserMessage(message);
    input.value = '';
    input.focus();
    this.showTyping();
    this.isLoading = true;

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
      console.error('Chat error:', error);
      this.removeTyping();
      this.addBotMessage("Sorry, I couldn't process that right now. Please WhatsApp us at 0307-606-4194 for immediate help! 💬");
    } finally {
      this.isLoading = false;
    }
  }

  addUserMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg user';
    msgEl.innerHTML = `<div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>`;
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.appendChild(msgEl);
      this.messages.push({ type: 'user', text, time: new Date() });
      this.scrollToBottom();
      this.saveMessages();
    }
  }

  addBotMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg bot';
    msgEl.innerHTML = `<div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>`;
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.appendChild(msgEl);
      this.messages.push({ type: 'bot', text, time: new Date() });
      this.scrollToBottom();
      this.saveMessages();
    }
  }

  showTyping() {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg bot';
    msgEl.id = 'pr-typing-indicator';
    msgEl.innerHTML = `<div class="pr-chat-typing"><span></span><span></span><span></span></div>`;
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.appendChild(msgEl);
      this.scrollToBottom();
    }
  }

  removeTyping() {
    const typingEl = document.getElementById('pr-typing-indicator');
    if (typingEl) typingEl.remove();
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  saveMessages() {
    try {
      localStorage.setItem('pr_chat_history', JSON.stringify(this.messages.slice(-50)));
    } catch (e) {
      console.warn('Could not save messages');
    }
  }

  loadMessages() {
    try {
      const saved = localStorage.getItem('pr_chat_history');
      if (saved) this.messages = JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load messages');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.plateRunChat = new PlateRunChatAgent();
  });
} else {
  window.plateRunChat = new PlateRunChatAgent();
}
