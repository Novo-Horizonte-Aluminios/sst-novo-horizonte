import React, { useState, useEffect } from 'react';
import { Plus, BrainCircuit, Activity, Calendar, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

interface Employee {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  employeeId: string;
  employeeName: string;
  score: number;
  riskLevel: string;
  assessmentDate: string;
  evaluator: string;
  answers: Record<string, number>;
}

export default function PsychosocialTab() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [evaluator, setEvaluator] = useState('Dr. Marcos Patrício');
  const [answers, setAnswers] = useState<Record<string, number>>({
    q1: 3,
    q2: 3,
    q3: 3,
    q4: 3,
    q5: 3
  });

  const questions = [
    { key: 'q1', label: '1. O colaborador demonstra fadiga constante ou sonolência durante a jornada?' },
    { key: 'q2', label: '2. Existem relatos ou sinais de estresse recorrente associado à cobrança de prazos?' },
    { key: 'q3', label: '3. A integração interpessoal e o clima organizacional da equipe parecem saudáveis?' },
    { key: 'q4', label: '4. O colaborador possui canais claros de suporte psicológico ou escuta ativa?' },
    { key: 'q5', label: '5. Há equilíbrio perceptível entre a carga horária de trabalho e os períodos de descanso?' }
  ];

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/psychosocial');
      const data = await res.json();
      setAssessments(data);
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchAssessments(), fetchEmployees()]);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !evaluator) return;

    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!employee) return;

    // Calculate score
    // Q1, Q2: 1 to 5 (higher is bad)
    // Q3, Q4, Q5: 1 to 5 (higher is good, so we invert them: 6 - score)
    const scoreVal = 
      answers.q1 + 
      answers.q2 + 
      (6 - answers.q3) + 
      (6 - answers.q4) + 
      (6 - answers.q5);

    let riskLevel = 'Baixo';
    if (scoreVal >= 18) riskLevel = 'Alto';
    else if (scoreVal >= 12) riskLevel = 'Médio';

    try {
      const res = await fetch('/api/psychosocial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          employeeName: employee.name,
          answers,
          score: scoreVal,
          riskLevel,
          assessmentDate: new Date().toISOString().split('T')[0],
          evaluator
        })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Avaliação Registrada!',
          text: `Score: ${scoreVal} - Risco ${riskLevel}`,
          icon: 'success',
          customClass: { popup: 'swal-modern-popup' }
        });
        setShowAddModal(false);
        setSelectedEmployeeId('');
        setAnswers({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 });
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">NR-01: Avaliação de Risco Psicossocial</h3>
          <p className="text-slate-550 text-[11px] leading-relaxed">Identificação precoce de fatores estressores e fadiga para conformidade GRO/PGR (NR-01)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Realizar Avaliação</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(assess => (
            <div key={assess.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="bg-purple-50 text-purple-700 p-2.5 rounded-xl">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase ${
                    assess.riskLevel === 'Baixo' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                      : assess.riskLevel === 'Médio'
                      ? 'bg-amber-50 text-amber-700 border border-amber-250'
                      : 'bg-rose-50 text-rose-700 border border-rose-250'
                  }`}>
                    Risco {assess.riskLevel}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-[14px] text-slate-800 dark:text-slate-100 leading-snug tracking-tight">{assess.employeeName}</h4>
                  <p className="text-slate-450 font-mono text-[9px] mt-0.5">Avaliador: {assess.evaluator}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-650 font-bold">
                  <div>
                    <span className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Data da Avaliação</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {assess.assessmentDate.slice(0, 10)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Score Consolidado</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-slate-400" /> {assess.score} pontos</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-450 font-bold border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              Nenhuma avaliação cadastrada ainda.
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Avaliação de Risco Psicossocial</h3>
                <p className="text-[10px] text-slate-400 mt-1">Escala de fatores psicossociais integrada à NR-01</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Selecione o Colaborador</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary bg-white dark:bg-slate-800 text-[12px]"
                  required
                >
                  <option value="">Selecione quem será avaliado...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Avaliador Responsável</label>
                <input
                  type="text"
                  required
                  value={evaluator}
                  onChange={(e) => setEvaluator(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-brand-primary text-[12px]"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">Responda as questões (1 = Discordo Totalmente, 5 = Concordo Totalmente)</p>
                {questions.map(q => (
                  <div key={q.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] sm:max-w-xs">{q.label}</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswers({...answers, [q.key]: val})}
                          className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-[11px] border transition cursor-pointer ${
                            answers[q.key] === val
                              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-655 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
