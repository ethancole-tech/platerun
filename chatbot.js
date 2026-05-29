// ═══════════════════════════════════════════════════════════════════════════════
// PlateRun AI Chat Agent - Frontend Widget
// Floating chat bot for customer support, menu questions, and restaurant inquiries
// API: https://platerun.rshazab91.workers.dev/
// ═══════════════════════════════════════════════════════════════════════════════

class PlateRunChatAgent {
  constructor() {
    this.apiURL = 'https://platerun.rshazab91.workers.dev/';
    this.isOpen = false;
    this.messages = [];
    this.conversationHistory = [];
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
            <div class="pr-chat-header-actions">
              <button class="pr-chat-clear" id="prChatClear" title="Clear chat">🗑</button>
              <button class="pr-chat-close" id="prChatClose">✕</button>
            </div>
          </div>
          <div class="pr-chat-messages" id="prChatMessages"></div>
          <div class="pr-chat-quick-replies" id="prQuickReplies">
            <button class="pr-quick-btn" data-msg="What's on the menu?">🍽 Menu</button>
            <button class="pr-quick-btn" data-msg="How does delivery work?">🚚 Delivery</button>
            <button class="pr-quick-btn" data-msg="Track my order">📦 Track Order</button>
            <button class="pr-quick-btn" data-msg="Opening hours?">🕐 Hours</button>
          </div>
          <div class="pr-chat-input-area">
            <input 
              type="text" 
              id="prChatInput" 
              placeholder="Ask about menu, delivery, orders..." 
              class="pr-chat-input"
              autocomplete="off"
              maxlength="500"
            />
            <button class="pr-chat-send" id="prChatSend" title="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="pr-chat-footer">
            <div class="pr-chat-footer-text">
              💬 Urgent help? <a href="https://wa.me/923076064194" target="_blank" rel="noopener">WhatsApp us</a>
            </div>
          </div>
        </div>
      </div>
    `;

    let container = document.getElementById('chatWidget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'chatWidget';
      document.body.appendChild(container);
    }
    container.innerHTML = html;

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

      /* ── Bubble ── */
      .pr-chat-bubble {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--red, #E8340A), var(--orange, #F5600F));
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(232, 52, 10, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
      }
      .pr-chat-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 28px rgba(232, 52, 10, 0.55);
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
        border: 2px solid rgba(232, 52, 10, 0.5);
        animation: pr-pulse 2s infinite;
      }
      @keyframes pr-pulse {
        0%   { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.35); opacity: 0; }
      }

      /* ── Window ── */
      .pr-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 20px);
        height: 600px;
        background: var(--card, #FFFFFF);
        border-radius: 20px;
        box-shadow: 0 8px 48px rgba(0, 0, 0, 0.18);
        display: none;
        flex-direction: column;
        opacity: 0;
        transform: scale(0.92) translateY(24px);
        transition: opacity 0.3s cubic-bezier(0.16,1,0.3,1),
                    transform 0.3s cubic-bezier(0.16,1,0.3,1);
        overflow: hidden;
        z-index: 10000;
      }
      .pr-chat-window.open {
        display: flex;
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      /* ── Header ── */
      .pr-chat-header {
        background: linear-gradient(135deg, var(--red, #E8340A) 0%, var(--orange, #F5600F) 100%);
        color: #fff;
        padding: 16px 18px;
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
        margin-bottom: 3px;
        letter-spacing: 0.3px;
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
        flex-shrink: 0;
        animation: pr-blink 2s infinite;
      }
      @keyframes pr-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.35; }
      }
      .pr-chat-header-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .pr-chat-close,
      .pr-chat-clear {
        background: rgba(255,255,255,0.2);
        border: none;
        color: #fff;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .pr-chat-close:hover,
      .pr-chat-clear:hover { background: rgba(255,255,255,0.38); }

      /* ── Messages ── */
      .pr-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: var(--bg, #FBF5EC);
        display: flex;
        flex-direction: column;
        gap: 10px;
        scrollbar-width: thin;
        scrollbar-color: rgba(232,52,10,0.25) transparent;
      }
      .pr-chat-messages::-webkit-scrollbar { width: 5px; }
      .pr-chat-messages::-webkit-scrollbar-track { background: transparent; }
      .pr-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(232,52,10,0.25);
        border-radius: 3px;
      }

      /* ── Message bubbles ── */
      .pr-chat-msg {
        display: flex;
        gap: 8px;
        animation: pr-slideIn 0.28s ease both;
      }
      @keyframes pr-slideIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .pr-chat-msg.user { justify-content: flex-end; }
      .pr-chat-msg-bubble {
        max-width: 82%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 13.5px;
        line-height: 1.55;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      .pr-chat-msg.bot .pr-chat-msg-bubble {
        background: var(--card, #FFFFFF);
        border: 1px solid var(--border, rgba(160,90,20,0.13));
        color: var(--ink, #3A1C08);
        border-bottom-left-radius: 4px;
      }
      .pr-chat-msg.user .pr-chat-msg-bubble {
        background: linear-gradient(135deg, var(--red, #E8340A), var(--orange, #F5600F));
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .pr-chat-msg-time {
        font-size: 10px;
        opacity: 0.45;
        margin-top: 4px;
        display: block;
      }
      .pr-chat-msg.user .pr-chat-msg-time { text-align: right; color: rgba(255,255,255,0.7); }
      .pr-chat-msg.bot  .pr-chat-msg-time { color: var(--muted, #9A7255); }

      /* ── Quick replies ── */
      .pr-chat-quick-replies {
        display: flex;
        gap: 6px;
        padding: 8px 12px;
        background: var(--bg, #FBF5EC);
        overflow-x: auto;
        flex-shrink: 0;
        scrollbar-width: none;
        border-top: 1px solid var(--border, rgba(160,90,20,0.1));
      }
      .pr-chat-quick-replies::-webkit-scrollbar { display: none; }
      .pr-quick-btn {
        white-space: nowrap;
        padding: 6px 12px;
        border-radius: 20px;
        border: 1.5px solid var(--red, #E8340A);
        background: transparent;
        color: var(--red, #E8340A);
        font-size: 12px;
        font-family: var(--font-b, 'DM Sans', sans-serif);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .pr-quick-btn:hover {
        background: var(--red, #E8340A);
        color: #fff;
      }

      /* ── Input area ── */
      .pr-chat-input-area {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        background: var(--card, #FFFFFF);
        border-top: 1px solid var(--border, rgba(160,90,20,0.12));
        flex-shrink: 0;
        align-items: center;
      }
      .pr-chat-input {
        flex: 1;
        border: 1.5px solid var(--border, rgba(160,90,20,0.15));
        border-radius: 22px;
        padding: 9px 14px;
        font-family: var(--font-b, 'DM Sans', sans-serif);
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: var(--input-bg, #FFF8F0);
        color: var(--dark, #1C0A02);
        line-height: 1.4;
      }
      .pr-chat-input:focus {
        border-color: var(--red, #E8340A);
        box-shadow: 0 0 0 3px rgba(232,52,10,0.12);
      }
      .pr-chat-input::placeholder { color: var(--light-muted, #C8A882); }
      .pr-chat-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--red, #E8340A), var(--orange, #F5600F));
        border: none;
        color: #fff;
        cursor: pointer;
        transition: transform 0.2s, opacity 0.2s;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pr-chat-send:hover  { transform: scale(1.08); }
      .pr-chat-send:active { transform: scale(0.94); }
      .pr-chat-send:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

      /* ── Footer ── */
      .pr-chat-footer {
        padding: 7px 12px;
        background: var(--surface2, #FAF3E8);
        border-top: 1px solid var(--border, rgba(160,90,20,0.12));
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

      /* ── Typing indicator ── */
      .pr-chat-typing {
        display: flex;
        gap: 5px;
        padding: 12px 14px;
        align-items: center;
      }
      .pr-chat-typing span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--muted, #9A7255);
        animation: pr-typing 1.3s infinite;
      }
      .pr-chat-typing span:nth-child(2) { animation-delay: 0.18s; }
      .pr-chat-typing span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes pr-typing {
        0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
        30%            { opacity: 1;    transform: translateY(-6px); }
      }

      /* ── Error bubble ── */
      .pr-chat-msg.error .pr-chat-msg-bubble {
        background: #fff3f0;
        border-color: rgba(232,52,10,0.25);
        color: #c0392b;
      }

      /* ── Mobile ── */
      @media (max-width: 480px) {
        #prChatContainer { bottom: 16px; right: 10px; }
        .pr-chat-window {
          width: calc(100vw - 20px);
          height: calc(100dvh - 90px);
          right: 0;
          bottom: 66px;
          border-radius: 16px;
        }
      }

      /* ── Dark mode ── */
      [data-theme="dark"] .pr-chat-window       { background: var(--card, #1C0E07); }
      [data-theme="dark"] .pr-chat-messages     { background: var(--bg, #110804); }
      [data-theme="dark"] .pr-chat-quick-replies{ background: var(--bg, #110804); }
      [data-theme="dark"] .pr-chat-input        { background: var(--input-bg, #140900); color: var(--dark, #F5EAD8); }
      [data-theme="dark"] .pr-chat-input-area   { background: var(--card, #1C0E07); }
      [data-theme="dark"] .pr-chat-footer       { background: #160b04; }
      [data-theme="dark"] .pr-chat-msg.bot .pr-chat-msg-bubble {
        background: var(--card, #1C0E07);
        color: var(--ink, #DEC89A);
        border-color: rgba(245,166,35,0.09);
      }
      [data-theme="dark"] .pr-quick-btn { border-color: var(--orange, #F5600F); color: var(--orange, #F5600F); }
      [data-theme="dark"] .pr-quick-btn:hover { background: var(--orange, #F5600F); color: #fff; }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    const bubble   = document.getElementById('prChatBubble');
    const closeBtn = document.getElementById('prChatClose');
    const clearBtn = document.getElementById('prChatClear');
    const sendBtn  = document.getElementById('prChatSend');
    const input    = document.getElementById('prChatInput');

    if (bubble)   bubble.addEventListener('click', () => this.toggleWindow());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeWindow());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearChat());
    if (sendBtn)  sendBtn.addEventListener('click', () => this.sendMessage());

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Quick reply buttons
    const quickReplies = document.getElementById('prQuickReplies');
    if (quickReplies) {
      quickReplies.addEventListener('click', (e) => {
        const btn = e.target.closest('.pr-quick-btn');
        if (btn) {
          const msg = btn.getAttribute('data-msg');
          const input = document.getElementById('prChatInput');
          if (input) input.value = msg;
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
    const win    = document.getElementById('prChatWindow');
    const bubble = document.getElementById('prChatBubble');
    if (win)    win.classList.add('open');
    if (bubble) bubble.classList.add('hidden');

    setTimeout(() => {
      const input = document.getElementById('prChatInput');
      if (input) input.focus();
    }, 320);

    if (this.messages.length === 0) {
      this.addBotMessage("👋 Hi! I'm the PlateRun AI Assistant.\n\nAsk me anything about our restaurants, menus, delivery, or orders. How can I help you today?");
    }
  }

  closeWindow() {
    this.isOpen = false;
    const win    = document.getElementById('prChatWindow');
    const bubble = document.getElementById('prChatBubble');
    if (win)    win.classList.remove('open');
    if (bubble) bubble.classList.remove('hidden');
  }

  clearChat() {
    this.messages = [];
    this.conversationHistory = [];
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) messagesEl.innerHTML = '';
    try { localStorage.removeItem('pr_chat_history'); } catch (e) {}
    setTimeout(() => {
      this.addBotMessage("Chat cleared! 👋 How can I help you today?");
    }, 150);
  }

  async sendMessage() {
    const input = document.getElementById('prChatInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message || this.isLoading) return;

    this.addUserMessage(message);
    input.value = '';
    input.focus();
    this.setLoading(true);
    this.showTyping();

    // Hide quick replies after first message
    const qr = document.getElementById('prQuickReplies');
    if (qr) qr.style.display = 'none';

    try {
      const response = await fetch(this.apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: this.conversationHistory.slice(-10) })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      this.removeTyping();

      const reply = data.response || data.message || data.text || "Sorry, I didn't get a response.";
      this.addBotMessage(reply);

      // Keep conversation context
      this.conversationHistory.push(
        { role: 'user',      content: message },
        { role: 'assistant', content: reply   }
      );
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

    } catch (error) {
      console.error('PlateRun Chat error:', error);
      this.removeTyping();
      this.addBotMessage(
        "Sorry, I'm having trouble connecting right now. 😔\n\nPlease WhatsApp us at 0307-606-4194 for immediate help!",
        'error'
      );
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(state) {
    this.isLoading = state;
    const sendBtn = document.getElementById('prChatSend');
    if (sendBtn) sendBtn.disabled = state;
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  addUserMessage(text) {
    const now = new Date();
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg user';
    msgEl.innerHTML = `
      <div>
        <div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>
        <span class="pr-chat-msg-time">${this.formatTime(now)}</span>
      </div>`;
    this._appendMessage(msgEl);
    this.messages.push({ type: 'user', text, time: now.toISOString() });
    this.saveMessages();
  }

  addBotMessage(text, type = 'bot') {
    const now = new Date();
    const msgEl = document.createElement('div');
    msgEl.className = `pr-chat-msg ${type}`;
    msgEl.innerHTML = `
      <div>
        <div class="pr-chat-msg-bubble">${this.escapeHtml(text)}</div>
        <span class="pr-chat-msg-time">${this.formatTime(now)}</span>
      </div>`;
    this._appendMessage(msgEl);
    this.messages.push({ type, text, time: now.toISOString() });
    this.saveMessages();
  }

  _appendMessage(el) {
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.appendChild(el);
      this.scrollToBottom();
    }
  }

  showTyping() {
    const msgEl = document.createElement('div');
    msgEl.className = 'pr-chat-msg bot';
    msgEl.id = 'pr-typing-indicator';
    msgEl.innerHTML = `<div class="pr-chat-msg-bubble" style="padding:0"><div class="pr-chat-typing"><span></span><span></span><span></span></div></div>`;
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.appendChild(msgEl);
      this.scrollToBottom();
    }
  }

  removeTyping() {
    const el = document.getElementById('pr-typing-indicator');
    if (el) el.remove();
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('prChatMessages');
    if (messagesEl) {
      messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    }
  }

  saveMessages() {
    try {
      localStorage.setItem('pr_chat_history', JSON.stringify(this.messages.slice(-60)));
    } catch (e) {
      console.warn('PlateRun Chat: Could not save messages');
    }
  }

  loadMessages() {
    try {
      const saved = localStorage.getItem('pr_chat_history');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      this.messages = parsed;

      // Only restore messages from the last 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const recent = parsed.filter(m => new Date(m.time).getTime() > cutoff);
      if (recent.length === 0) return;

      // Re-render restored messages (without saving again)
      const messagesEl = document.getElementById('prChatMessages');
      if (!messagesEl) return;
      recent.forEach(m => {
        const now = new Date(m.time);
        const msgEl = document.createElement('div');
        msgEl.className = `pr-chat-msg ${m.type}`;
        msgEl.innerHTML = `
          <div>
            <div class="pr-chat-msg-bubble">${this.escapeHtml(m.text)}</div>
            <span class="pr-chat-msg-time">${this.formatTime(now)}</span>
          </div>`;
        messagesEl.appendChild(msgEl);
      });
      this.scrollToBottom();

      // Hide quick replies if there's existing history
      const qr = document.getElementById('prQuickReplies');
      if (qr && recent.length > 0) qr.style.display = 'none';

    } catch (e) {
      console.warn('PlateRun Chat: Could not load messages');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
}

// ── Auto-init ──────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.plateRunChat = new PlateRunChatAgent();
  });
} else {
  window.plateRunChat = new PlateRunChatAgent();
}
