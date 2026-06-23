import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Plus, Search, Calendar, User, Building2, CheckCircle2,
  XCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Trash2, Edit3,
  Save, X, FileCheck, BarChart2, Eye, CheckSquare, Square
} from 'lucide-react';
import Swal from '../utils/swal';

interface Inspection {
  id: string;
  title: string;
  type: string;
  sector: string;
  responsible: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  observations?: string;
  score?: number;
  ncCount: number;
  companyId: string;
}

interface InspectionItem {
  id: string;
  inspectionId: string;
  description: string;
  category: string;
  nrReference: string;
  result: 'Conforme' | 'Não Conforme' | 'Não Aplicável' | 'Pendente' | '';
  observation?: string;
}

const INSPECTION_TYPES = ['Inspeção Geral','NR-06','NR-10','NR-12','NR-18','NR-20','NR-23','NR-26','NR-35','Prevenção de Incêndio','Higiene Ocupacional','Ordem e Limpeza'];
const SECTORS_LIST = ['Usinagem','Soldagem e Montagem','Almoxarifado','Administrativo','Expedição','Manutenção','Toda a Planta'];

const STANDARD_CHECKLIST_TEMPLATES: Record<string, {description: string; category: string; nrReference: string}[]> = {
  'Inspeção Geral': [
    { description: 'EPIs disponíveis e em bom estado para todos os funcionários', category: 'EPI/EPC', nrReference: 'NR-06' },
    { description: 'Funcionários utilizando corretamente os EPIs obrigatórios', category: 'EPI/EPC', nrReference: 'NR-06' },
    { description: 'Sinalização de segurança visível e em bom estado', category: 'Sinalização', nrReference: 'NR-26' },
    { description: 'Rotas de fuga desobstruídas e sinalizadas', category: 'Emergência', nrReference: 'NR-23' },
    { description: 'Extintores de incêndio dentro da validade e acessíveis', category: 'Incêndio', nrReference: 'NR-23' },
    { description: 'Ordem e limpeza do ambiente de trabalho', category: 'Higiene', nrReference: 'NR-24' },
    { description: 'Equipamentos com proteções mecânicas adequadas', category: 'Máquinas', nrReference: 'NR-12' },
  ],
  'NR-12': [
    { description: 'Proteções fixas e móveis das máquinas em bom estado', category: 'Máquinas', nrReference: 'NR-12' },
    { description: 'Dispositivos de parada de emergência funcionando', category: 'Máquinas', nrReference: 'NR-12' },
    { description: 'Distâncias de segurança respeitadas', category: 'Máquinas', nrReference: 'NR-12' },
    { description: 'Trabalhadores treinados para operação das máquinas', category: 'Treinamento', nrReference: 'NR-12' },
    { description: 'Procedimentos de bloqueio/travamento (LOTO) disponíveis', category: 'Procedimento', nrReference: 'NR-12' },
  ],
  'Prevenção de Incêndio': [
    { description: 'Extintores dentro da validade e com carga adequada', category: 'Incêndio', nrReference: 'NR-23' },
    { description: 'Extintores posicionados corretamente e acessíveis', category: 'Incêndio', nrReference: 'NR-23' },
    { description: 'Saídas de emergência desobstruídas', category: 'Emergência', nrReference: 'NR-23' },
    { description: 'Plano de emergência e evacuação afixado', category: 'Emergência', nrReference: 'NR-23' },
    { description: 'Alarme de incêndio testado e funcional', category: 'Incêndio', nrReference: 'NR-23' },
    { description: 'Armazenamento correto de materiais inflamáveis', category: 'Incêndio', nrReference: 'NR-20' },
  ],
  'NR-35': [
    { description: 'Trabalhadores com treinamento NR-35 válido', category: 'Treinamento', nrReference: 'NR-35' },
    { description: 'Cintos de segurança tipo paraquedista inspecionados', category: 'EPI', nrReference: 'NR-35' },
    { description: 'Talabarte duplo com absorvedor de impacto disponível', category: 'EPI', nrReference: 'NR-35' },
    { description: 'Pontos de ancoragem adequados e identificados', category: 'EPC', nrReference: 'NR-35' },
    { description: 'ART e APR preenchidas antes do trabalho em altura', category: 'Procedimento', nrReference: 'NR-35' },
  ],
};

const statusColor: Record<string, string> = {
  'Agendada': 'bg-blue-50 text-blue-700 border-blue-200',
  'Em Andamento': 'bg-amber-50 text-amber-700 border-amber-200',
  'Concluída': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cancelada': 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const resultColor: Record<string, string> = {
  'Conforme': 'text-emerald-600',
  'Não Conforme': 'text-red-600',
  'Não Aplicável': 'text-slate-400',
  'Pendente': 'text-amber-600',
  '': 'text-slate-400',
};

