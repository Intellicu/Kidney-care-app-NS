import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Send, ChevronLeft, Mic, Globe, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const QUICK_QUESTIONS_EN = [
  'What is nephrotic syndrome?',
  'How do I read the dipstick?',
  'What foods to avoid?',
  'When to go to hospital?',
  'Is school safe during remission?',
];

const QUICK_QUESTIONS_HI = [
  'नेफ्रोटिक सिंड्रोम क्या है?',
  'डिपस्टिक कैसे पढ़ें?',
  'कौन से खाने से बचें?',
  'अस्पताल कब जाएँ?',
  'रिमिशन में स्कूल जा सकते हैं?',
];

export default function NephroBot() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('hi');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);
  const hi = lang === 'hi';

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'nephrobot',
        metadata: { name: 'NephroBot Session', description: 'Patient support chat' }
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: hi
          ? '🙏 नमस्ते! मैं NephroBot हूँ — आपके बच्चे की किडनी की देखभाल में मदद करने के लिए। आप हिंदी या English में पूछ सकते हैं।\n\n⚠️ **ध्यान दें**: मैं जानकारी देता हूँ, डॉक्टर की जगह नहीं लेता। गंभीर समस्या होने पर **AIIMS Patna: 0612-2451070** पर कॉल करें।'
          : '🙏 Hello! I am NephroBot — here to help your family manage nephrotic syndrome. Ask me anything in Hindi or English.\n\n⚠️ **Note**: I provide information, not medical advice. For emergencies, call **AIIMS Patna: 0612-2451070**.'
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || !conversation || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    try {
      const updatedConv = await base44.agents.addMessage(conversation, { role: 'user', content: msg });
      const unsubscribe = base44.agents.subscribeToConversation(updatedConv.id, (data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
          const last = data.messages[data.messages.length - 1];
          if (last.role === 'assistant' && !last.streaming) {
            setIsLoading(false);
            unsubscribe();
          }
        }
      });
    } catch (e) {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: hi ? 'माफ करें, कुछ गड़बड़ हुई। फिर से कोशिश करें।' : 'Sorry, something went wrong. Please try again.' }]);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bot className="w-8 h-8 text-teal-600" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto mt-2" />
          <p className="text-gray-500 text-sm mt-2">Starting NephroBot...</p>
        </div>
      </div>
    );
  }

  const quickQs = hi ? QUICK_QUESTIONS_HI : QUICK_QUESTIONS_EN;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 pt-4 pb-3 text-white shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/">
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </Link>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm">NephroBot</h1>
            <p className="text-teal-100 text-xs">{hi ? 'किडनी Care सहायक' : 'Kidney Care Assistant'}</p>
          </div>
          <button
            onClick={() => setLang(hi ? 'en' : 'hi')}
            className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold"
          >
            <Globe className="w-3 h-3" />
            {hi ? 'EN' : 'हिं'}
          </button>
        </div>

        {/* Emergency strip */}
        <div className="mt-2 bg-red-500/30 border border-red-300/40 rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
          <p className="text-xs text-white/90">{hi ? 'Emergency: AIIMS Patna 0612-2451070' : 'Emergency: AIIMS Patna 0612-2451070'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1">
                <Bot className="w-4 h-4 text-teal-600" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
            }`}>
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <ReactMarkdown className="prose prose-sm max-w-none text-gray-800 [&_p]:mb-2 [&_strong]:font-bold">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center mr-2 shrink-0">
              <Bot className="w-4 h-4 text-teal-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick questions (only at start) */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-gray-400 text-center">{hi ? 'जल्दी पूछें' : 'Quick questions'}</p>
            {quickQs.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-sm bg-white border border-teal-100 text-teal-700 rounded-xl px-4 py-2.5 hover:bg-teal-50 transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="flex gap-2 items-end max-w-2xl mx-auto">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={hi ? 'अपना सवाल लिखें...' : 'Type your question...'}
              className="w-full bg-transparent text-sm text-gray-800 resize-none outline-none max-h-28"
              rows={1}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center shrink-0 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          {hi ? 'NephroBot जानकारी देता है, डॉक्टर की जगह नहीं लेता' : 'NephroBot gives info, not medical advice'}
        </p>
      </div>
    </div>
  );
}