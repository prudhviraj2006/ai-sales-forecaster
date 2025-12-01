import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { chatWithAI } from '../services/api';

function ChatBot({ jobId, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    'Show next 6-month forecast',
    'Which product declining fastest?',
    'Explain seasonal trend',
    'Generate insights for top region'
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(jobId, text, messages);
      const aiMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg hover:scale-110 transition-all ${
          darkMode
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-xl'
        }`}
        title="Open AI Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isMinimized
          ? 'w-80 h-16'
          : 'w-96 h-[600px]'
      } ${
        darkMode
          ? 'bg-slate-800 border border-slate-700'
          : 'bg-white border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white`}>
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h3 className="font-semibold">Sales Insights AI</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {messages.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="mb-4 font-semibold">How can I help?</p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className={`block w-full text-sm p-2 rounded text-left hover:opacity-80 transition ${
                        darkMode
                          ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.role === 'user'
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-slate-700 text-gray-200'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`border-t p-3 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                placeholder="Ask about forecast..."
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500'
                }`}
              />
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-lg transition ${
                  input.trim() && !loading
                    ? darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatBot;
