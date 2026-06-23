import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import Swal from 'sweetalert2';

interface ExamType {
  id: string;
  name: string;
  description: string;
  periodicityMonths: number;
}

export default function AsoExamTypesTab() {
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExam, setNewExam] = useState({
    name: '',
    description: '',
    periodicityMonths: 12
  });

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/aso-exam-types');
      const data = await res.json();
      setExams(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchExams();
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.name) return;

    try {
      const res = await fetch('/api/aso-exam-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam)
      });

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Exame complementar cadastrado com sucesso.',
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setNewExam({ name: '', description: '', periodicityMonths: 12 });
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExam = async (id: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Todos os agendamentos vinculados a este exame podem sofrer alterações!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal-modern-popup', confirmButton: 'swal-modern-confirm', cancelButton: 'swal-modern-cancel' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/aso-exam-types/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Excluído!',
            text: 'O exame complementar foi removido.',
            icon: 'success',
            customClass: { popup: 'swal-modern-popup' }
          });
          fetchExams();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">Tipos de Exames Complementares</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Configuração da matriz de exames de acordo com os riscos de cada função (PCMSO)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Exame</span>
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
                <th>Nome do Exame</th>
                <th>Descrição / Objetivo Clínico</th>
                <th>Periodicidade (Meses)</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id}>
                  <td className="font-bold text-slate-800 dark:text-slate-100">{exam.name}</td>
                  <td className="text-slate-500 dark:text-slate-400 max-w-md truncate">{exam.description || 'Nenhuma descrição adicionada'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3 h-3" /> {exam.periodicityMonths} meses
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400 font-bold">
                    Nenhum exame complementar cadastrado.
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
                <h3 className="font-bold text-base">Novo Exame Clínico Complementar</h3>
                <p className="text-[10px] text-slate-400 mt-1">Configuração de periodicidade preventiva de saúde</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Nome do Exame</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Audiometria tonal e vocal"
                  value={newExam.name}
                  onChange={(e) => setNewExam({...newExam, name: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Descrição / Instruções do Exame</label>
                <textarea
                  placeholder="Ex: Realização de audiometria para avaliação de perda auditiva induzida por ruído ocupacional..."
                  value={newExam.description}
                  onChange={(e) => setNewExam({...newExam, description: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px] h-20 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Periodicidade (Meses)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExam.periodicityMonths}
                  onChange={(e) => setNewExam({...newExam, periodicityMonths: parseInt(e.target.value) || 12})}
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
                  Salvar Exame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
