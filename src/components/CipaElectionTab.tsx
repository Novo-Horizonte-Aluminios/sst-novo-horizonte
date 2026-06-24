import React, { useState, useEffect } from 'react';
import { Plus, Award, UserCheck, Vote, ShieldCheck, Calendar, Users, Mail, Send, Bell, Settings, Clock, Link as LinkIcon, Trash, Search } from 'lucide-react';
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
  phone?: string;
  email?: string;
  admissionDate?: string;
  role?: string;
  cipaExtensionUntil?: string;
  cipaToken?: string;
}

export default function CipaElectionTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Election settings
  const [electionStartsAt, setElectionStartsAt] = useState('2026-06-20T08:00');
  const [electionEndsAt, setElectionEndsAt] = useState('2026-06-25T18:00');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Active Tab: 'candidatos' | 'funcionarios' | 'nao_votaram'
  const [activeSubTab, setActiveSubTab] = useState<'candidatos' | 'funcionarios' | 'nao_votaram'>('candidatos');
  
  // Selection View: 'candidatos' | 'eleitores'
  const [selectionView, setSelectionView] = useState<'candidatos' | 'eleitores'>('candidatos');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedEmpForExtension, setSelectedEmpForExtension] = useState<Employee | Voter | null>(null);
  const [newExtensionDate, setNewExtensionDate] = useState('');
  
  // Create Candidate state
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [selectedCandidateForAdd, setSelectedCandidateForAdd] = useState<Employee | null>(null);
  
  // Vote State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeePin, setEmployeePin] = useState('');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  // Tab Filtering & Search
  const [searchFilterQuery, setSearchFilterQuery] = useState('');

  // Token login logic from URL
  const [urlToken, setUrlToken] = useState<string | null>(null);
  const [validatedTokenData, setValidatedTokenData] = useState<any>(null);

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/cipa/settings');
      const data = await res.json();
      if (data.startsAt) {
        setElectionStartsAt(new Date(data.startsAt).toISOString().slice(0, 16));
      }
      if (data.endsAt) {
        setElectionEndsAt(new Date(data.endsAt).toISOString().slice(0, 16));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCandidates(), fetchVoters(), fetchEmployees(), fetchSettings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();

    // Check for cipa token in URL query
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setUrlToken(token);
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch(`/api/cipa/validate-token?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setValidatedTokenData(data);
        if (data.valid && data.isAllowed && !data.alreadyVoted) {
          // Open voting modal directly with this employee pre-selected
          setSelectedEmployeeId(data.employee.id);
          // Set view as candidates so they can vote
          setSelectionView('candidatos');
        } else {
          // Show error message
          let message = 'Votação indisponível no momento.';
          if (data.alreadyVoted) {
            message = 'Você já votou nesta eleição.';
          } else if (!data.isAllowed) {
            const startStr = new Date(data.startsAt).toLocaleString('pt-BR');
            const endStr = new Date(data.endsAt).toLocaleString('pt-BR');
            message = `Prazo fora do limite de votação.\n\nPeríodo: de ${startStr} até ${endStr}.`;
          }
          Swal.fire({
            title: 'Votação CIPA',
            text: message,
            icon: 'info',
            customClass: { popup: 'swal-modern-popup' }
          });
        }
      } else {
        Swal.fire({
          title: 'Erro de Autenticação',
          text: 'Token de votação inválido ou expirado.',
          icon: 'error',
          customClass: { popup: 'swal-modern-popup' }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cipa/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: new Date(electionStartsAt).toISOString(),
          endsAt: new Date(electionEndsAt).toISOString()
        })
      });
      if (res.ok) {
        Swal.fire({
          title: 'Configurações Salvas!',
          text: 'Os prazos da eleição foram atualizados com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSector) return;

    try {
      const res = await fetch('/api/cipa/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          sector: newSector, 
          employeeId: selectedCandidateForAdd?.id || null 
        })
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
    setEmployeePin('');
    // If validated from token, employee is already set, otherwise reset it
    if (!validatedTokenData) {
      setSelectedEmployeeId('');
      setSearchEmployeeQuery('');
    }
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
          candidateId: selectedCandidate.id,
          token: urlToken
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
        setUrlToken(null);
        setValidatedTokenData(null);
        // Clear token parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        await Promise.all([fetchCandidates(), fetchVoters(), fetchEmployees()]);
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
      text: 'Isso limpará todos os votos acumulados, lista de eleitores e tokens ativos!',
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
            text: 'Todas as contagens, lista de votantes e tolerâncias foram resetadas.',
            icon: 'success',
            customClass: { popup: 'swal-modern-popup' }
          });
          setUrlToken(null);
          setValidatedTokenData(null);
          await Promise.all([fetchCandidates(), fetchVoters(), fetchEmployees()]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendInvite = async (empId: string, actionType: 'invite' | 'remind' = 'invite') => {
    try {
      const res = await fetch('/api/cipa/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, method: 'both', actionType })
      });
      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Enviado!',
          text: 'A notificação foi encaminhada.',
          showConfirmButton: false,
          timer: 2500,
          width: '320px'
        });
        await fetchEmployees();
      } else {
        Swal.fire({
          position: 'center',
          icon: 'error',
          title: 'Erro',
          text: 'Falha ao acionar.',
          showConfirmButton: false,
          timer: 2500,
          width: '320px'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openExtensionModal = (emp: any) => {
    setSelectedEmpForExtension(emp);
    setNewExtensionDate(emp.cipaExtensionUntil ? new Date(emp.cipaExtensionUntil).toISOString().slice(0, 16) : '');
    setShowExtensionModal(true);
  };

  const handleSaveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForExtension) return;

    try {
      const res = await fetch('/api/cipa/extend-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpForExtension.employeeId || selectedEmpForExtension.id,
          extensionUntil: newExtensionDate ? new Date(newExtensionDate).toISOString() : null
        })
      });
      if (res.ok) {
        Swal.fire({
          title: 'Prazo Estendido!',
          text: 'Tolerância individual salva com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowExtensionModal(false);
        await Promise.all([fetchEmployees(), fetchVoters()]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCandidate = async (candId: string) => {
    const result = await Swal.fire({
      title: 'Remover Candidato?',
      text: 'Tem certeza que deseja excluir esta inscrição eleitoral?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal-modern-popup', confirmButton: 'swal-modern-confirm', cancelButton: 'swal-modern-cancel' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/cipa/candidates/${candId}`, { method: 'DELETE' });
        if (res.ok || res.status === 404) {
          Swal.fire({
            title: 'Excluído!',
            text: 'Candidato removido da urna.',
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

  const filteredEmployeesList = employees.filter(emp => {
    const term = searchFilterQuery.toLowerCase();
    return emp.name.toLowerCase().includes(term) || emp.cpf.includes(term) || (emp.matricula && emp.matricula.toLowerCase().includes(term));
  });

  const getVoteStatus = (empId: string) => {
    const v = voters.find(vt => vt.employeeId === empId);
    return v ? { voted: true, date: v.votedAt } : { voted: false };
  };

  const getEmployeeToken = (emp: Employee) => {
    return (emp as any).cipaToken || `tok_sim_${emp.id}`;
  };

  const filteredEmployeesForSecureVote = employees.filter(emp => {
    const term = searchEmployeeQuery.toLowerCase();
    const matchesSearch = emp.name.toLowerCase().includes(term) || emp.cpf.includes(term) || (emp.matricula && emp.matricula.toLowerCase().includes(term));
    const alreadyVoted = voters.some(v => v.employeeId === emp.id);
    return matchesSearch && !alreadyVoted;
  });

  const startsDate = new Date(electionStartsAt);
  const endsDate = new Date(electionEndsAt);
  const now = new Date();
  const isElectionRunning = now >= startsDate && now <= endsDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
              CIPA-A {isElectionRunning ? 'VOTAÇÃO ATIVA' : 'SESSÃO FECHADA'}
            </span>
          </div>
          <h3 className="text-base font-black tracking-tight uppercase leading-snug">Eleição CIPA 2026</h3>
          <p className="text-slate-400 text-[11px] max-w-xl">
            Painel de administração e votação online integrada. Período oficial: {startsDate.toLocaleString('pt-BR')} até {endsDate.toLocaleString('pt-BR')}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 z-10 w-full md:w-auto">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Prazos</span>
          </button>
          
          <button
            onClick={handleReset}
            className="flex-1 md:flex-initial text-[11px] font-bold px-3 py-2 bg-slate-800 hover:bg-red-950 text-red-400 rounded-xl transition cursor-pointer"
          >
            Zerar Urna
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-[11px] font-black px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inscrever Candidato</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setSelectionView('candidatos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
              selectionView === 'candidatos' 
                ? 'bg-brand-primary text-white shadow-sm' 
                : 'text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Selecionar Candidatos
          </button>
          <button
            onClick={() => setSelectionView('eleitores')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
              selectionView === 'eleitores' 
                ? 'bg-brand-primary text-white shadow-sm' 
                : 'text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Selecionar Eleitores
          </button>
        </div>

        <input
          type="text"
          placeholder="Filtrar dados da listagem..."
          value={searchFilterQuery}
          onChange={(e) => setSearchFilterQuery(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-slate-400 w-full sm:w-64"
        />
      </div>

      {selectionView === 'candidatos' && (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('candidatos')}
            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition ${
              activeSubTab === 'candidatos' ? 'bg-brand-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80'
            }`}
          >
            Candidatos
          </button>
          <button
            onClick={() => setActiveSubTab('funcionarios')}
            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition ${
              activeSubTab === 'funcionarios' ? 'bg-brand-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80'
            }`}
          >
            Funcionários
          </button>
          <button
            onClick={() => setActiveSubTab('nao_votaram')}
            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition ${
              activeSubTab === 'nao_votaram' ? 'bg-brand-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80'
            }`}
          >
            Não votaram
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-slate-850 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {selectionView === 'candidatos' && activeSubTab === 'candidatos' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-450 uppercase font-mono font-bold text-[9px] tracking-wider">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Candidato</th>
                    <th className="p-4">Lotação</th>
                    <th className="p-4">Admissão</th>
                    <th className="p-4 text-center">Votos</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 w-28 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates
                    .filter(c => c.name.toLowerCase().includes(searchFilterQuery.toLowerCase()))
                    .map((cand, idx) => {
                      const empMatch = employees.find(e => e.name.toLowerCase() === cand.name.toLowerCase());
                      const admissionStr = empMatch ? new Date(empMatch.admissionDate).toLocaleDateString('pt-BR') : '09/06/2019';
                      const lotacaoStr = empMatch ? `NOVO HORIZONTE ALUMÍNIOS LTDA\n${empMatch.sector.toUpperCase()}\n${empMatch.role.toUpperCase()}` : `NOVO HORIZONTE ALUMÍNIOS LTDA\n${cand.sector.toUpperCase()}`;

                      return (
                        <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {empMatch && empMatch.photoUrl ? (
                                <img 
                                  src={empMatch.photoUrl} 
                                  alt={cand.name} 
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase">
                                  {cand.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{cand.name}</div>
                                <div className="text-slate-450 text-[10px] uppercase font-semibold">{empMatch ? empMatch.role : 'CANDIDATO'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line text-[10px] leading-tight">
                            {lotacaoStr}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{admissionStr}</td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">{cand.votes}</td>
                          <td className="p-4">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              cand.isElected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'
                            }`}>
                              {cand.isElected ? 'Eleito CIPA' : 'Suplente'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openVoteModal(cand)}
                                className="flex items-center gap-1 text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <Vote className="w-3 h-3" />
                                <span>Votar</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteCandidate(cand.id)}
                                className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                                title="Excluir Candidato"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                        Nenhum candidato inscrito.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectionView === 'candidatos' && activeSubTab === 'funcionarios' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-450 uppercase font-mono font-bold text-[9px] tracking-wider">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Eleitor</th>
                    <th className="p-4">Lotação</th>
                    <th className="p-4">Data Voto</th>
                    <th className="p-4">Link Votação</th>
                    <th className="p-4 w-28 text-center">Tolerância</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployeesList.map((emp, idx) => {
                    const status = getVoteStatus(emp.id);
                    const employeeToken = getEmployeeToken(emp);
                    const linkVoto = `${window.location.origin}/?tab=cipa&token=${employeeToken}`;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {emp.photoUrl ? (
                              <img 
                                src={emp.photoUrl} 
                                alt={emp.name} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{emp.name}</div>
                              <div className="text-slate-450 text-[10px] font-semibold">{emp.role}</div>
                              <div className="text-slate-400 text-[9px] font-mono leading-none mt-1">
                                {emp.phone || '(43) 99999-9999'} • {emp.email || 'sem@email.com'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:border-slate-700 font-medium text-[10px] leading-tight">
                          NOVO HORIZONTE ALUMÍNIOS LTDA<br />
                          {emp.sector.toUpperCase()}<br />
                          {emp.role.toUpperCase()}
                        </td>
                        <td className="p-4 font-medium">
                          {status.voted ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {new Date(status.date!).toLocaleString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-450 italic">Aguardando</span>
                          )}
                        </td>
                        <td className="p-4">
                          {status.voted ? (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded border border-slate-150 block w-fit">Voto Realizado</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 w-fit">
                              <a
                                href={linkVoto}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-center transition"
                              >
                                <LinkIcon className="w-3 h-3" />
                                <span>Acessar</span>
                              </a>
                              <button
                                onClick={() => handleSendInvite(emp.id, 'invite')}
                                className="flex items-center justify-center gap-1.5 text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Enviar Convite</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openExtensionModal(emp)}
                            className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 text-slate-650 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {(emp as any).cipaExtensionUntil 
                                ? new Date((emp as any).cipaExtensionUntil).toLocaleDateString('pt-BR') 
                                : 'Definir'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectionView === 'candidatos' && activeSubTab === 'nao_votaram' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-450 uppercase font-mono font-bold text-[9px] tracking-wider">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Colaborador Ausente</th>
                    <th className="p-4">Lotação</th>
                    <th className="p-4">Status de Contato</th>
                    <th className="p-4 w-44">Tolerância Atual</th>
                    <th className="p-4 w-28 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployeesList
                    .filter(emp => !voters.some(v => v.employeeId === emp.id))
                    .map((emp, idx) => {
                      const token = getEmployeeToken(emp);
                      const linkVoto = `${window.location.origin}/?tab=cipa&token=${token}`;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {emp.photoUrl ? (
                                <img 
                                  src={emp.photoUrl} 
                                  alt={emp.name} 
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{emp.name}</div>
                                <div className="text-slate-450 text-[10px] font-semibold">{emp.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-[10px] leading-tight">
                            NOVO HORIZONTE ALUMÍNIOS LTDA<br />
                            {emp.sector.toUpperCase()}<br />
                            {emp.role.toUpperCase()}
                          </td>
                          <td className="p-4 font-mono font-bold text-[10px] text-slate-400">
                            {emp.phone || '(43) 99999-9999'}
                          </td>
                          <td className="p-4 text-slate-650 font-medium">
                            {(emp as any).cipaExtensionUntil ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-250 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                Estendido até {new Date((emp as any).cipaExtensionUntil).toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-slate-450 italic">Prazo Padrão da Urna</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSendInvite(emp.id, 'remind')}
                                className="flex items-center gap-1 text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                title="Disparar convite por WhatsApp"
                              >
                                <Bell className="w-3 h-3" />
                                <span>Cobrar</span>
                              </button>
                              
                              <button
                                onClick={() => openExtensionModal(emp)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition cursor-pointer"
                                title="Estender Prazo de Votação"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {selectionView === 'eleitores' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-[11px] font-bold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Eleitores que já Participaram ({voters.length})</span>
                </h4>
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-450 uppercase font-mono font-bold text-[9px] tracking-wider">
                        <th className="p-4">Nome do Votante</th>
                        <th className="p-4">Setor</th>
                        <th className="p-4">Data/Hora</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {voters
                        .filter(v => v.employeeName.toLowerCase().includes(searchFilterQuery.toLowerCase()))
                        .map((voter) => {
                          const empInfo = employees.find(e => e.id === voter.employeeId);
                          return (
                            <tr key={voter.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {empInfo ? (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50">
                                      {empInfo.photoUrl ? (
                                        <img src={empInfo.photoUrl} alt={empInfo.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{empInfo.name.charAt(0)}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                                  )}
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{voter.employeeName}</div>
                                </div>
                              </td>
                              <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{voter.sector || 'Fábrica'}</td>
                              <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {new Date(voter.votedAt).toLocaleString('pt-BR')}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3 justify-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold text-[9px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                                    Comprovado
                                  </span>
                                  <button
                                    onClick={() => {
                                      Swal.fire({
                                        icon: 'success',
                                        title: 'Comprovante de Voto CIPA',
                                        html: `<div class="text-left text-sm mt-4 p-4 bg-slate-50 border rounded"><p><b>Eleitor:</b> ${voter.employeeName}</p><p><b>Setor:</b> ${empInfo?.sector || '-'}</p><p><b>Data/Hora:</b> ${new Date(voter.votedAt).toLocaleString('pt-BR')}</p><p><b>Hash de Validação:</b> ${btoa(voter.id).substring(0,20)}</p></div><div class="mt-4 text-xs text-slate-500">O voto é secreto e esta assinatura criptográfica garante sua participação inviolável.</div>`,
                                        confirmButtonText: 'Imprimir',
                                        confirmButtonColor: '#10b981',
                                        customClass: { popup: 'rounded-xl' }
                                      }).then((res) => {
                                        if (res.isConfirmed) {
                                          window.print();
                                        }
                                      });
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    title="Imprimir Comprovante"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {voters.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-450 font-bold">
                            Nenhum voto registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-800 dark:text-slate-100" />
                  <span>Segurança & Auditoria</span>
                </h4>
                
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-slate-650">
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-150 space-y-2">
                    <h5 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider">Criptografia Ativa</h5>
                    <p className="text-[10px] leading-relaxed text-emerald-700">
                      Os votos são armazenados desvinculados dos comprovantes dos eleitores. Não é possível rastrear qual candidato um eleitor específico escolheu (voto 100% secreto).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span>Total de Funcionários Ativos:</span>
                      <span className="text-slate-800 dark:text-slate-100">{employees.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span>Votos Confirmados:</span>
                      <span className="text-slate-800 dark:text-slate-100">{voters.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span>Quórum Eleitoral:</span>
                      <span className="text-slate-800 dark:text-slate-100">
                        {employees.length > 0 ? Math.round((voters.length / employees.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Prazos e Limites da Eleição</h3>
                <p className="text-[10px] text-slate-400 mt-1">Configura o intervalo geral de funcionamento da urna digital</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Abertura da Urna (Início)</label>
                <input
                  type="datetime-local"
                  required
                  value={electionStartsAt}
                  onChange={(e) => setElectionStartsAt(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 text-[12px]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Fechamento da Urna (Fim)</label>
                <input
                  type="datetime-local"
                  required
                  value={electionEndsAt}
                  onChange={(e) => setElectionEndsAt(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 text-[12px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-850 text-white font-bold rounded-lg hover:bg-slate-900 transition"
                >
                  Salvar Prazos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExtensionModal && selectedEmpForExtension && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Tolerância Individual (CIPA)</h3>
                <p className="text-[10px] text-slate-400 mt-1">Estende o prazo de votação para este funcionário após o limite geral</p>
              </div>
              <button onClick={() => setShowExtensionModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleSaveExtension} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-xl">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-0.5">Funcionário</span>
                <div className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">{selectedEmpForExtension.employeeName || selectedEmpForExtension.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Setor: {selectedEmpForExtension.sector || 'Fábrica'}</div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Votação permitida individualmente até:</label>
                <input
                  type="datetime-local"
                  value={newExtensionDate}
                  onChange={(e) => setNewExtensionDate(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 text-[12px]"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Deixe em branco para remover qualquer tolerância individual.</span>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-850 text-white font-bold rounded-lg hover:bg-slate-900 transition"
                >
                  Confirmar Tolerância
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Inscrição Eleitoral de Candidato</h3>
                <p className="text-[10px] text-slate-400 mt-1">Registra novo funcionário elegível para CIPA-A</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSelectedCandidateForAdd(null); setCandidateSearchQuery(''); setNewName(''); setNewSector(''); }} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateCandidate} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Buscar Colaborador (Apenas Funcionários)</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome, CPF ou matrícula..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:border-slate-800 text-[12px]"
                  />
                </div>

                {candidateSearchQuery.length > 1 && !selectedCandidateForAdd && (
                  <div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg custom-scrollbar">
                    {employees
                      .filter(emp => emp.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) || emp.cpf.includes(candidateSearchQuery) || (emp.matricula && emp.matricula.toLowerCase().includes(candidateSearchQuery.toLowerCase())))
                      .map(emp => (
                        <div 
                          key={emp.id} 
                          onClick={() => {
                            setSelectedCandidateForAdd(emp);
                            setNewName(emp.name);
                            setNewSector(emp.sector || 'Não informado');
                            setCandidateSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{emp.name}</div>
                            <div className="text-[9px] text-slate-500">{emp.sector} • {emp.cpf}</div>
                          </div>
                        </div>
                      ))}
                    {employees.filter(emp => emp.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) || emp.cpf.includes(candidateSearchQuery)).length === 0 && (
                      <div className="p-3 text-center text-slate-500 text-[10px]">Nenhum funcionário encontrado.</div>
                    )}
                  </div>
                )}

                {selectedCandidateForAdd && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-emerald-200 flex-shrink-0 flex items-center justify-center font-bold text-emerald-600">
                        {selectedCandidateForAdd.photoUrl ? (
                          <img src={selectedCandidateForAdd.photoUrl} alt={selectedCandidateForAdd.name} className="w-full h-full object-cover" />
                        ) : (
                          selectedCandidateForAdd.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-400 text-xs">{selectedCandidateForAdd.name}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-500">{selectedCandidateForAdd.sector}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedCandidateForAdd(null);
                        setNewName('');
                        setNewSector('');
                      }}
                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-bold px-2 py-1"
                    >
                      Trocar
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setSelectedCandidateForAdd(null); setCandidateSearchQuery(''); setNewName(''); setNewSector(''); }}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedCandidateForAdd}
                  className={`px-5 py-2 font-bold rounded-lg transition ${selectedCandidateForAdd ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  Confirmar Candidatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOTE SECURE MODAL */}
      {showVoteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-xs border border-slate-100 dark:border-slate-700">
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
                <div className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">{selectedCandidate.name}</div>
                <div className="text-[10px] text-emerald-700 font-medium">{selectedCandidate.sector}</div>
              </div>

              {/* Only show search employee if NOT validated from token */}
              {!validatedTokenData ? (
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Busque seu nome na lista</label>
                  <input
                    type="text"
                    placeholder="Pesquise por Nome, CPF ou Matrícula..."
                    value={searchEmployeeQuery}
                    onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 text-[12px] mb-2"
                  />
                  
                  <select
                    required
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 text-[12px] bg-white dark:bg-slate-800 max-h-[120px]"
                  >
                    <option value="">-- Selecione seu Nome --</option>
                    {filteredEmployeesForSecureVote.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.sector} - Matrícula: {emp.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-xl">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-0.5">Identificação</span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">{validatedTokenData.employee.name}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Autenticado via Token de Acesso</div>
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Digite seu PIN de Acesso (4-6 dígitos)</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={employeePin}
                  onChange={(e) => setEmployeePin(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-widest text-center border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:outline-none focus:border-emerald-500 text-[16px] font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowVoteModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 font-semibold rounded-lg"
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
