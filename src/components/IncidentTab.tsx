import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  HelpCircle, 
  Dna, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Activity,
  AlertTriangle,
  ChevronRight,
  GitFork,
  ArrowRight,
  ArrowLeft,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccidentReport, ActionPlan } from '../types';

interface IncidentTabProps {
  accidents: AccidentReport[];
  actionPlans: ActionPlan[];
  onAddAccident: (acc: Omit<AccidentReport, 'id' | 'status'>) => Promise<any>;
  onAddActionPlan: (plan: Omit<ActionPlan, 'id' | 'status'>) => Promise<any>;
  onUpdateActionPlan: (id: string, updatedFields: Partial<ActionPlan>) => Promise<any>;
}

export default function IncidentTab({
  accidents,
  actionPlans,
  onAddAccident,
  onAddActionPlan,
  onUpdateActionPlan
}: IncidentTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAccidentId, setActiveAccidentId] = useState<string>(accidents[0]?.id || '');
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Add Incident Form state
  const [newAcc, setNewAcc] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Quase Acidente' as const,
    reporterName: '',
    sector: 'Usinagem',
    description: '',
    severity: 'Leve' as const,
    rootCauses5Whys: [
      'Por que ocorreu?',
      'Por que segundo plano?',
      'Por que terceiro plano?',
      'Por que quarto plano?',
      'Por que quinto plano (Causa Raiz)?'
    ],
    ishikawa: {
      metodo: '', maquina: '', medida: '', meioAmbiente: '', maoDeObra: '', material: ''
    }
  });

  // Add Action Plan state
  const [planTitle, setPlanTitle] = useState('');
  const [planResp, setPlanResp] = useState('');
  const [planDeadline, setPlanDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const handleGenerateAIRecommendation = async () => {
    if (!selectedAccident) return;
    setLoadingRecommendation(true);
    try {
      const response = await fetch('/api/ai/recommend-pdca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accidentId: selectedAccident.id,
          description: selectedAccident.description,
          sector: selectedAccident.sector,
          type: selectedAccident.type
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.title) setPlanTitle(data.title);
        if (data.responsible) setPlanResp(data.responsible);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);
        setPlanDeadline(futureDate.toISOString().split('T')[0]);
      }
    } catch (e) {
      console.error('Error generating recommendation:', e);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.reporterName || !newAcc.description) return;
    
    const created = await onAddAccident(newAcc);
    if (created && created.id) {
      setActiveAccidentId(created.id);
    }

    setNewAcc({
      date: new Date().toISOString().split('T')[0],
      type: 'Quase Acidente' as const,
      reporterName: '',
      sector: 'Usinagem',
      description: '',
      severity: 'Leve' as const,
      rootCauses5Whys: [
        'Por que ocorreu?',
        'Por que segundo plano?',
        'Por que terceiro plano?',
        'Por que quarto plano?',
        'Por que quinto plano (Causa Raiz)?'
      ],
      ishikawa: {
        metodo: '', maquina: '', medida: '', meioAmbiente: '', maoDeObra: '', material: ''
      }
    });

    setShowAddModal(false);
  };

  const handleCreateActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || !planResp) return;
    
    await onAddActionPlan({
      accidentId: activeAccidentId,
      title: planTitle,
      responsible: planResp,
      deadline: planDeadline
    });

    setPlanTitle('');
    setPlanResp('');
  };

  const selectedAccident = accidents.find(a => a.id === activeAccidentId);
  const selectedActionPlans = actionPlans.filter(p => p.accidentId === activeAccidentId);

  return (
    <div className="space-y-4 text-xs">
      
      {/* Tab Header layout */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-safety-green" />
            Investigação de Desvios & PDCA (NR-01)
          </h2>
          <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">Registros de não conformidade integrados às metodologias de Ishikawa (Diagrama Espinha de Peixe) e dos 5 Porquês.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white font-bold rounded uppercase tracking-wider text-[10px] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Desvio / Acidente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column: Incident list select */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block px-1">Registros Recentes</span>
          <div className="space-y-1.5">
            {accidents.map((acc) => {
              const isActive = acc.id === activeAccidentId;
              return (
                <div
                  key={acc.id}
                  onClick={() => setActiveAccidentId(acc.id)}
                  className={`p-3 rounded border transition cursor-pointer text-left flex flex-col justify-between ${
                    isActive 
                      ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 leading-none">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      acc.type === 'Acidente' ? 'bg-red-50 text-red-700 border border-red-200/50' : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                    }`}>
                      {acc.type}
                    </span>
                    <span className="font-mono text-[8px] text-slate-400">{acc.date}</span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-[11px] line-clamp-1 mt-1 leading-snug">{acc.description}</h3>
                  <p className="text-slate-400 text-[9px] mt-0.5">Setor: {acc.sector} • Gravidade: {acc.severity}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Ishikawa, 5 Whys, and PDCA Actions detailed analysis */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAccident ? (
            <div className="space-y-4">
              
              {/* Box 1: Description and 5 Whys */}
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 uppercase tracking-tight text-[10px] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-safety-green" />
                    Análise dos 5 Porquês (Causa Raiz)
                  </h3>
                  <span className="text-slate-400 text-[8px] font-mono">ID: {selectedAccident.id}</span>
                </div>

                <p className="bg-slate-50 p-2.5 rounded border border-slate-250 italic text-[10.5px] leading-relaxed text-slate-600">
                  &ldquo;{selectedAccident.description}&rdquo; — <strong className="font-sans text-slate-700 not-italic text-[9px] uppercase font-bold text-safety-green">Registrado por: {selectedAccident.reporterName}</strong>
                </p>

                <div className="space-y-1.5 font-sans">
                  {selectedAccident.rootCauses5Whys.map((why, idx) => (
                    <div key={idx} className="flex gap-2 text-[10px] items-start">
                      <span className="bg-safety-green text-white font-mono font-bold rounded h-4.5 w-4.5 flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="text-slate-750 pt-0.5 leading-tight">{why}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Diagrama de Ishikawa (Visual fishbone structure) */}
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-tight text-[10px] flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5 text-safety-green" />
                  Diagrama de Ishikawa (Espinha de Peixe)
                </h3>
                
                {/* Visual bone simulation wrapper */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  
                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">1. MÉTODO</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.metodo || 'Sem desvios cadastrados de POP ou cronogramas de serviço.'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">2. MÁQUINA</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.maquina || 'Aparelhagens em manutenção normal.'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">3. MEDIDA</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.medida || 'Indicadores de riscos sob controle.'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">4. MEIO AMBIENTE</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.meioAmbiente || 'Ar condicionado e iluminação de acordo com parâmetros.'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">5. MÃO DE OBRA</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.maoDeObra || 'Capacitação pedagógica pendente.'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded space-y-0.5">
                    <strong className="text-[9px] font-mono text-safety-green uppercase font-bold block">6. MATERIAL</strong>
                    <p className="text-slate-650 leading-snug text-[10px]">
                      {selectedAccident.ishikawa.material || 'Ferramentas manuais normatizadas.'}
                    </p>
                  </div>

                </div>
              </div>

              {/* Box 3: Action Plans PDCA and creation form */}
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-safety-green animate-pulse" />
                      Painel PDCA de Resoluções & Melhoria Contínua
                    </h3>
                    <p className="text-slate-455 text-[9px] mt-0.5">Arraste os cartões de ação ou utilize as setas laterais para evoluir cada etapa.</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-500 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-spin-slow" />
                    <span>Layout de Alta Performance</span>
                  </div>
                </div>

                {/* PDCA Columns Container */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { id: 'Pendente', title: 'Planejamento (Plan)', color: 'border-slate-200 text-slate-800 bg-slate-50/40', badgeColor: 'bg-sky-100 text-sky-850', hoverBorder: 'border-sky-400 bg-sky-50/20', icon: '📋', desc: 'Identificar e analisar desvios' },
                    { id: 'Em Andamento', title: 'Execução (Do)', color: 'border-slate-200 text-slate-800 bg-slate-50/40', badgeColor: 'bg-amber-100 text-amber-850', hoverBorder: 'border-amber-400 bg-amber-50/20', icon: '⚙️', desc: 'Implementar as medidas' },
                    { id: 'Verificando', title: 'Verificação (Check)', color: 'border-slate-200 text-slate-800 bg-slate-50/40', badgeColor: 'bg-indigo-100 text-indigo-855', hoverBorder: 'border-indigo-400 bg-indigo-50/20', icon: '🔍', desc: 'Monitorar os resultados' },
                    { id: 'Concluído', title: 'Ação (Act)', color: 'border-slate-200 text-slate-800 bg-slate-50/40', badgeColor: 'bg-emerald-100 text-emerald-860', hoverBorder: 'border-emerald-400 bg-emerald-50/20', icon: '📌', desc: 'Padronizar e consolidar' }
                  ].map((col, colIndex, columnsArr) => {
                    const colPlans = selectedActionPlans.filter(p => p.status === col.id);
                    const isDraggedOver = draggedOverColumn === col.id;

                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDraggedOverColumn(col.id);
                        }}
                        onDragLeave={() => {
                          setDraggedOverColumn(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData('text/plain');
                          if (id) {
                            onUpdateActionPlan(id, { status: col.id as any });
                          }
                          setDraggedOverColumn(null);
                        }}
                        className={`rounded-lg border p-2.5 transition-all flex flex-col min-h-[160px] ${
                          isDraggedOver 
                            ? col.hoverBorder + ' scale-[1.01] shadow-xs' 
                            : col.color
                        }`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[9.5px] uppercase tracking-wider text-slate-700 flex items-center gap-1">
                            <span className="text-xs">{col.icon}</span>
                            {col.title}
                          </span>
                          <span className={`text-[8.5px] font-black rounded-full px-1.5 py-0.2 font-mono ${col.badgeColor}`}>
                            {colPlans.length}
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-400 mb-2 leading-none">{col.desc}</p>

                        {/* Plans (Task cards inside column) */}
                        <div className="space-y-1.5 flex-1 flex flex-col justify-start overflow-y-auto">
                          <AnimatePresence mode="popLayout">
                            {colPlans.map(p => (
                              <motion.div
                                key={p.id}
                                layoutId={p.id}
                                layout
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', p.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                className="p-2 bg-white border border-slate-200 hover:border-slate-350 rounded shadow-xs hover:shadow-sm cursor-grab active:cursor-grabbing transition relative group select-none flex flex-col gap-1 text-left"
                              >
                                <strong className="text-slate-800 text-[10px] leading-tight block font-semibold">{p.title}</strong>
                                
                                <div className="space-y-0.5 text-[8.5px] text-slate-505 font-medium">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span>Resp: {p.responsible}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Prazo: {p.deadline}</span>
                                  </div>
                                </div>

                                {/* Accessible quick transfer buttons for mobile */}
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    disabled={colIndex === 0}
                                    onClick={() => {
                                      const prevStatus = columnsArr[colIndex - 1].id;
                                      onUpdateActionPlan(p.id, { status: prevStatus as any });
                                    }}
                                    className="p-0.5 rounded transition text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                                    title="Mover para esquerda"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-[7.5px] font-black text-slate-350 uppercase tracking-widest font-mono">PDCA</span>
                                  <button
                                    type="button"
                                    disabled={colIndex === columnsArr.length - 1}
                                    onClick={() => {
                                      const nextStatus = columnsArr[colIndex + 1].id;
                                      onUpdateActionPlan(p.id, { status: nextStatus as any });
                                    }}
                                    className="p-0.5 rounded transition text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                                    title="Mover para direita"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {colPlans.length === 0 && (
                            <div className="py-4 flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-md">
                              <span className="text-[8.5px] text-slate-350 font-mono italic">Aguardando...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Create Plan form */}
                <form onSubmit={handleCreateActionPlan} className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-450 uppercase font-mono font-bold block">Adicionar Nova Ação de Prevenção/Controle</span>
                    <button
                      type="button"
                      disabled={loadingRecommendation}
                      onClick={handleGenerateAIRecommendation}
                      className="text-[9px] bg-slate-900 hover:bg-slate-950 text-white border border-slate-800 rounded px-2.5 py-1 font-bold uppercase font-mono flex items-center gap-1 cursor-pointer transition disabled:opacity-55"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-400 animate-spin-slow" />
                      {loadingRecommendation ? 'Gerando Plano...' : 'Recomendar com IA'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Medida Mitigadora / Título..."
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      className="border border-slate-200 rounded p-1.5 bg-white text-[11px] focus:outline-none focus:border-safety-green"
                    />

                    <input
                      type="text"
                      required
                      placeholder="Responsável Técnico..."
                      value={planResp}
                      onChange={(e) => setPlanResp(e.target.value)}
                      className="border border-slate-200 rounded p-1.5 bg-white text-[11px] focus:outline-none focus:border-safety-green"
                    />

                    <input
                      type="date"
                      required
                      value={planDeadline}
                      onChange={(e) => setPlanDeadline(e.target.value)}
                      className="border border-slate-200 rounded p-1.5 bg-white text-[11px] focus:outline-none focus:border-safety-green font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white transition rounded p-2 text-[10px] font-bold uppercase tracking-wide cursor-pointer"
                  >
                    Vincular Ação de Eng. de Segurança (Planejamento)
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 rounded border border-slate-200 flex flex-col items-center justify-center gap-1.5">
              <ShieldAlert className="w-8 h-8 text-slate-350 bg-slate-100/40" />
              <span className="font-bold text-slate-600 uppercase text-[10px]">Selecione um Acidente/Desvio</span>
              <p className="text-[9px] max-w-sm mx-auto leading-relaxed">Toda investigação corporativa necessita estar vinculada a um evento de desvio cadastrado para análise estruturada.</p>
            </div>
          )}
        </div>

      </div>

      {/* --- ADD DETAILED ACCIDENT REPORT DIALOG --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded border border-slate-200 shadow-xl overflow-hidden animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-tight">Registrar Não Conformidade / Evento de Risco</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Conecta dados aos relatórios exigidos no eSocial do governo brasileiro</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✖</button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Trabalhador Informante</label>
                  <input
                    type="text"
                    required
                    value={newAcc.reporterName}
                    onChange={(e) => setNewAcc({...newAcc, reporterName: e.target.value})}
                    placeholder="Ex: Carlos Henrique da Silva"
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Data do Fato</label>
                  <input
                    type="date"
                    required
                    value={newAcc.date}
                    onChange={(e) => setNewAcc({...newAcc, date: e.target.value})}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Categoria do Evento</label>
                  <select
                    value={newAcc.type}
                    onChange={(e) => setNewAcc({...newAcc, type: e.target.value as any})}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="Quase Acidente">Quase Acidente</option>
                    <option value="Acidente">Acidente de Trabalho</option>
                    <option value="Desvio">Desvio Crítico Comportamental</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Setor do Ocorrido</label>
                  <select
                    value={newAcc.sector}
                    onChange={(e) => setNewAcc({...newAcc, sector: e.target.value})}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="Usinagem">Usinagem</option>
                    <option value="Soldagem">Soldagem</option>
                    <option value="Obras Civil">Obras Civil</option>
                    <option value="Almoxarifado">Almoxarifado</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Gravidade Operacional</label>
                  <select
                    value={newAcc.severity}
                    onChange={(e) => setNewAcc({...newAcc, severity: e.target.value as any})}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Grave">Grave (CAT imediato)</option>
                    <option value="Fatal">Fatal / Impeditivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Descrição Textual do Ocorrido</label>
                <textarea
                  required
                  rows={2}
                  value={newAcc.description}
                  onChange={(e) => setNewAcc({...newAcc, description: e.target.value})}
                  placeholder="Seja descritivo sobre o maquinário, circunstâncias, EPIs usados ou as falhas protetivas encontradas."
                  className="w-full border border-slate-200 rounded p-2 focus:outline-none focus:border-safety-green text-[11px]"
                />
              </div>

              {/* Set Ishikawa inputs */}
              <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                <span className="text-[9px] text-slate-450 font-mono font-bold uppercase tracking-wider block">Estudo das Causas (Ishikawa de Entrada)</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Método</label>
                    <input
                      type="text"
                      placeholder="Falha metodológica"
                      value={newAcc.ishikawa.metodo}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, metodo: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Máquina</label>
                    <input
                      type="text"
                      placeholder="Falha de equipamentos"
                      value={newAcc.ishikawa.maquina}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, maquina: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Medida</label>
                    <input
                      type="text"
                      placeholder="Aferição incorreta"
                      value={newAcc.ishikawa.medida}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, medida: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Meio Ambiente</label>
                    <input
                      type="text"
                      placeholder="Ambiente inadequado"
                      value={newAcc.ishikawa.meioAmbiente}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, meioAmbiente: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Mão de Obra</label>
                    <input
                      type="text"
                      placeholder="Erro comportamental"
                      value={newAcc.ishikawa.maoDeObra}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, maoDeObra: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold uppercase block mb-0.5">Material</label>
                    <input
                      type="text"
                      placeholder="Insumos irregulares"
                      value={newAcc.ishikawa.material}
                      onChange={(e) => setNewAcc({...newAcc, ishikawa: {...newAcc.ishikawa, material: e.target.value}})}
                      className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Set 5 Whys input */}
              <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                <span className="text-[9px] text-slate-450 font-mono font-bold uppercase tracking-wider block">Encadeamento dos 5 Porquês (Estrutural)</span>
                <div className="space-y-1">
                  {newAcc.rootCauses5Whys.map((why, idx) => (
                    <div key={idx} className="flex gap-2 items-center text-[10px]">
                      <span className="font-bold text-slate-400 font-mono shrink-0">Porquê {idx+1}:</span>
                      <input
                        type="text"
                        required
                        value={why}
                        onChange={(e) => {
                          const updated = [...newAcc.rootCauses5Whys];
                          updated[idx] = e.target.value;
                          setNewAcc({...newAcc, rootCauses5Whys: updated});
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:border-safety-green focus:outline-none text-[10px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded cursor-pointer uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white font-bold rounded cursor-pointer uppercase"
                >
                  Salvar Investigação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
