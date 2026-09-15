import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ShieldAlert, HeartPulse } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const AIHealthAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your MediSync AI Health Assistant. I can help explain medical terms, summarize reports, or suggest wellness adjustments. How can I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestions = [
    'Explain my prescription dosage',
    'What foods should I eat for high blood pressure?',
    'What questions should I ask my cardiologist?',
    'Explain what CBC test values mean'
  ];

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let botResponse = '';
      const query = text.toLowerCase();

      if (query.includes('prescription') || query.includes('dosage')) {
        botResponse = 'Standard prescription dosages represent morning-noon-night intervals (e.g. 1-0-1). Make sure to clarify with your pharmacist whether a medicine should be taken before or after meals. Never self-adjust antibiotic durations without clinical approval.';
      } else if (query.includes('blood pressure') || query.includes('foods')) {
        botResponse = 'For blood pressure regulation, consider a diet rich in potassium and low in sodium (like the DASH diet). Incorporate leafy greens, berries, oats, almonds, and reduce packaged or high-sodium foods. Ensure you drink 2.5-3.0 liters of water daily.';
      } else if (query.includes('cardiologist') || query.includes('ask')) {
        botResponse = 'When meeting your cardiologist, you might want to ask: \n1. What is my target blood pressure range? \n2. Are there specific physical activities I should avoid? \n3. Could my symptoms be related to my current medications? \n4. What indicators should trigger an emergency visit?';
      } else if (query.includes('cbc') || query.includes('test')) {
        botResponse = 'A Complete Blood Count (CBC) evaluates overall health. Key values include Hemoglobin (oxygen transport; normal 12-16 g/dL for women, 13.5-17.5 for men) and White Blood Cell count (infection fighting; normal 4,500-11,000 cells/mcL). Let me know if you want me to explain other test values!';
      } else {
        botResponse = "I can definitely help guide you. Please note that my response is assistive. To give you the best feedback, ensure you share specific symptoms or report values. I recommend discussing these pointers in detail during your next consultation.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="font-bold">Medical Assistive Disclaimer:</span>
          <p className="mt-0.5">
            AI-generated information is for general educational guidance only and does NOT replace professional medical advice, diagnosis, or clinical treatments. Always consult with a licensed physician regarding medical conditions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[550px]">
        {/* Left Suggestions Side (Col 1) */}
        <div className="space-y-3 hidden md:block">
          <Card title="Suggested Inquiries" subtitle="Click to ask assistant instantly" className="h-full">
            <div className="space-y-2">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  className="w-full text-left p-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl text-xs text-slate-700 font-medium transition-all block leading-snug"
                >
                  {sug}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat window (Col 2 & 3) */}
        <div className="md:col-span-2 flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">MediSync Medical Bot</h3>
                <span className="text-[9px] text-slate-400 font-medium">Assistant AI active</span>
              </div>
            </div>
          </div>

          {/* Messages Trail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                  msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                </div>
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                  </div>
                  <span className="block text-[8px] text-slate-400 text-right px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 py-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
            className="p-4 border-t border-slate-100 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about diet plans, clinical symptoms, test reports..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <Button type="submit" variant="primary" icon={Send} size="sm">
              Ask AI
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIHealthAssistant;
