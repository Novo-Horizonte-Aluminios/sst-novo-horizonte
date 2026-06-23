import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Calendar, User, AlertCircle, CheckCircle2,
  Clock, Download, Trash2, Edit3, Save, X, RefreshCw, Eye, Shield,
  BookOpen, FileWarning
} from 'lucide-react';
import Swal from '../utils/swal';

interface SSTDocument {
  id: string;
  title: string;
  type: string;
  documentNumber: string;
  responsible: string;
  elaborationDate: string;
  revisionDate: string;
  expiryDate: string;
  validityMonths: number;
  status: 'Vigente' | 'Vencido' | 'Em Revisão' | 'Arquivado';
  fileUrl?: string;
  description: string;
  nrReferences: string[];
  companyId: string;
}

const DOC_TYPES = ['PGR','LTCAT','PCMSO','PPR','PCA','PAE','PPRA','DDS','APR','ART','FISPQ','Laudo Ergonômico','Laudo de Ruído','Laudo de Vibração','Laudo de Agentes Químicos','Procedimento Operacional','Plano de Ação','Outro'];
const NR_OPTIONS = ['NR-01','NR-04','NR-05','NR-06','NR-07','NR-09','NR-10','NR-11','NR-12','NR-15','NR-17','NR-18','NR-20','NR-23','NR-24','NR-26','NR-33','NR-35','NR-38','CLT','IN INSS 77/2015'];

