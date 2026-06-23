import React, { useState, useEffect } from 'react';
import { Plus, Package, ShoppingCart, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

interface Ppe {
  id: string;
  name: string;
}

interface StockEntry {
  id: string;
  ppeId: string;
  ppeName: string;
  quantity: number;
  supplier: string;
  invoiceNumber: string;
  entryDate: string;
}

export default function EpiEntryTab() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [ppes, setPpes] = useState<Ppe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New stock entry form state
  const [newEntry, setNewEntry] = useState({
    ppeId: '',
    quantity: 10,
    supplier: '',
    invoiceNumber: '',
    entryDate: new Date().toISOString().split('T')[0]
  });

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/epi-stock-entries');
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPpes = async () => {
    try {
      const res = await fetch('/api/ppes');
      const data = await res.json();
      setPpes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchEntries(), fetchPpes()]);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.ppeId || !newEntry.quantity) return;

    const ppe = ppes.find(p => p.id === newEntry.ppeId);
    if (!ppe) return;

    try {
      const res = await fetch('/api/epi-stock-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEntry,
          ppeName: ppe.name
        })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Entrada de estoque lançada e estoque incrementado.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setNewEntry({
          ppeId: '',
          quantity: 10,
          supplier: '',
          invoiceNumber: '',
          entryDate: new Date().toISOString().split('T')[0]
        });
        fetchEntries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">Entrada de EPI's</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Registro de faturamento, novos lotes adquiridos e incremento automático do almoxarifado</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Entrada</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="compact-table">
            <thead>
              <tr>
                <th>EPI / Insumo</th>
                <th>Quantidade</th>
                <th>Fornecedor</th>
                <th>Nota Fiscal (NF)</th>
                <th>Data da Entrada</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td className="font-bold text-slate-800 dark:text-slate-100">{entry.ppeName}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      +{entry.quantity} un
                    </span>
                  </td>
                  <td>{entry.supplier || 'Não informado'}</td>
                  <td className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{entry.invoiceNumber || 'N/A'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" /> {entry.entryDate.slice(0, 10)}
                    </span>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-450 font-bold">
                    Nenhuma entrada de estoque registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Registrar Entrada de Lote de EPI</h3>
                <p className="text-[10px] text-slate-400 mt-1">Aumenta automaticamente o estoque físico do almoxarifado</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Selecione o EPI</label>
                <select
                  value={newEntry.ppeId}
                  onChange={(e) => setNewEntry({...newEntry, ppeId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12px]"
                  required
                >
                  <option value="">Selecione um EPI do cadastro...</option>
                  {ppes.map(ppe => (
                    <option key={ppe.id} value={ppe.id}>{ppe.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Quantidade</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newEntry.quantity}
                    onChange={(e) => setNewEntry({...newEntry, quantity: parseInt(e.target.value) || 0})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Data da Entrada</label>
                  <input
                    type="date"
                    required
                    value={newEntry.entryDate}
                    onChange={(e) => setNewEntry({...newEntry, entryDate: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Fornecedor / Distribuidor</label>
                <input
                  type="text"
                  placeholder="Ex: Distribuidora Paulista de EPIs"
                  value={newEntry.supplier}
                  onChange={(e) => setNewEntry({...newEntry, supplier: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Número da Nota Fiscal (NF)</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 001.234"
                  value={newEntry.invoiceNumber}
                  onChange={(e) => setNewEntry({...newEntry, invoiceNumber: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
