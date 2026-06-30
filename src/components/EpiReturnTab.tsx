import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Calendar, FileText, Search, User, Shield, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

interface Employee {
  id: string;
  name: string;
  role?: string;
  sector?: string;
  matricula?: string;
  photoUrl?: string;
}

interface Ppe {
  id: string;
  name: string;
  brand?: string;
  caNumber?: string;
  photoUrl?: string;
}

interface EpiReturn {
  id: string;
  employeeId: string;
  employeeName: string;
  ppeId: string;
  ppeName: string;
  quantity: number;
  reason: string;
  returnDate: string;
}

export default function EpiReturnTab() {
  const [returns, setReturns] = useState<EpiReturn[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [ppes, setPpes] = useState<Ppe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Combobox refs and states
  const empDropdownRef = useRef<HTMLDivElement>(null);
  const ppeDropdownRef = useRef<HTMLDivElement>(null);
  const [searchTermEmp, setSearchTermEmp] = useState('');
  const [isOpenEmp, setIsOpenEmp] = useState(false);
  const [searchTermPpe, setSearchTermPpe] = useState('');
  const [isOpenPpe, setIsOpenPpe] = useState(false);

  // New return form state
  const [newReturn, setNewReturn] = useState({
    employeeId: '',
    ppeId: '',
    quantity: 1,
    reason: 'Desgastado',
    returnDate: new Date().toISOString().split('T')[0]
  });

  const fetchReturns = async () => {
    try {
      const res = await fetch('/api/epi-returns');
      const data = await res.json();
      setReturns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
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
      await Promise.all([fetchReturns(), fetchEmployees(), fetchPpes()]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target as Node)) {
        setIsOpenEmp(false);
      }
      if (ppeDropdownRef.current && !ppeDropdownRef.current.contains(event.target as Node)) {
        setIsOpenPpe(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturn.employeeId || !newReturn.ppeId || !newReturn.quantity) return;

    const employee = employees.find(emp => emp.id === newReturn.employeeId);
    const ppe = ppes.find(p => p.id === newReturn.ppeId);
    if (!employee || !ppe) return;

    try {
      const res = await fetch('/api/epi-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReturn,
          employeeName: employee.name,
          ppeName: ppe.name
        })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Devolução de EPI registrada com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setNewReturn({
          employeeId: '',
          ppeId: '',
          quantity: 1,
          reason: 'Desgastado',
          returnDate: new Date().toISOString().split('T')[0]
        });
        fetchReturns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">Devolução e Descarte de EPI's</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Registro de devolução de EPIs usados, higienização ou descarte regulamentar por desgaste</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Devolução</span>
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
                <th>Colaborador</th>
                <th>EPI Devolvido</th>
                <th>Qtd</th>
                <th>Motivo / Status do Item</th>
                <th>Data da Devolução</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => (
                <tr key={ret.id}>
                  <td className="font-bold text-slate-800 dark:text-slate-100">{ret.employeeName}</td>
                  <td>{ret.ppeName}</td>
                  <td>{ret.quantity} un</td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      ret.reason === 'Danificado' || ret.reason === 'Descartado' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-105' 
                        : 'bg-blue-50 text-blue-700 border border-blue-105'
                    }`}>
                      {ret.reason}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" /> {ret.returnDate.slice(0, 10)}
                    </span>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-450 font-bold">
                    Nenhuma devolução registrada.
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
                <h3 className="font-bold text-base">Registrar Retorno / Devolução de EPI</h3>
                <p className="text-[10px] text-slate-400 mt-1">Garante a rastreabilidade do ciclo de vida dos insumos (eSocial)</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-6 space-y-4">
              {/* Employee Combobox Selection */}
              <div className="relative" ref={empDropdownRef}>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Selecione o Colaborador</label>
                <input type="hidden" name="employeeId" value={newReturn.employeeId} required />
                <button
                  type="button"
                  onClick={() => setIsOpenEmp(!isOpenEmp)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12.5px] text-left flex justify-between items-center cursor-pointer"
                >
                  <span className={newReturn.employeeId ? "text-slate-900 dark:text-white font-bold" : "text-slate-500"}>
                    {newReturn.employeeId && employees.find(e => e.id === newReturn.employeeId)
                      ? employees.find(e => e.id === newReturn.employeeId)?.name
                      : "Selecione quem está devolvendo..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {isOpenEmp && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-h-56 flex flex-col">
                    <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, matrícula..."
                        value={searchTermEmp}
                        onChange={(e) => setSearchTermEmp(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-[12px] text-slate-700 dark:text-slate-200 py-0.5"
                        autoFocus
                      />
                    </div>
                    <ul className="overflow-y-auto py-1 max-h-40 text-[11px]">
                      {employees.filter(emp => {
                        const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                        const term = normalize(searchTermEmp);
                        return normalize(emp.name).includes(term) || normalize(emp.matricula).includes(term);
                      }).length === 0 ? (
                        <li className="p-2 text-slate-400 italic text-center">Nenhum colaborador encontrado</li>
                      ) : (
                        employees.filter(emp => {
                          const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const term = normalize(searchTermEmp);
                          return normalize(emp.name).includes(term) || normalize(emp.matricula).includes(term);
                        }).map((emp) => (
                          <li
                            key={emp.id}
                            onClick={() => {
                              setNewReturn({ ...newReturn, employeeId: emp.id });
                              setIsOpenEmp(false);
                              setSearchTermEmp('');
                            }}
                            className={`p-2 px-3 hover:bg-brand-primary-light hover:text-brand-primary-dark cursor-pointer flex justify-between items-center transition-colors ${
                              newReturn.employeeId === emp.id ? "bg-brand-primary-light text-brand-primary font-bold" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {emp.photoUrl ? (
                                <img src={emp.photoUrl} alt={emp.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                              )}
                              <span>{emp.name}</span>
                            </div>
                            {emp.matricula && <span className="text-[9px] text-slate-400 font-mono">Mat: {emp.matricula}</span>}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* PPE Combobox Selection */}
              <div className="relative" ref={ppeDropdownRef}>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Selecione o EPI</label>
                <input type="hidden" name="ppeId" value={newReturn.ppeId} required />
                <button
                  type="button"
                  onClick={() => setIsOpenPpe(!isOpenPpe)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12.5px] text-left flex justify-between items-center cursor-pointer"
                >
                  <span className={newReturn.ppeId ? "text-slate-900 dark:text-white font-bold" : "text-slate-500"}>
                    {newReturn.ppeId && ppes.find(p => p.id === newReturn.ppeId)
                      ? ppes.find(p => p.id === newReturn.ppeId)?.name
                      : "Selecione o EPI a devolver..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {isOpenPpe && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-h-56 flex flex-col">
                    <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Buscar EPI por nome, CA..."
                        value={searchTermPpe}
                        onChange={(e) => setSearchTermPpe(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-[12px] text-slate-700 dark:text-slate-200 py-0.5"
                        autoFocus
                      />
                    </div>
                    <ul className="overflow-y-auto py-1 max-h-40 text-[11px]">
                      {ppes.filter(p => {
                        const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                        const term = normalize(searchTermPpe);
                        return normalize(p.name).includes(term) || normalize(p.caNumber || "").includes(term);
                      }).length === 0 ? (
                        <li className="p-2 text-slate-400 italic text-center">Nenhum EPI encontrado</li>
                      ) : (
                        ppes.filter(p => {
                          const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const term = normalize(searchTermPpe);
                          return normalize(p.name).includes(term) || normalize(p.caNumber || "").includes(term);
                        }).map((p) => (
                          <li
                            key={p.id}
                            onClick={() => {
                              setNewReturn({ ...newReturn, ppeId: p.id });
                              setIsOpenPpe(false);
                              setSearchTermPpe('');
                            }}
                            className={`p-2 px-3 hover:bg-brand-primary-light hover:text-brand-primary-dark cursor-pointer flex justify-between items-center transition-colors ${
                              newReturn.ppeId === p.id ? "bg-brand-primary-light text-brand-primary font-bold" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-6 h-6 rounded object-cover shrink-0 border border-slate-200" />
                              ) : (
                                <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                              )}
                              <span>{p.name}</span>
                            </div>
                            {p.caNumber && <span className="text-[9px] text-slate-400 font-mono">CA: {p.caNumber}</span>}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Quantidade</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newReturn.quantity}
                    onChange={(e) => setNewReturn({...newReturn, quantity: parseInt(e.target.value) || 0})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Data de Retorno</label>
                  <input
                    type="date"
                    required
                    value={newReturn.returnDate}
                    onChange={(e) => setNewReturn({...newReturn, returnDate: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Motivo / Condição do Item</label>
                <select
                  value={newReturn.reason}
                  onChange={(e) => setNewReturn({...newReturn, reason: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12px]"
                >
                  <option value="Desgastado">Desgastado pelo tempo de uso</option>
                  <option value="Danificado">Danificado / Quebrado (Descarte)</option>
                  <option value="Higienização">Devolvido para Higienização</option>
                  <option value="Desligamento">Demissão / Devolução Geral</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-655 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition"
                >
                  Registrar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
