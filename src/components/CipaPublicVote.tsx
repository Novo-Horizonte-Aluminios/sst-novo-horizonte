import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ShieldCheck, CheckSquare, Fingerprint } from 'lucide-react';

export default function CipaPublicVote({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [votePin, setVotePin] = useState('');

  useEffect(() => {
    validateTokenAndLoad();
  }, [token]);

  const validateTokenAndLoad = async () => {
    try {
      const res = await fetch(`/api/cipa/validate-token?token=${token}`);
      if (!res.ok) {
        throw new Error('Token inválido ou expirado.');
      }
      const data = await res.json();
      
      if (!data.valid) {
        throw new Error('Acesso negado.');
      }
      if (!data.isAllowed) {
        const startStr = new Date(data.startsAt).toLocaleString('pt-BR');
        const endStr = new Date(data.endsAt).toLocaleString('pt-BR');
        throw new Error(`Fora do período de votação.\nInício: ${startStr}\nTérmino: ${endStr}`);
      }
      if (data.alreadyVoted) {
        throw new Error('Você já registrou seu voto nesta eleição.');
      }

      setValidatedData(data);

      const candRes = await fetch('/api/cipa/candidates');
      const candData = await candRes.json();
      // ── Embaralha a ordem para evitar viés pelo primeiro candidato ──
      const shuffled = [...candData].sort(() => Math.random() - 0.5);
      setCandidates(shuffled);
      
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados da eleição.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      Swal.fire({
        title: '⚠️ Opa, pera aí!',
        text: 'Selecione um candidato na lista acima para poder votar.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'rounded-3xl border border-slate-800 shadow-2xl' }
      });
      return;
    }
    if (!votePin.trim()) {
      Swal.fire({
        title: '⚠️ Quase lá!',
        text: 'A sua assinatura digital (PIN) é obrigatória.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Preencher PIN',
        customClass: { popup: 'rounded-3xl border border-slate-800 shadow-2xl' }
      });
      return;
    }

    try {
      const res = await fetch('/api/cipa/vote-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: validatedData.employee.id,
          candidateId: selectedCandidate,
          pin: votePin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        Swal.fire({
          title: '❌ Acesso Negado',
          text: data.error || 'Erro ao registrar voto.',
          icon: 'error',
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Tentar Novamente',
          customClass: { popup: 'rounded-3xl border border-slate-800 shadow-2xl' }
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: '✅ Voto Confirmado!',
        html: `<div class="text-sm mt-2">Comprovante Nº: <b class="text-emerald-400 tracking-wider">${data.receiptNumber}</b><br/>Data: ${new Date(data.timestamp).toLocaleString('pt-BR')}</div><div class="mt-4 text-xs text-slate-400">Obrigado por participar da segurança da nossa equipe! 🛡️</div>`,
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Fechar Sistema',
        customClass: { popup: 'rounded-3xl border border-emerald-900/30 shadow-2xl shadow-emerald-900/20' }
      }).then(() => {
        window.location.href = 'https://www.google.com';
      });

    } catch (e: any) {
      console.error(e);
      Swal.fire({
        title: '🔌 Ops!',
        text: e.message || 'Falha de conexão ou erro no servidor.',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Fechar',
        customClass: { popup: 'rounded-3xl border border-slate-800 shadow-2xl' }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400 font-medium tracking-wide animate-pulse">Carregando ambiente seguro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500"></div>
        
        <div className="p-6 pb-0 mb-4 text-center">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckSquare className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight uppercase">{validatedData?.election?.name || 'Eleições CIPA'}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Olá, <strong className="text-emerald-400">{validatedData.employee.name}</strong>.<br/>
            Bem-vindo(a) à Urna Virtual.
          </p>
        </div>

        <form onSubmit={handleVoteSubmit} className="p-6 pt-0 space-y-6">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                Selecione seu Candidato
              </label>
              <span className="text-[9px] text-slate-600 italic">Ordem sorteada aleatoriamente</span>
            </div>
            <div className={`grid gap-3 ${
              candidates.length === 1 ? 'grid-cols-1' :
              candidates.length === 2 ? 'grid-cols-2' :
              candidates.length <= 4 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {candidates.map((c, idx) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedCandidate(c.id)}
                  className={`flex flex-col items-center p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 relative ${
                    selectedCandidate === c.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20 scale-[1.03]' 
                      : 'border-slate-700 bg-slate-800/60 hover:border-emerald-400/50 hover:bg-slate-800'
                  }`}
                >
                  {selectedCandidate === c.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-black text-slate-300 mb-2 shadow-inner overflow-hidden border-2 border-slate-600">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-100 text-xs leading-tight">{c.name}</div>
                    {c.role && <div className="text-[9px] text-slate-400 mt-0.5">{c.role}</div>}
                    <div className="text-[9px] text-emerald-600 font-semibold tracking-wider uppercase mt-1">Candidato</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
              Sua Assinatura Digital (PIN)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Fingerprint className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                maxLength={4}
                value={votePin}
                onChange={(e) => setVotePin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 1234"
                className="w-full bg-[#070b13]/80 border border-slate-800 focus:border-emerald-500/80 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-mono tracking-widest text-center outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3.5 text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 uppercase tracking-wide cursor-pointer flex justify-center items-center gap-2"
          >
            Confirmar Voto
          </button>
        </form>
      </div>
    </div>
  );
}
