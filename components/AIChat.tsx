import React, { useState } from 'react';
import { getFinancialAdvice } from '../services/gemini';
import { MessageCircle, X, Send } from 'lucide-react';

interface AIChatProps {
    balance: number;
}

export const AIChat: React.FC<AIChatProps> = ({ balance }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        {role: 'model', text: 'Hi! I am your Royal Investment Assistant. Ask me anything about your earnings!'}
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if(!input.trim()) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
        setLoading(true);

        const response = await getFinancialAdvice(userMsg, balance);
        setMessages(prev => [...prev, {role: 'model', text: response}]);
        setLoading(false);
    };

    return (
        <>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 right-4 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-transform hover:scale-110 z-30 border-2 border-white"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-20 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-30 flex flex-col overflow-hidden animate-slide-up h-96">
                    <div className="bg-[#2c1810] p-4 text-white flex justify-between items-center border-b border-amber-600">
                        <span className="font-bold flex items-center"><MessageCircle size={18} className="mr-2"/> Royal Assistant</span>
                        <button onClick={() => setIsOpen(false)}><X size={18}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50/30">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                    m.role === 'user' 
                                    ? 'bg-amber-600 text-white rounded-br-none shadow-md' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-500 border border-gray-200 p-2 rounded-lg text-xs italic">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask for advice..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-amber-500 bg-gray-50"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading}
                            className="bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};