const statusStyles: Record<string, string> = {
  'Vigente': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Vencido': 'bg-red-50 text-red-700 border-red-200',
  'Em Revisão': 'bg-amber-50 text-amber-700 border-amber-200',
  'Arquivado': 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const typeIcon: Record<string, string> = {
  'PGR': '📋', 'LTCAT': '🔬', 'PCMSO': '🏥', 'DDS': '📢', 'APR': '⚠️', 'ART': '📐', 'Outro': '📄',
};

const emptyForm: Omit<SSTDocument, 'id'> = {
  title: '', type: 'PGR', documentNumber: '', responsible: '',
  elaborationDate: new Date().toISOString().slice(0,10),
  revisionDate: '', expiryDate: '', validityMonths: 24,
  status: 'Vigente', fileUrl: '', description: '', nrReferences: [], companyId: 'c1'
};

function getDaysUntilExpiry(dateStr: string): number {
  if (!dateStr) return 9999;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DocumentsTab() {
  const [docs, setDocs] = useState<SSTDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SSTDocument | null>(null);
  const [form, setForm] = useState<Omit<SSTDocument, 'id'>>(emptyForm);
  const [nrInput, setNrInput] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/documents-sst');
      if (res.ok) setDocs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const openNew = () => { setEditingDoc(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (doc: SSTDocument) => { setEditingDoc(doc); setForm({ ...doc }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title || !form.type || !form.responsible) {
      Swal.fire('Atenção', 'Preencha título, tipo e responsável.', 'warning');
      return;
    }
    try {
      let res: Response;
      if (editingDoc) {
        res = await fetch(`/api/documents-sst/${editingDoc.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (res.ok) {
          const updated = await res.json();
          setDocs(prev => prev.map(d => d.id === editingDoc.id ? updated : d));
        }
      } else {
        res = await fetch('/api/documents-sst', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (res.ok) {
          const created = await res.json();
          setDocs(prev => [created, ...prev]);
        }
      }
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    const confirmResult = await Swal.fire({
      title: 'Atenção',
      text: 'Excluir este documento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmResult.isConfirmed) return;
    try {
      await fetch(`/api/documents-sst/${id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (e) { console.error(e); }
  };

  const addNr = () => {
    if (nrInput && !form.nrReferences.includes(nrInput)) {
      setForm(f => ({ ...f, nrReferences: [...f.nrReferences, nrInput] }));
      setNrInput('');
    }
  };

  const filtered = docs.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.documentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.responsible?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || d.type === typeFilter;
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const expiring30 = docs.filter(d => { const days = getDaysUntilExpiry(d.expiryDate); return days > 0 && days <= 30 && d.status === 'Vigente'; });
  const expired = docs.filter(d => d.status === 'Vencido' || getDaysUntilExpiry(d.expiryDate) < 0);

  return (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Gestão Documental SST
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">PGR, LTCAT, PCMSO, APR, DDS e demais documentos legais com controle de validade.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-indigo-600 text-white rounded transition hover:bg-indigo-700 cursor-pointer shrink-0 h-8">
          <Plus className="w-3.5 h-3.5" /> Novo Documento
        </button>
      </div>

      {/* Alerts */}
      {(expiring30.length > 0 || expired.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
          {expired.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <FileWarning className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-[10px] uppercase">⚠ {expired.length} Documento(s) Vencido(s)</p>
                <p className="text-[9px] text-red-600 mt-0.5">{expired.map(d => d.title).join(' • ')}</p>
              </div>
            </div>
          )}
          {expiring30.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-700 text-[10px] uppercase">⏳ {expiring30.length} Vence(m) em 30 dias</p>
                <p className="text-[9px] text-amber-600 mt-0.5">{expiring30.map(d => `${d.title} (${getDaysUntilExpiry(d.expiryDate)}d)`).join(' • ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Documentos', value: docs.length, color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Vigentes', value: docs.filter(d => d.status === 'Vigente').length, color: 'text-emerald-600' },
          { label: 'Vencidos', value: expired.length, color: expired.length > 0 ? 'text-red-600' : 'text-slate-400' },
          { label: 'Vence em 30d', value: expiring30.length, color: expiring30.length > 0 ? 'text-amber-600' : 'text-slate-400' },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{k.label}</span>
            <span className={`text-xl font-extrabold block mt-1 ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar por título, número, responsável..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none">
          <option value="">Todos os Tipos</option>
          {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none">
          <option value="">Todos os Status</option>
          {['Vigente','Vencido','Em Revisão','Arquivado'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-200 rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {editingDoc ? 'Editar Documento' : 'Novo Documento SST'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Título *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: PGR - Programa de Gerenciamento de Riscos"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Tipo *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Número do Documento</label>
              <input type="text" value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                placeholder="Ex: PGR-NH-2024-001"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Responsável Técnico *</label>
              <input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Elaboração</label>
              <input type="date" value={form.elaborationDate} onChange={e => setForm(f => ({ ...f, elaborationDate: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Revisão</label>
              <input type="date" value={form.revisionDate} onChange={e => setForm(f => ({ ...f, revisionDate: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Vencimento</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Validade (meses)</label>
              <input type="number" value={form.validityMonths} onChange={e => setForm(f => ({ ...f, validityMonths: +e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none">
                {['Vigente','Em Revisão','Arquivado','Vencido'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Descrição / Escopo</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">NRs de Referência</label>
              <div className="flex gap-1.5 mb-1.5">
                <select value={nrInput} onChange={e => setNrInput(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none">
                  <option value="">Selecione uma NR...</option>
                  {NR_OPTIONS.map(n => <option key={n}>{n}</option>)}
                </select>
                <button onClick={addNr} className="px-3 py-1.5 text-[10px] bg-indigo-100 text-indigo-700 font-bold rounded hover:bg-indigo-200 cursor-pointer">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.nrReferences.map(nr => (
                  <span key={nr} className="flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                    {nr}
                    <button onClick={() => setForm(f => ({ ...f, nrReferences: f.nrReferences.filter(r => r !== nr) }))} className="cursor-pointer hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">URL do Arquivo (opcional)</label>
              <input type="text" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://drive.google.com/..."
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> {editingDoc ? 'Salvar Alterações' : 'Criar Documento'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 dark:bg-slate-700 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">Carregando documentos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-8 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">Documento</th>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2 hidden sm:table-cell">Tipo</th>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2 hidden md:table-cell">Responsável</th>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">Vencimento</th>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">Status</th>
                <th className="text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">NRs</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(doc => {
                const days = getDaysUntilExpiry(doc.expiryDate);
                const expiryWarning = days <= 30 && days > 0;
                const expired = days <= 0;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition">
                    <td className="px-3 py-2.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-sm">{typeIcon[doc.type] || '📄'}</span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">{doc.title}</p>
                          {doc.documentNumber && <p className="text-[9px] text-slate-400 font-mono">{doc.documentNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{doc.type}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-slate-600 dark:text-slate-300">{doc.responsible}</td>
                    <td className="px-3 py-2.5">
                      {doc.expiryDate ? (
                        <div>
                          <p className={`font-mono font-bold text-[10px] ${expired ? 'text-red-600' : expiryWarning ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200'}`}>
                            {doc.expiryDate}
                          </p>
                          <p className={`text-[9px] ${expired ? 'text-red-500' : expiryWarning ? 'text-amber-500' : 'text-slate-400'}`}>
                            {expired ? `Vencido há ${Math.abs(days)}d` : `${days}d restantes`}
                          </p>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusStyles[doc.status]}`}>{doc.status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-0.5">
                        {(doc.nrReferences || []).map(nr => (
                          <span key={nr} className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded font-mono">{nr}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                            className="p-1 text-indigo-500 hover:bg-indigo-50 rounded cursor-pointer" title="Abrir arquivo">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => openEdit(doc)} className="p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 rounded cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-400 hover:bg-red-50 rounded cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}

