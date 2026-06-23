import React, { useState, useEffect } from 'react';
import { Plus, Award, UserCheck, Vote, ShieldCheck, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { Employee } from '../types';

interface Candidate {
  id: string;
  name: string;
  sector: string;
  votes: number;
  isElected: boolean;
}

interface Voter {
  id: string;
  employeeId: string;
  employeeName: string;
  votedAt: string;
  sector?: string;
}

export default function CipaElectionTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  
  // Create Candidate state
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('');
  
  // Vote State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeePin, setEmployeePin] = useState('');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/cipa/candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVoters = async () => {
    try {
      const res = await fetch('/api/cipa/voters');
      const data = await res.json();
      setVoters(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data.filter((e: Employee) => e.status === 'Ativo'));
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCandidates(), fetchVoters(), fetchEmployees()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
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

  const openVoteModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSelectedEmployeeId('');
    setEmployeePin('');
    setSearchEmployeeQuery('');
    setShowVoteModal(true);
  };

  const handleSecureVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedEmployeeId || !employeePin) {
      Swal.fire({
        title: 'Atenção!',
        text: 'Selecione seu nome e insira seu PIN de segurança.',
        icon: 'warning',
        customClass: { popup: 'swal-modern-popup' }
      });
      return;
    }

    try {
      const res = await fetch('/api/cipa/vote-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          pin: employeePin,
          candidateId: selectedCandidate.id
        })
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: 'Voto Confirmado!',
          text: data.message || 'Seu voto foi registrado com sucesso de forma secreta.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowVoteModal(false);
        setSelectedCandidate(null);
        setSelectedEmployeeId('');
        setEmployeePin('');
        await Promise.all([fetchCandidates(), fetchVoters()]);
      } else {
        Swal.fire({
          title: 'Falha na Validação',
          text: data.error || 'Não foi possível registrar seu voto. Verifique seus dados.',
          icon: 'error',
          customClass: { popup: 'swal-modern-popup' }
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: 'Erro no Sistema',
        text: 'Erro de conexão com o servidor.',
        icon: 'error',
        customClass: { popup: 'swal-modern-popup' }
      });
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Zerar Urna?',
      text: 'Isso limpará todos os votos acumulados e a lista de eleitores participando!',
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
            text: 'Todas as contagens e a lista de votantes foram resetadas.',
            icon: 'success',
            customClass: { popup: 'swal-modern-popup' }
          });
          await Promise.all([fetchCandidates(), fetchVoters()]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchEmployeeQuery.toLowerCase();
    const matchesSearch = emp.name.toLowerCase().includes(term) || emp.cpf.includes(term) || (emp.matricula && emp.matricula.toLowerCase().includes(term));
    const alreadyVoted = voters.some(v => v.employeeId === emp.id);
    return matchesSearch && !alreadyVoted;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase">Processo Eleitoral CIPA-A</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Urna digital criptografada, com voto secreto e prevenção de votos duplicados via PIN</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial text-[11px] font-black px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl transition cursor-pointer"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[11px] font-bold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-primary" />
              <span>Painel de Candidatos</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onClick={() => openVoteModal(cand)}
                      className="flex items-center gap-1.5 text-[11px] font-black bg-brand-primary text-white hover:bg-brand-primary-dark px-4 py-2 rounded-xl transition cursor-pointer shadow-sm hover:shadow-md"
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
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Eleitores Participantes ({voters.length})</span>
            </h4>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Comprovante de Auditoria</span>
                <span className="text-[9px] text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  Voto Secreto Garantido
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {voters.map((v) => (
                  <div key={v.id} className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 leading-none">{v.employeeName}</div>
                      <div className="text-slate-450 text-[10px] font-semibold flex items-center gap-1">
                        <span>{v.sector || 'Fábrica'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 inline text-slate-400" />
                          {new Date(v.votedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-100 font-mono font-bold px-2 py-1 rounded">
                      REGISTRADO
                    </div>
                  </div>
                ))}
                {voters.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-medium px-4">
                    Nenhum colaborador votou até o momento.
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {showVoteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-base">Validação de Voto Seguro</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Identifique-se com seu PIN para computar o voto</p>
                </div>
              </div>
              <button onClick={() => setShowVoteModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleSecureVote} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-[9px] uppercase font-mono font-black text-emerald-800 tracking-wider">Candidato Selecionado</span>
                <div className="font-bold text-slate-800 text-[13px]">{selectedCandidate.name}</div>
                <div className="text-[10px] text-emerald-700 font-medium">{selectedCandidate.sector}</div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600">Busque seu nome na lista</label>
                <input
                  type="text"
                  placeholder="Pesquise por Nome, CPF ou Matrícula..."
                  value={searchEmployeeQuery}
                  onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px] mb-2"
                />
                
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px] bg-white max-h-[120px]"
                >
                  <option value="">-- Selecione seu Nome --</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.sector} - Matrícula: {emp.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600">Digite seu PIN de Acesso (4-6 dígitos)</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={employeePin}
                  onChange={(e) => setEmployeePin(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-widest text-center border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-brand-primary text-[16px] font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowVoteModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmployeeId || !employeePin}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
                >
                  Confirmar Meu Voto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
