import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, ShieldAlert, Heart, User, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface AsoCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  examDate: string;
  nextExamDate: string;
  status: string;
  doctorName?: string;
  doctorCrm?: string;
  fileUrl?: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function AsoCertificatesTab() {
  const [asos, setAsos] = useState<AsoCertificate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Aso form state
  const [newAso, setNewAso] = useState({
    employeeId: '',
    examDate: '',
    nextExamDate: '',
    status: 'Apto',
    doctorName: '',
    doctorCrm: '',
    fileUrl: '#'
  });

  const fetchAsos = async () => {
    try {
      const res = await fetch('/api/aso');
      const data = await res.json();
      setAsos(data);
    } catch (e) {
      console.error('Error fetching ASOs:', e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchAsos(), fetchEmployees()]);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCreateAso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAso.employeeId || !newAso.examDate || !newAso.nextExamDate) {
      Swal.fire({
        title: 'Erro!',
        text: 'Preencha todos os campos obrigatórios.',
        icon: 'error',
        customClass: { popup: 'swal-modern-popup' }
      });
      return;
    }

    const employee = employees.find(emp => emp.id === newAso.employeeId);
    if (!employee) return;

    try {
      const res = await fetch('/api/aso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAso,
          employeeName: employee.name
        })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Atestado de Saúde Ocupacional registrado com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setNewAso({
          employeeId: '',
          examDate: '',
          nextExamDate: '',
          status: 'Apto',
          doctorName: '',
          doctorCrm: '',
          fileUrl: '#'
        });
        fetchAsos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAso = async (id: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Você não poderá reverter esta ação!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal-modern-popup', confirmButton: 'swal-modern-confirm', cancelButton: 'swal-modern-cancel' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/aso/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Excluído!',
            text: 'O registro do ASO foi deletado.',
            icon: 'success',
            customClass: { popup: 'swal-modern-popup' }
          });
          fetchAsos();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredAsos = asos.filter(aso =>
    aso.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    (aso.doctorName && aso.doctorName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou médico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-[12px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all hover:border-slate-300 dark:border-slate-600 shadow-sm font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Registro de ASO</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAsos.map((aso) => (
            <div key={aso.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-brand-primary">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase ${
                    aso.status === 'Apto' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {aso.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-[14px] text-slate-800 dark:text-slate-100 leading-snug tracking-tight">{aso.employeeName}</h4>
                  <p className="text-slate-400 font-mono text-[9.5px] mt-0.5">ID Colaborador: {aso.employeeId}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-650 font-sans font-bold">
                  <div>
                    <span className="text-slate-450 uppercase text-[8px] font-bold block mb-0.5">Realizado em</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {aso.examDate.slice(0, 10)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 uppercase text-[8px] font-bold block mb-0.5">Validade/Próximo</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {aso.nextExamDate.slice(0, 10)}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200 dark:border-slate-700/60 pt-2 mt-1">
                    <span className="text-slate-450 uppercase text-[8px] font-bold block mb-0.5">Médico Examinador</span>
                    <span className="text-slate-700 dark:text-slate-200 truncate block">{aso.doctorName || 'Não especificado'} ({aso.doctorCrm || 'CRM/SP -'})</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 mt-4">
                <button
                  onClick={() => handleDeleteAso(aso.id)}
                  className="text-rose-500 font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Registrar Atestado de Saúde Ocupacional (ASO)</h3>
                <p className="text-[10px] text-slate-400 mt-1">Lançamento de saúde ocupacional integrado para eSocial e GRO</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateAso} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Selecione o Colaborador</label>
                <select
                  value={newAso.employeeId}
                  onChange={(e) => setNewAso({...newAso, employeeId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12px] font-medium"
                  required
                >
                  <option value="">Selecione um funcionário...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Data do Exame</label>
                  <input
                    type="date"
                    required
                    value={newAso.examDate}
                    onChange={(e) => {
                      const nextDate = new Date(e.target.value);
                      nextDate.setFullYear(nextDate.getFullYear() + 1); // 1 year periodicity by default
                      setNewAso({
                        ...newAso,
                        examDate: e.target.value,
                        nextExamDate: nextDate.toISOString().split('T')[0]
                      });
                    }}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Vencimento / Próximo Exame</label>
                  <input
                    type="date"
                    required
                    value={newAso.nextExamDate}
                    onChange={(e) => setNewAso({...newAso, nextExamDate: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Médico Emissor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Roberto Alves"
                    value={newAso.doctorName}
                    onChange={(e) => setNewAso({...newAso, doctorName: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">CRM do Médico</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CRM/SP 123456"
                    value={newAso.doctorCrm}
                    onChange={(e) => setNewAso({...newAso, doctorCrm: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand-primary text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Resultado do ASO</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Apto"
                      checked={newAso.status === 'Apto'}
                      onChange={() => setNewAso({...newAso, status: 'Apto'})}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    Apto
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Inapto"
                      checked={newAso.status === 'Inapto'}
                      onChange={() => setNewAso({...newAso, status: 'Inapto'})}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    Inapto
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition"
                >
                  Confirmar ASO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
