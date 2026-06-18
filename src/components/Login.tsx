import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-safety-green/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-[#1e293b]/70 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl relative z-10 mx-4">
        {/* Header/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-safety-green/10 border border-safety-green/20 rounded-2xl mb-4 text-safety-green">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">
            Novo Horizonte
          </h2>
          <p className="text-safety-green text-sm font-semibold tracking-wider uppercase">
            Portal SST Interno
          </p>
          <p className="text-slate-400 text-xs mt-2 font-mono">
            Autenticação do SESMT & Compliance
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Nome de Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin ou marcos"
                className="w-full bg-[#0f172a] border border-slate-800 focus:border-safety-green/80 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Senha de Segurança
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-[#0f172a] border border-slate-800 focus:border-safety-green/80 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-600 font-medium"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-safety-green hover:bg-safety-green-dark text-white rounded-xl py-2.5 text-sm font-bold transition-all shadow-lg shadow-safety-green/20 hover:shadow-safety-green/35 flex justify-center items-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        {/* Info card footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Ambiente Monitorado • NR-01 & MTE Compliance
          </p>
        </div>
      </div>
    </div>
  );
}
