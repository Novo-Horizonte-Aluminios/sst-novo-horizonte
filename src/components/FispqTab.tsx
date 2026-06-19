import React, { useState, useEffect } from 'react';
import {
  Flame, FileText, Search, Shield, AlertCircle, Download, Plus,
  Trash2, Edit3, Save, X, ChevronDown, ChevronRight, FlaskConical,
  AlertTriangle, PackageCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

interface FISPQDocument {
  id: string;
  chemicalName: string;
  manufacturer: string;
  revisionDate: string;
  version: string;
  ghsClassification: string;
  casNumber?: string;
  physicalState?: string;
  riskPhrases?: string[];
  epcMeasures?: string[];
  fileUrl?: string;
}

const GHS_PICTOGRAMS: Record<string, { emoji: string; label: string }> = {
  'inflamável': { emoji: '🔥', label: 'Inflamável' },
  'tóxico': { emoji: '☠️', label: 'Tóxico' },
  'corrosivo': { emoji: '🧪', label: 'Corrosivo' },
  'irritante': { emoji: '❗', label: 'Irritante' },
  'oxidante': { emoji: '⭕', label: 'Oxidante' },
  'aquático': { emoji: '🐟', label: 'Perigo Aquático' },
  'explosivo': { emoji: '💥', label: 'Explosivo' },
  'comprimido': { emoji: '🫙', label: 'Gás comprimido' },
  'saúde grave': { emoji: '🦺', label: 'Perigo grave à saúde' },
};

function detectPictograms(classification: string): string[] {
  const lower = classification.toLowerCase();
  return Object.entries(GHS_PICTOGRAMS)
    .filter(([key]) => lower.includes(key))
    .map(([, val]) => val.emoji);
}

const emptyForm = {
  chemicalName: '', manufacturer: '', revisionDate: '', version: '01',
  ghsClassification: '', casNumber: '', physicalState: '',
  riskPhrases: [] as string[], epcMeasures: [] as string[], fileUrl: ''
};

export default function FispqTab() {
  const [fispqDocs, setFispqDocs] = useState<FISPQDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FISPQDocument | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [phraseInput, setPhraseInput] = useState('');
  const [epcInput, setEpcInput] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/fispq');
      if (res.ok) setFispqDocs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const openNew = () => { setEditingDoc(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (doc: FISPQDocument) => {
    setEditingDoc(doc);
    setForm({
      chemicalName: doc.chemicalName, manufacturer: doc.manufacturer,
      revisionDate: doc.revisionDate || '', version: doc.version || '01',
      ghsClassification: doc.ghsClassification, casNumber: doc.casNumber || '',
      physicalState: doc.physicalState || '',
      riskPhrases: doc.riskPhrases || [], epcMeasures: doc.epcMeasures || [],
      fileUrl: doc.fileUrl || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.chemicalName || !form.manufacturer) {
      Swal.fire('Atenção', 'Preencha o nome do produto e fabricante.', 'warning');
      return;
    }
    try {
      let res: Response;
      if (editingDoc) {
        res = await fetch(`/api/fispq/${editingDoc.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (res.ok) {
          const updated = await res.json();
          setFispqDocs(prev => prev.map(d => d.id === editingDoc.id ? updated : d));
        }
      } else {
        res = await fetch('/api/fispq', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (res.ok) {
          const created = await res.json();
          setFispqDocs(prev => [created, ...prev]);
        }
      }
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    const confirmResult = await Swal.fire({
      title: 'Atenção',
      text: 'Excluir esta FISPQ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmResult.isConfirmed) return;
    await fetch(`/api/fispq/${id}`, { method: 'DELETE' });
    setFispqDocs(prev => prev.filter(d => d.id !== id));
  };

  const filtered = fispqDocs.filter(f =>
    f.chemicalName.toLowerCase().includes(search.toLowerCase()) ||
    f.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
    (f.casNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 text-xs text-slate-700 font-sans">
      {/* Header */}
      <div className="bg-white p-4 rounded border border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            Fichas de Segurança de Produtos Químicos (FISPQ / SDS)
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Catalogação conforme GHS e ABNT NBR 14725. Obrigatório por NR-20 e NR-26.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-amber-500 text-white rounded transition hover:bg-amber-600 cursor-pointer shrink-0 h-8">
          <Plus className="w-3.5 h-3.5" /> Nova FISPQ
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total de Produtos</span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">{fispqDocs.length}</span>
          <span className="text-[9px] text-slate-400">substâncias cadastradas</span>
        </div>
        <div className="bg-white p-3 rounded border border-slate-200">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Classificação GHS</span>
          <span className="text-xl font-extrabold text-amber-600 block mt-1">{fispqDocs.filter(f => f.ghsClassification).length}</span>
          <span className="text-[9px] text-slate-400">fichas com GHS</span>
        </div>
        <div className="bg-white p-3 rounded border border-slate-200">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Conformidade NR-26</span>
          <span className="text-xl font-extrabold text-emerald-600 block mt-1">
            {fispqDocs.length > 0 ? Math.round((fispqDocs.filter(f => f.ghsClassification && f.epcMeasures?.length).length / fispqDocs.length) * 100) : 0}%
          </span>
          <span className="text-[9px] text-slate-400">fichas completas</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
        <input type="text" placeholder="Buscar por produto, fabricante, CAS..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-amber-500" />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-amber-200 rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              {editingDoc ? 'Editar FISPQ' : 'Nova Ficha de Segurança'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Nome do Produto Químico *</label>
              <input type="text" value={form.chemicalName} onChange={e => setForm(f => ({ ...f, chemicalName: e.target.value }))}
                placeholder="Ex: Alumínio em Pó (Pó Metálico)"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Fabricante *</label>
              <input type="text" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Número CAS</label>
              <input type="text" value={form.casNumber} onChange={e => setForm(f => ({ ...f, casNumber: e.target.value }))}
                placeholder="Ex: 7429-90-5"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Estado Físico</label>
              <select value={form.physicalState} onChange={e => setForm(f => ({ ...f, physicalState: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none">
                <option value="">Selecione...</option>
                {['Sólido','Líquido','Gasoso','Pó','Pastoso','Aerossol'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Data de Revisão</label>
              <input type="date" value={form.revisionDate} onChange={e => setForm(f => ({ ...f, revisionDate: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Versão</label>
              <input type="text" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="Ex: 01, 02..."
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Classificação GHS (Seção 2)</label>
              <textarea value={form.ghsClassification} onChange={e => setForm(f => ({ ...f, ghsClassification: e.target.value }))} rows={2}
                placeholder="Ex: Perigo: Inflamável (Cat.2); Tóxico (Cat.4)..."
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Frases de Risco (H-Phrases)</label>
              <div className="flex gap-1.5 mb-1.5">
                <input type="text" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} placeholder="Ex: H228 - Sólido inflamável"
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && phraseInput) { setForm(f => ({ ...f, riskPhrases: [...f.riskPhrases, phraseInput] })); setPhraseInput(''); } }} />
                <button onClick={() => { if (phraseInput) { setForm(f => ({ ...f, riskPhrases: [...f.riskPhrases, phraseInput] })); setPhraseInput(''); } }}
                  className="px-3 py-1.5 text-[10px] bg-red-50 text-red-700 font-bold rounded hover:bg-red-100 cursor-pointer">+</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.riskPhrases.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 text-[9px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded">
                    {p}
                    <button onClick={() => setForm(f => ({ ...f, riskPhrases: f.riskPhrases.filter((_, j) => j !== i) }))} className="cursor-pointer hover:text-red-900">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Medidas de Proteção (EPC/EPI)</label>
              <div className="flex gap-1.5 mb-1.5">
                <input type="text" value={epcInput} onChange={e => setEpcInput(e.target.value)} placeholder="Ex: Luvas de nitrila (NR-06/CA)"
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && epcInput) { setForm(f => ({ ...f, epcMeasures: [...f.epcMeasures, epcInput] })); setEpcInput(''); } }} />
                <button onClick={() => { if (epcInput) { setForm(f => ({ ...f, epcMeasures: [...f.epcMeasures, epcInput] })); setEpcInput(''); } }}
                  className="px-3 py-1.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold rounded hover:bg-emerald-100 cursor-pointer">+</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.epcMeasures.map((m, i) => (
                  <span key={i} className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                    {m}
                    <button onClick={() => setForm(f => ({ ...f, epcMeasures: f.epcMeasures.filter((_, j) => j !== i) }))} className="cursor-pointer hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">URL da Ficha PDF (opcional)</label>
              <input type="text" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-amber-500 text-white rounded hover:bg-amber-600 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> {editingDoc ? 'Salvar Alterações' : 'Cadastrar FISPQ'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cards List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">Carregando fichas de segurança...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded border border-slate-200 p-8 text-center">
          <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Nenhuma FISPQ cadastrada. Adicione a primeira ficha!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(doc => {
            const pictograms = detectPictograms(doc.ghsClassification || '');
            const isExpanded = expandedId === doc.id;
            return (
              <div key={doc.id} className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-start gap-1.5">
                      <FlaskConical className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 leading-snug">{doc.chemicalName}</h4>
                        <p className="text-[10px] text-slate-400">{doc.manufacturer}</p>
                        {doc.casNumber && <p className="text-[9px] text-slate-400 font-mono">CAS: {doc.casNumber}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pictograms.length > 0 && (
                        <span className="text-sm" title="Pictogramas GHS detectados">{pictograms.join(' ')}</span>
                      )}
                      <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">v{doc.version}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3 text-amber-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Classificação GHS</span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed">{doc.ghsClassification}</p>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2">
                      {doc.physicalState && (
                        <p className="text-[10px] text-slate-500"><span className="font-bold">Estado físico:</span> {doc.physicalState}</p>
                      )}
                      {(doc.riskPhrases || []).length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1">Frases de Risco (H-Phrases)</p>
                          <div className="space-y-0.5">
                            {(doc.riskPhrases || []).map((p, i) => (
                              <p key={i} className="text-[10px] text-red-700 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{p}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {(doc.epcMeasures || []).length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Proteção (EPC/EPI)</p>
                          <div className="space-y-0.5">
                            {(doc.epcMeasures || []).map((m, i) => (
                              <p key={i} className="text-[10px] text-emerald-700 flex items-start gap-1">
                                <PackageCheck className="w-3 h-3 shrink-0 mt-0.5" />{m}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[9px]">Rev: {doc.revisionDate || 'N/D'}</span>
                      <button onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                        className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer">
                        {isExpanded ? <><ChevronDown className="w-3 h-3" />Recolher</> : <><ChevronRight className="w-3 h-3" />Ver detalhes</>}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-0.5 text-safety-green hover:underline font-bold text-[9px] font-mono cursor-pointer">
                          <Download className="w-3.5 h-3.5" />PDF
                        </a>
                      )}
                      <button onClick={() => openEdit(doc)} className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-400 hover:bg-red-50 rounded cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

