import React, { useState, useEffect } from 'react';
import { Plus, Award, UserCheck, Flame, Vote } from 'lucide-react';
import Swal from 'sweetalert2';

interface Candidate {
  id: string;
  name: string;
  sector: string;
  votes: number;
  isElected: boolean;
}

export default function CipaElectionTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/cipa/candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchCandidates();
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSector) return;

    try {
      const res = await fetch('/api/cipa/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, sector: newSector })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Candidato inscrito com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setNewName('');
        setNewSector('');
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/cipa/vote/${id}`, { method: 'POST' });
      if (res.ok) {
        Swal.fire({
          title: 'Voto Registrado!',
          text: 'Votação computada no banco eletrônico.',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
          customClass: { popup: 'swal-modern-popup' }
        });
        fetchCandidates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Zerar Urna?',
      text: 'Isso limpará todos os votos acumulados dos candidatos atuais!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Zerar Votação',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal-modern-popup', confirmButton: 'swal-modern-confirm', cancelButton: 'swal-modern-cancel' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/cipa/reset', { method: 'POST' });
        if (res.ok) {
          Swal.fire({
            title: 'Urna Zerada!',
            text: 'Todas as contagens foram resetadas.',
            icon: 'success',
            customClass: { popup: 'swal-modern-popup' }
          });
          fetchCandidates();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase">Processo Eleitoral CIPA-A</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Controle eletrônico de candidaturas, votações e representatividade</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial text-[11px] font-black px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl transition"
          >
            Zerar Urna
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrever Candidato</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {candidates.map((cand, idx) => (
            <div key={cand.id} className={`bg-white p-5 rounded-2xl border ${
              cand.isElected ? 'border-emerald-250 shadow-sm shadow-emerald-500/5' : 'border-slate-200'
            } flex flex-col justify-between transition-all relative overflow-hidden`}>
              {cand.isElected && (
                <div className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-200">
                  <Award className="w-4 h-4" />
                </div>
              )}
              
              <div className="space-y-3">
                <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest block">Posição: {idx + 1}º</span>
                <div>
                  <h4 className="font-black text-[14px] text-slate-800 leading-snug tracking-tight">{cand.name}</h4>
                  <p className="text-slate-450 text-[10px] font-bold">{cand.sector}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between font-mono font-bold">
                  <span className="text-slate-450 text-[9px] uppercase">Votos Computados</span>
                  <span className="text-base text-slate-800 font-black">{cand.votes}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                  cand.isElected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cand.isElected ? 'Eleito CIPA' : 'Suplente'}
                </span>
                
                <button
                  onClick={() => handleVote(cand.id)}
                  className="flex items-center gap-1 text-[11px] font-black bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Votar</span>
                </button>
              </div>
            </div>
          ))}
          {candidates.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-450 font-bold border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              Nenhum candidato inscrito para esta eleição.
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Inscrição Eleitoral de Candidato</h3>
                <p className="text-[10px] text-slate-400 mt-1">Registra novo funcionário elegível para CIPA-A</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateCandidate} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600">Nome do Candidato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Henrique Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600">Setor do Colaborador</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Usinagem"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition"
                >
                  Confirmar Candidatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
