import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { sendMessageToOpenRouter } from '../../services/chatbotService';
import logoImg from '../../assets/image/logo.png';

const generateId = () => 'msg-' + Math.random().toString(36).substring(2, 9);

export function ChatbotModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! 👋 I'm your **LandlordVision AI Assistant**. How can I help you today with our property management software, pricing plans, or landlord tools?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const starterQuestions = [
    'What is included in the Premium plan?',
    'How much do extra tenancies cost?',
    'Is there a 14-day free trial?',
    'How can I contact customer support?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText.trim();
    if (!query || isTyping) return;

    const userMessage = {
      id: generateId(),
      sender: 'user',
      text: query,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const responseText = await sendMessageToOpenRouter(updatedMessages);
      const assistantMessage = {
        id: generateId(),
        sender: 'assistant',
        text: responseText,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: 'assistant',
          text: 'Sorry, I ran into an error getting an answer. Please try asking again or contact our support team at **01925 357 355**.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to simple-render markdown bold and linebreaks
  const renderFormattedText = (text) => {
    const parts = text.split('\n');
    return parts.map((line, idx) => {
      // Convert **bold** to <strong>
      const boldFormatted = line.split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
        if (chunk.startsWith('**') && chunk.endsWith('**')) {
          return <strong key={cIdx}>{chunk.slice(2, -2)}</strong>;
        }
        return chunk;
      });

      return (
        <React.Fragment key={idx}>
          {boldFormatted}
          {idx < parts.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col h-[600px] max-h-[85vh] overflow-hidden transition-all relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CHATBOT HEADER */}
        <div className="bg-[#00a36f] p-4 text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#00a36f]" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base tracking-tight leading-none text-white">
                  LandlordVision Bot
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              </div>
              <p className="text-xs text-emerald-100/90 font-medium pt-0.5">
                AI Assistant &bull; Always Online
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close chatbot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-left">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : 'bg-[#00a36f] text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#00a36f] text-white rounded-tr-none font-medium'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none font-normal'
                }`}
              >
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00a36f] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-500 flex items-center gap-1.5 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00a36f]" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* STARTER QUESTIONS CHIPS (Only show if only welcome message exists) */}
          {messages.length === 1 && !isTyping && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Suggested Questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-xs text-slate-700 bg-white border border-gray-300 hover:border-[#00a36f] hover:text-[#00a36f] hover:bg-emerald-50/50 px-3 py-1.5 rounded-full transition-all text-left font-medium shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FOOTER */}
        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about LandlordVision..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              className="flex-1 h-11 px-4 text-xs sm:text-sm bg-slate-50 border border-gray-300 rounded-full focus:border-[#00a36f] focus:bg-white focus:ring-2 focus:ring-[#00a36f]/20 outline-none transition-all placeholder-gray-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="w-11 h-11 rounded-full bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 px-2">
            <span>Powered by OpenRouter &bull; LandlordVision AI</span>
            <img src={logoImg} alt="Logo" className="h-3.5 w-auto opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
