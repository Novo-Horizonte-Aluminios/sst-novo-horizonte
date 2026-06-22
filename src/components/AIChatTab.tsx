import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, HelpCircle, User, Bot, AlertCircle, Volume2, VolumeX } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: 'Olá! Sou o **Especialista IA SST**, treinado sob as Normas Regulamentadoras brasileiras (NRs de 01 a 38), portarias do Ministério do Trabalho e regras de conformidade da eSocial.\n\nComo posso apoiar sua equipe de segurança do trabalho hoje?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (messageId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingId === messageId) {
        setSpeakingId(null);
        return;
      }
    }

    // Strip markdown formatting out
    const cleanText = text.replace(/\*\*|__/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.onend = () => {
      setSpeakingId(null);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-scroll to bot responses
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor de Inteligência Artificial.');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: 'msg_b_' + Date.now(),
        role: 'assistant',
        content: data.text || 'Desculpe, não consegui raciocinar sobre as normas de SST para este termo.'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setErrorMessage('Erro de comunicação: Certifique-se de que a GEMINI_API_KEY está configurada adequadamente em seu painel de Segredos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Quais os deveres do trabalhador conforme a NR-06?',
    'Como proceder se o CA do fabricante vencer?',
    'O que muda na transição do PPRA (NR-9) para o PGR (NR-1)?',
    'NR-35 exige Análise de Risco (AR) escrita?'
  ];

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden flex flex-col h-[650px] text-xs">
      {/* Tab Header bar */}
      <div className="bg-slate-950 text-white p-3.5 flex justify-between items-center shrink-0 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="bg-safety-green p-1.5 rounded text-white">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-tight">Especialista IA SST (Normas Regulamentadoras)</h3>
            <span className="text-[9px] font-mono text-safety-green font-bold block mt-0.5 uppercase tracking-wider leading-none">
              Gemini Integrated Agent
            </span>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-450 font-mono hidden sm:block">
          <span>Modelo Consignado: gemini-2.5-flash</span>
        </div>
      </div>

      {/* Main chat log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 min-h-0 text-slate-705">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={m.id} 
              className={`flex gap-2.5 max-w-2xl text-[11px] leading-relaxed animate-fade-in ${
                isUser ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`p-1.5 rounded h-8 w-8 shrink-0 flex items-center justify-center border ${
                isUser ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-safety-green/10 text-safety-green border-safety-green/20'
              }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-safety-green" />}
              </div>

              <div className={`p-3 rounded border relative group/bubble ${
                isUser 
                  ? 'bg-slate-900 text-white border-slate-800' 
                  : 'bg-white text-slate-800 border-slate-200 shadow-sm'
              }`}>
                {/* Formatted body rendering */}
                <p className="whitespace-pre-wrap font-sans font-normal leading-relaxed text-[11.5px] pr-5">
                  {m.content}
                </p>

                {/* Speech Synthesis Trigger */}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(m.id, m.content)}
                    className="absolute right-1 top-1 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={speakingId === m.id ? "Parar áudio" : "Ouvir com voz especializada"}
                  >
                    {speakingId === m.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 max-w-xs animate-pulse text-slate-600">
            <div className="p-1.5 bg-safety-green/10 text-safety-green rounded h-8 w-8 flex items-center justify-center border border-safety-green/20">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200 shadow-sm flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-safety-green" />
              <span className="text-[10px] font-bold text-slate-400 font-mono">Analisando Normas do MTE...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 rounded border border-red-200 flex gap-1.5 text-red-700 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested prompts / shortcuts */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1 shrink-0 text-slate-600">
        <span className="text-[8px] font-mono font-bold uppercase tracking-wider block w-full mb-1 text-slate-400">Sugestões de Perguntas Rápidas</span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="text-[9.5px] bg-slate-100 hover:bg-slate-200 hover:text-slate-800 border border-slate-300 rounded px-2.5 py-1 font-bold transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Inputs container */}
      <div className="p-3 border-t border-slate-200 bg-white flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Escreva sua consulta sobre EPI, CA, FISPQ ou Normas Regulamentadoras (e.g. NR-35)..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-safety-green text-xs text-slate-805"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
          className="bg-safety-green hover:bg-safety-green-dark text-white font-bold px-3.5 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed transition uppercase text-[10px] tracking-wider cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}

