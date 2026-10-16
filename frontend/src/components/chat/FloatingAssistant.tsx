'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Database,
  RefreshCw,
  CheckCircle2,
  Bot,
  User,
  Shield,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  entities?: string[];
  retrievedFacts?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Give me project overview',
  'What systems exist in FalkorDB?',
  'Investigate Event E-101',
  'Show incident timeline',
  'What does this project do?',
];

export function FloatingAssistant() {
  const { backendUrl, falkorDbStatus } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hello! I am **ThreatNexus**, your autonomous threat intelligence assistant connected live to **FalkorDB** (`127.0.0.1:6379`).\n\nI answer queries with **zero hallucinations**, grounded strictly on ground-truth graph nodes and incident records. Ask me anything about your project, systems, or incidents!",
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = `${backendUrl}/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          agent_mode: 'deterministic',
          save_memory: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.response || 'No response returned from graph reasoner.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entities: data.matching_entities?.map((e: any) => e.display_name || e.id || e.label) || [],
        retrievedFacts: data.retrieved_facts || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Error:** Could not contact graph chat service at \`${backendUrl}/chat\` (${err.message}). Ensure FastAPI server is running on port 8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill in Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(8, 20, 36, 0.95), rgba(4, 12, 24, 0.95))',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 16px rgba(6, 182, 212, 0.3)',
          }}
          title="Open ThreatNexus AI Assistant connected to live FalkorDB"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg overflow-hidden border border-cyan-400/40 shrink-0">
            <img src="/threatnexus-logo.jpg" alt="ThreatNexus Logo" className="w-full h-full object-cover" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>ThreatNexus Assistant</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                FalkorDB
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Ask anything with zero hallucinations</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)] rounded-2xl flex flex-col overflow-hidden border shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(7, 12, 24, 0.97) 0%, rgba(3, 7, 18, 0.98) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            boxShadow: '0 20px 50px 0 rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.15)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
                <img src="/threatnexus-logo.jpg" alt="ThreatNexus Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>ThreatNexus Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span>127.0.0.1:6379</span>
                  <span className="text-slate-500">•</span>
                  <span>{falkorDbStatus?.nodeCount || 102} Nodes</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Zero Hallucinations</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'assistant',
                      text: "👋 Chat reset. Ask me anything about your project, systems, or incidents!",
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-md overflow-hidden border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <img src="/threatnexus-logo.jpg" alt="ThreatNexus" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-bl-none shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs break-words space-y-1">
                    {m.text}
                  </div>

                  {/* Retrieved Entities Badges */}
                  {m.entities && m.entities.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                      <span className="text-[10px] text-cyan-400/80 font-mono">Matched:</span>
                      {m.entities.slice(0, 5).map((ent, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-right mt-1 opacity-60 font-mono">
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-700/60 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs py-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot size={13} className="text-cyan-300" />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/5">
                  <RefreshCw size={12} className="animate-spin text-cyan-400" />
                  <span className="text-[11px] font-mono text-cyan-300">
                    Traversing FalkorDB knowledge graph...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 border-t border-white/5 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(suggestion)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono text-cyan-300/90 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/25 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-slate-900/60 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g. project overview, systems)..."
              disabled={isLoading}
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/50 font-sans transition-all"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
              title="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
