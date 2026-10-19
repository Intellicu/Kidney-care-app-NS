// Dr. Nephro – Bonsai 27B Chatbot (Streaming)
// Integrated with AIIMS Patna Nephrotic Diary via LM Studio endpoint

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  let conversationHistory = [];
  let isStreaming = false;
  let llmOnline = false;

  // ── Starter Questions ──────────────────────────────────────────────────────
  const QUICK_PROMPTS = [
    { label: '🧪 What does 3+ protein mean?', text: 'My child\'s urine protein showed 3+ (+++) today. What does this mean and should I be worried?' },
    { label: '💊 What is Prednisolone?', text: 'Can you explain what Prednisolone (प्रेडनिसोलोन) is, why my child needs it, and what side effects to watch out for?' },
    { label: '🍱 Diet advice for Nephrotic Syndrome', text: 'What food should my child eat and avoid during Nephrotic Syndrome? Please explain in simple terms.' },
    { label: '⚠️ Signs of relapse', text: 'What are the early signs that my child is having a relapse of Nephrotic Syndrome?' },
    { label: '💉 Which vaccines are safe?', text: 'My child is on steroids. Which vaccines are safe to give and which ones should we avoid?' },
    { label: '🌡️ Fever during steroid therapy', text: 'My child has fever while on Prednisolone. What should I do?' }
  ];

  // ── Build Chat Widget HTML ─────────────────────────────────────────────────
  function buildWidget() {
    const el = document.createElement('div');
    el.id = 'chatbotRoot';
    el.innerHTML = `
      <!-- Floating Launcher Button -->
      <button id="chatLaunchBtn" onclick="NephroChat.toggle()" title="Ask Dr. Nephro AI (Bonsai 27B)">
        <span id="chatBtnIcon">🩺</span>
        <span id="chatBtnLabel">Dr. Nephro AI</span>
        <span id="chatUnreadBadge" style="display:none;"></span>
      </button>

      <!-- Chat Panel -->
      <div id="chatPanel" class="chat-panel chat-panel-hidden">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">🩺</div>
            <div>
              <div class="chat-header-name">Dr. Nephro <span class="chat-model-tag">Bonsai 27B</span></div>
              <div class="chat-header-sub">
                <span id="chatStatusDot" class="status-dot status-checking">●</span>
                <span id="chatStatusText">Connecting to LM Studio…</span>
              </div>
            </div>
          </div>
          <div class="chat-header-btns">
            <button onclick="NephroChat.clearHistory()" title="Clear chat" class="chat-icon-btn">🗑️</button>
            <button onclick="NephroChat.toggle()" title="Close" class="chat-icon-btn">✕</button>
          </div>
        </div>

        <!-- Messages Area -->
        <div id="chatMessages" class="chat-messages">
          <!-- Welcome message injected by JS -->
        </div>

        <!-- Quick Prompts -->
        <div id="chatQuickPrompts" class="chat-quick-prompts"></div>

        <!-- Input Row -->
        <div class="chat-input-row">
          <textarea
            id="chatInput"
            class="chat-textarea"
            placeholder="Ask about your child's Nephrotic Syndrome care…"
            rows="1"
            maxlength="1500"
          ></textarea>
          <button id="chatSendBtn" onclick="NephroChat.send()" class="chat-send-btn" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

        <div class="chat-footer-note">
          ⚕️ AI guidance only — always consult <strong>Dr. Swarnim</strong> for clinical decisions.
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* ─── Launcher Button ───────────────────────────────── */
      #chatLaunchBtn {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 10000;
        background: linear-gradient(135deg, #1b5e3c 0%, #2e885b 100%);
        color: #ffffff;
        border: none;
        border-radius: 50px;
        padding: 13px 20px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 6px 24px rgba(27, 94, 60, 0.45);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-family: inherit;
      }
      #chatLaunchBtn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 32px rgba(27, 94, 60, 0.55);
      }
      #chatUnreadBadge {
        background: #ef4444;
        color: white;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 12px;
        min-width: 20px;
        text-align: center;
      }

      /* ─── Chat Panel ────────────────────────────────────── */
      .chat-panel {
        position: fixed;
        bottom: 92px;
        right: 28px;
        z-index: 9999;
        width: 400px;
        max-width: calc(100vw - 40px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: opacity 0.25s ease, transform 0.25s ease;
        border: 1px solid #e2e8f0;
        font-family: inherit;
      }
      .chat-panel-hidden {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
        pointer-events: none;
      }

      /* ─── Header ────────────────────────────────────────── */
      .chat-header {
        background: linear-gradient(135deg, #1b5e3c 0%, #14462c 100%);
        color: white;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      .chat-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .chat-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .chat-header-name {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.2;
      }
      .chat-model-tag {
        background: rgba(255,255,255,0.2);
        font-size: 0.68rem;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 10px;
        margin-left: 5px;
        letter-spacing: 0.3px;
        vertical-align: middle;
      }
      .chat-header-sub {
        font-size: 0.75rem;
        opacity: 0.88;
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 2px;
      }
      .status-dot {
        font-size: 0.6rem;
      }
      .status-online  { color: #4ade80; }
      .status-offline { color: #f87171; }
      .status-checking { color: #fbbf24; animation: blink 1.2s infinite; }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

      .chat-header-btns {
        display: flex;
        gap: 6px;
      }
      .chat-icon-btn {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .chat-icon-btn:hover { background: rgba(255,255,255,0.28); }

      /* ─── Messages ──────────────────────────────────────── */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
        scroll-behavior: smooth;
      }
      .chat-messages::-webkit-scrollbar { width: 4px; }
      .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

      .chat-msg {
        max-width: 88%;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .chat-msg-user   { align-self: flex-end; align-items: flex-end; }
      .chat-msg-ai     { align-self: flex-start; align-items: flex-start; }

      .chat-bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 0.875rem;
        line-height: 1.55;
        word-break: break-word;
      }
      .chat-bubble-user {
        background: #1b5e3c;
        color: #ffffff;
        border-bottom-right-radius: 4px;
      }
      .chat-bubble-ai {
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }

      /* Markdown-ish styling inside AI bubble */
      .chat-bubble-ai strong { font-weight: 700; color: #1b5e3c; }
      .chat-bubble-ai em { font-style: italic; color: #475569; }
      .chat-bubble-ai ul { margin: 6px 0 6px 16px; padding: 0; }
      .chat-bubble-ai li { margin-bottom: 4px; }
      .chat-bubble-ai h3, .chat-bubble-ai h4 {
        margin: 10px 0 4px;
        font-size: 0.9rem;
        color: #1b5e3c;
      }

      .chat-timestamp {
        font-size: 0.68rem;
        color: #94a3b8;
        padding: 0 4px;
      }

      /* Typing indicator */
      .chat-typing-bubble {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 12px 16px;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        display: flex;
        gap: 5px;
        align-items: center;
      }
      .typing-dot {
        width: 8px;
        height: 8px;
        background: #94a3b8;
        border-radius: 50%;
        animation: typing-bounce 1.2s infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing-bounce {
        0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
        40% { transform: scale(1.4); opacity: 1; }
      }

      /* ─── Quick Prompts ─────────────────────────────────── */
      .chat-quick-prompts {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 8px 14px 6px;
        background: #ffffff;
        border-top: 1px solid #f1f5f9;
        flex-shrink: 0;
        scrollbar-width: none;
      }
      .chat-quick-prompts::-webkit-scrollbar { display: none; }
      .qp-chip {
        white-space: nowrap;
        background: #f0fdf4;
        border: 1px solid #86efac;
        color: #166534;
        padding: 5px 11px;
        border-radius: 16px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .qp-chip:hover { background: #dcfce7; border-color: #4ade80; }

      /* ─── Input ─────────────────────────────────────────── */
      .chat-input-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 10px 14px;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      .chat-textarea {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 9px 12px;
        font-size: 0.875rem;
        font-family: inherit;
        resize: none;
        outline: none;
        line-height: 1.4;
        max-height: 120px;
        overflow-y: auto;
        transition: border-color 0.15s;
        color: #0f172a;
        background: #f8fafc;
      }
      .chat-textarea:focus { border-color: #1b5e3c; background: #ffffff; }
      .chat-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        border: none;
        background: #1b5e3c;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .chat-send-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
      .chat-send-btn:not(:disabled):hover { background: #2e885b; }

      .chat-footer-note {
        text-align: center;
        font-size: 0.7rem;
        color: #94a3b8;
        padding: 6px 14px 10px;
        background: #ffffff;
        flex-shrink: 0;
        line-height: 1.3;
      }

      /* Mobile adjustments */
      @media (max-width: 480px) {
        .chat-panel {
          right: 12px;
          bottom: 84px;
          width: calc(100vw - 24px);
          height: calc(100vh - 110px);
        }
        #chatLaunchBtn {
          right: 14px;
          bottom: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Render a markdown-lite formatted message ───────────────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^---$/gm, '<hr style="border:0;border-top:1px solid #e2e8f0;margin:8px 0;">')
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // ── Append a message bubble ────────────────────────────────────────────────
  function appendMessage(role, content, streaming = false) {
    const messagesEl = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg chat-msg-${role === 'user' ? 'user' : 'ai'}`;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;

    if (streaming) {
      bubble.id = 'streamingBubble';
      bubble.textContent = '';
    } else if (role === 'user') {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }

    const ts = document.createElement('div');
    ts.className = 'chat-timestamp';
    ts.textContent = now;

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(ts);
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  // ── Show typing indicator ──────────────────────────────────────────────────
  function showTyping() {
    const messagesEl = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'chatTypingIndicator';
    typingDiv.className = 'chat-msg chat-msg-ai';
    typingDiv.innerHTML = `
      <div class="chat-typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('chatTypingIndicator');
    if (el) el.remove();
  }

  // ── Check LM Studio health ─────────────────────────────────────────────────
  async function checkLLMHealth() {
    const dot  = document.getElementById('chatStatusDot');
    const text = document.getElementById('chatStatusText');
    try {
      const res = await fetch('/api/chat/health');
      const data = await res.json();
      if (data.bonsai_ready) {
        llmOnline = true;
        dot.className = 'status-dot status-online';
        text.textContent = 'Bonsai 27B · Ready';
        document.getElementById('chatSendBtn').disabled = false;
        return true;
      } else {
        dot.className = 'status-dot status-offline';
        text.textContent = 'Model not found in LM Studio';
      }
    } catch (e) {
      dot.className = 'status-dot status-offline';
      text.textContent = 'LM Studio offline';
    }
    llmOnline = false;
    return false;
  }

  // ── Render welcome message ─────────────────────────────────────────────────
  function renderWelcome() {
    const el = document.getElementById('chatMessages');
    el.innerHTML = '';
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg chat-msg-ai';
    bubble.innerHTML = `
      <div class="chat-bubble chat-bubble-ai">
        👋 <strong>Hello! I'm Dr. Nephro</strong>, your AI assistant powered by <strong>Bonsai 27B</strong> (Bionic LM Studio).<br><br>
        I'm here to help you understand your child's <strong>Nephrotic Syndrome</strong> — dipstick results, medications, diet, red flags, and more.<br><br>
        <em>I work alongside Dr. Swarnim's team at AIIMS Patna. For clinical decisions, always consult your doctor.</em>
      </div>`;
    el.appendChild(bubble);
  }

  // ── Render quick prompt chips ──────────────────────────────────────────────
  function renderQuickPrompts() {
    const container = document.getElementById('chatQuickPrompts');
    container.innerHTML = '';
    QUICK_PROMPTS.forEach(qp => {
      const chip = document.createElement('button');
      chip.className = 'qp-chip';
      chip.textContent = qp.label;
      chip.onclick = () => {
        document.getElementById('chatInput').value = qp.text;
        NephroChat.send();
      };
      container.appendChild(chip);
    });
  }

  // ── Send message & stream response ────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || isStreaming) return;

    // Hide quick prompts after first real message
    document.getElementById('chatQuickPrompts').style.display = 'none';

    // Append user bubble
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Clear input
    const input = document.getElementById('chatInput');
    input.value = '';
    input.style.height = 'auto';

    isStreaming = true;
    document.getElementById('chatSendBtn').disabled = true;
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          stream: true
        })
      });

      removeTyping();

      if (!res.ok) {
        const err = await res.json();
        appendMessage('assistant', `⚠️ Error: ${err.error || 'Unable to get response from Bonsai.'}`);
        isStreaming = false;
        document.getElementById('chatSendBtn').disabled = false;
        return;
      }

      // Streaming bubble
      const streamBubble = appendMessage('assistant', '', true);
      let fullText = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              streamBubble.innerHTML = renderMarkdown(fullText) + '<span style="color:#1b5e3c; font-size:0.8rem;">▌</span>';
              const msgs = document.getElementById('chatMessages');
              msgs.scrollTop = msgs.scrollHeight;
            }
          } catch (_) {}
        }
      }

      // Finalise bubble
      streamBubble.innerHTML = renderMarkdown(fullText);
      conversationHistory.push({ role: 'assistant', content: fullText });

    } catch (err) {
      removeTyping();
      appendMessage('assistant', `⚠️ Connection error: ${err.message}. Please ensure Bionic LM Studio is running at http://localhost:1234.`);
    } finally {
      isStreaming = false;
      if (llmOnline) {
        document.getElementById('chatSendBtn').disabled = false;
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.NephroChat = {
    isOpen: false,

    toggle() {
      const panel = document.getElementById('chatPanel');
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        panel.classList.remove('chat-panel-hidden');
        document.getElementById('chatInput').focus();
        document.getElementById('chatUnreadBadge').style.display = 'none';
        if (!llmOnline) checkLLMHealth();
      } else {
        panel.classList.add('chat-panel-hidden');
      }
    },

    send() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (text) sendMessage(text);
    },

    clearHistory() {
      if (!confirm('Clear the chat conversation?')) return;
      conversationHistory = [];
      renderWelcome();
      renderQuickPrompts();
      document.getElementById('chatQuickPrompts').style.display = 'flex';
    }
  };

  // ── Keyboard handlers ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectCSS();
    buildWidget();
    renderWelcome();
    renderQuickPrompts();
    checkLLMHealth();

    const input = document.getElementById('chatInput');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        NephroChat.send();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      document.getElementById('chatSendBtn').disabled = !input.value.trim() || !llmOnline || isStreaming;
    });

    // Re-check LLM health every 30 seconds
    setInterval(checkLLMHealth, 30000);
  });

})();
