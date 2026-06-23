import React, { useState } from 'react';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { id: string; username: string; name: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer login.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas ou erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070b13] relative overflow-hidden font-sans">
      {/* Dynamic Animated Glowing Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#15803d]/5 blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-[#0f172a]/75 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl relative z-10 mx-4 overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500"></div>

        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Brand Logo Container */}
          <div className="relative group mb-5">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 opacity-30 blur-sm group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center p-3 shadow-inner">
              <img 
                src="/logo_square.png" 
                alt="Novo Horizonte Alumínios" 
                className="w-full h-full object-contain filter drop-shadow-md"
                onError={(e) => {
                  // Fallback to text icon if logo fails to render
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fb = document.getElementById('logo-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div id="logo-fallback" className="hidden w-full h-full items-center justify-center text-emerald-500">
                <ShieldCheck className="w-12 h-12" />
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">
            Novo Horizonte
          </h2>
          <p className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase mt-0.5">
            Segurança e Saúde no Trabalho
          </p>
          <div className="mt-2.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] text-emerald-300 font-semibold uppercase tracking-wider font-mono">
            Portal SST Interno
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex gap-2.5 items-start animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
              Nome de Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin ou marcos"
                className="w-full bg-[#070b13]/80 border border-slate-800 focus:border-emerald-500/80 text-white rounded-xl py-3 pl-11 pr-4 text-xs outline-none transition-all placeholder:text-slate-600 dark:text-slate-300 font-medium"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#070b13]/80 border border-slate-800 focus:border-emerald-500/80 text-white rounded-xl py-3 pl-11 pr-4 text-xs outline-none transition-all placeholder:text-slate-600 dark:text-slate-300 font-medium"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/25 flex justify-center items-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        {/* Info card footer */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 text-center flex flex-col items-center">
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono tracking-tight leading-none uppercase">
            Ambiente Seguro • NR-01 & MTE Compliance
          </p>
        </div>
      </div>
    </div>
  );
}