export default function InspectionTab() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [items, setItems] = useState<Record<string, InspectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', type: 'Inspeção Geral', sector: '', responsible: '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    status: 'Agendada' as Inspection['status'],
    observations: '',
  });

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/inspections');
      if (res.ok) setInspections(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchItems = async (inspId: string) => {
    if (items[inspId]) return;
    setLoadingItems(inspId);
    try {
      const res = await fetch(`/api/inspections/${inspId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(prev => ({ ...prev, [inspId]: data }));
      }
    } catch (e) { console.error(e); }
    finally { setLoadingItems(null); }
  };

  useEffect(() => { fetchInspections(); }, []);

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchItems(id);
  };

  const handleCreate = async () => {
    if (!form.title || !form.sector || !form.responsible) {
      Swal.fire('Atenção', 'Preencha título, setor e responsável.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: 'c1' })
      });
      if (res.ok) {
        const created: Inspection = await res.json();
        setInspections(prev => [created, ...prev]);

        // Auto-populate checklist from template
        const template = STANDARD_CHECKLIST_TEMPLATES[form.type] || [];
        const createdItems: InspectionItem[] = [];
        for (const t of template) {
          const itemRes = await fetch(`/api/inspections/${created.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...t, result: '', observation: '' })
          });
          if (itemRes.ok) createdItems.push(await itemRes.json());
        }
        setItems(prev => ({ ...prev, [created.id]: createdItems }));
        setExpandedId(created.id);
        setShowNewForm(false);
        setForm({ title: '', type: 'Inspeção Geral', sector: '', responsible: '', scheduledDate: new Date().toISOString().slice(0, 10), status: 'Agendada', observations: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateItem = async (item: InspectionItem, field: keyof InspectionItem, value: string) => {
    const updated = { ...item, [field]: value };
    setItems(prev => ({
      ...prev,
      [item.inspectionId]: (prev[item.inspectionId] || []).map(i => i.id === item.id ? updated : i)
    }));
    try {
      await fetch(`/api/inspection-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      // Recalculate score
      const allItems = items[item.inspectionId]?.map(i => i.id === item.id ? updated : i) || [];
      const applicable = allItems.filter(i => i.result !== 'Não Aplicável' && i.result !== '');
      const conformes = applicable.filter(i => i.result === 'Conforme').length;
      const score = applicable.length > 0 ? Math.round((conformes / applicable.length) * 100) : null;
      const ncCount = allItems.filter(i => i.result === 'Não Conforme').length;
      await fetch(`/api/inspections/${item.inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inspections.find(i => i.id === item.inspectionId), score, ncCount })
      });
      setInspections(prev => prev.map(i => i.id === item.inspectionId ? { ...i, score: score ?? undefined, ncCount } : i));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    const confirmResult = await Swal.fire({
      title: 'Atenção',
      text: 'Tem certeza que deseja excluir esta inspeção e todos os seus itens?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmResult.isConfirmed) return;
    try {
      await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      setInspections(prev => prev.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) { console.error(e); }
  };

  const handleFinalize = async (insp: Inspection) => {
    const inspItems = items[insp.id] || [];
    const applicable = inspItems.filter(i => i.result !== 'Não Aplicável' && i.result !== '');
    const conformes = applicable.filter(i => i.result === 'Conforme').length;
    const score = applicable.length > 0 ? Math.round((conformes / applicable.length) * 100) : 100;
    const ncCount = inspItems.filter(i => i.result === 'Não Conforme').length;
    const updated = { ...insp, status: 'Concluída' as const, completedDate: new Date().toISOString().slice(0, 10), score, ncCount };
    try {
      await fetch(`/api/inspections/${insp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setInspections(prev => prev.map(i => i.id === insp.id ? updated : i));
    } catch (e) { console.error(e); }
  };

  const filtered = inspections.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.sector.toLowerCase().includes(search.toLowerCase()) ||
      i.responsible.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalConcluidas = inspections.filter(i => i.status === 'Concluída').length;
  const totalNC = inspections.reduce((acc, i) => acc + (i.ncCount || 0), 0);
  const avgScore = inspections.filter(i => i.score != null).reduce((a, b) => a + (b.score || 0), 0) /
    (inspections.filter(i => i.score != null).length || 1);

  return (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-safety-green" />
            Inspeções e Checklists de Segurança
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Registro e controle de inspeções periódicas com checklists padronizados por NR.</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-safety-green text-white rounded transition hover:bg-green-700 cursor-pointer shrink-0 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Inspeção
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Inspeções', value: inspections.length, color: 'text-slate-800 dark:text-slate-100', sub: 'registradas' },
          { label: 'Concluídas', value: totalConcluidas, color: 'text-emerald-600', sub: 'finalizadas' },
          { label: 'Não Conformidades', value: totalNC, color: totalNC > 0 ? 'text-red-600' : 'text-emerald-600', sub: 'pendentes de ação' },
          { label: 'Pontuação Média', value: `${Math.round(avgScore)}%`, color: avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600', sub: 'conformidade média' },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{k.label}</span>
            <span className={`text-xl font-extrabold block mt-1 ${k.color}`}>{k.value}</span>
            <span className="text-[9px] text-slate-400">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar por título, setor, responsável..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green">
          <option value="">Todos os Status</option>
          {['Agendada', 'Em Andamento', 'Concluída', 'Cancelada'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* New Inspection Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-slate-800 border border-safety-green/30 rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Nova Inspeção</h3>
            <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Título da Inspeção *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Inspeção Mensal de EPI - Usinagem"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Tipo / NR de Referência</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green">
                {INSPECTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Setor *</label>
              <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green">
                <option value="">Selecione...</option>
                {SECTORS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Responsável *</label>
              <input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                placeholder="Nome do responsável"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Data Agendada</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-safety-green text-white rounded hover:bg-green-700 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Criar e Auto-preencher Checklist
            </button>
            <button onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 dark:bg-slate-700 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Inspections List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">Carregando inspeções...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-8 text-center">
          <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Nenhuma inspeção encontrada. Crie a primeira!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(insp => {
            const isExpanded = expandedId === insp.id;
            const inspItems = items[insp.id] || [];
            const conformes = inspItems.filter(i => i.result === 'Conforme').length;
            const ncs = inspItems.filter(i => i.result === 'Não Conforme').length;

            return (
              <div key={insp.id} className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-3 flex items-center justify-between gap-2">
                  <button onClick={() => handleExpand(insp.id)} className="flex items-center gap-2 flex-1 text-left cursor-pointer min-w-0">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{insp.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{insp.sector}</span>
                        <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{insp.responsible}</span>
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{insp.scheduledDate}</span>
                        {insp.score != null && (
                          <span className={`flex items-center gap-0.5 font-bold ${insp.score >= 80 ? 'text-emerald-600' : insp.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            <BarChart2 className="w-3 h-3" />{insp.score}%
                          </span>
                        )}
                        {ncs > 0 && (
                          <span className="text-red-600 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />{ncs} NC
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColor[insp.status]}`}>{insp.status}</span>
                    <span className="text-[9px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{insp.type}</span>
                    {insp.status === 'Em Andamento' && (
                      <button onClick={() => handleFinalize(insp)} title="Finalizar inspeção"
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer" >
                        <FileCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(insp.id)} className="p-1 text-red-400 hover:bg-red-50 rounded cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Checklist */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                    {loadingItems === insp.id ? (
                      <p className="text-[10px] text-slate-400 text-center py-3">Carregando checklist...</p>
                    ) : inspItems.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-3">Nenhum item no checklist.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Checklist ({conformes}/{inspItems.filter(i => i.result !== 'Não Aplicável').length} conformes)
                          </span>
                          {insp.status !== 'Concluída' && (
                            <button onClick={() => handleFinalize(insp)}
                              className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 bg-safety-green text-white rounded hover:bg-green-700 cursor-pointer">
                              <CheckCircle2 className="w-3 h-3" /> Concluir Inspeção
                            </button>
                          )}
                        </div>
                        {inspItems.map(item => (
                          <div key={item.id} className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-2.5 flex flex-col sm:flex-row sm:items-start gap-2">
                            <div className="flex-1">
                              <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200 leading-snug">{item.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded font-mono">{item.nrReference}</span>
                                <span className="text-[9px] text-slate-400">{item.category}</span>
                              </div>
                              {item.result === 'Não Conforme' && (
                                <input type="text"
                                  placeholder="Observação da não conformidade..."
                                  value={item.observation || ''}
                                  onChange={e => handleUpdateItem(item, 'observation', e.target.value)}
                                  className="mt-1.5 w-full px-2 py-1 text-[10px] border border-red-200 bg-red-50 rounded focus:outline-none focus:border-red-400" />
                              )}
                            </div>
                            {insp.status !== 'Concluída' ? (
                              <div className="flex gap-1.5 shrink-0 flex-wrap">
                                {(['Conforme', 'Não Conforme', 'Não Aplicável', 'Pendente'] as const).map(r => (
                                  <button key={r} onClick={() => handleUpdateItem(item, 'result', r)}
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition ${item.result === r
                                      ? r === 'Conforme' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                        : r === 'Não Conforme' ? 'bg-red-100 text-red-700 border-red-300'
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:bg-slate-700'}`}>
                                    {r === 'Conforme' ? '✓ C' : r === 'Não Conforme' ? '✗ NC' : r === 'Não Aplicável' ? 'N/A' : '⏳'}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className={`text-[9px] font-bold shrink-0 ${resultColor[item.result]}`}>
                                {item.result || '—'}
                              </span>
                            )}
                          </div>
                        ))}

                        {insp.observations && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-700">
                            <span className="font-bold">Observações: </span>{insp.observations}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

