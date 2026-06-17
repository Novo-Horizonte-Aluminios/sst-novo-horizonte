import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  PlayCircle,
  XCircle,
  CalendarDays
} from 'lucide-react';
import { Employee, Training, EmployeeTraining } from '../types';
import { LMS_QUIZZES } from '../utils/mockData.js';

interface TrainingTabProps {
  employees: Employee[];
  trainings: Training[];
  employeeTrainings: EmployeeTraining[];
  activeCompanyId: string;
  onAddCertification: (cert: Omit<EmployeeTraining, 'id' | 'status'>) => Promise<any>;
}

export default function TrainingTab({
  employees,
  trainings,
  employeeTrainings,
  activeCompanyId,
  onAddCertification
}: TrainingTabProps) {
  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId && e.status === 'Ativo');
  
  // Quiz LMS states
  const [activeEmpId, setActiveEmpId] = useState('');
  const [activeTrainingId, setActiveTrainingId] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Filter certifications to active company
  const activeCerts = employeeTrainings.filter(et => {
    const employee = employees.find(e => e.id === et.employeeId);
    return employee?.companyId === activeCompanyId;
  });

  const selectedTraining = trainings.find(t => t.id === activeTrainingId);
  const activeQuizQuestions = selectedTraining ? LMS_QUIZZES[selectedTraining.nr] || [] : [];

  const handleStartQuiz = () => {
    if (!activeEmpId || !activeTrainingId) {
      alert('Favor selecionar o Colaborador e a qualificação NR primeiro.');
      return;
    }
    setQuizStarted(true);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setQuizFinished(false);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    // Check answer
    const currentQuestion = activeQuizQuestions[currentQuestionIdx];
    if (selectedAnswer === currentQuestion.correct) {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionIdx + 1 < activeQuizQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed! Write new certificate
      setQuizFinished(true);
      const isPass = (correctCount + (selectedAnswer === currentQuestion.correct ? 1 : 0)) >= activeQuizQuestions.length / 2;
      
      const finalScore = Math.round(((correctCount + (selectedAnswer === currentQuestion.correct ? 1 : 0)) / activeQuizQuestions.length) * 100);

      const employee = employees.find(e => e.id === activeEmpId);
      if (employee && selectedTraining && isPass) {
        onAddCertification({
          employeeId: activeEmpId,
          employeeName: employee.name,
          trainingId: activeTrainingId,
          trainingTitle: selectedTraining.title,
          nr: selectedTraining.nr,
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + selectedTraining.expiryMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          score: finalScore
        });
      }
    }
  };  return (
    <div className="space-y-4 text-xs">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column: LMS Online Exam Suite */}
        <div className="lg:col-span-1 bg-white p-4 rounded border border-slate-200 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-safety-green animate-pulse" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">LMS & Prova Regulamentadora</h3>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Portal de exames integrados para emissão automatizada de certificados conforme diretrizes de proficiência das NRs.
            </p>

            {!quizStarted ? (
              <div className="space-y-3">
                {/* Select employee to take quiz */}
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Trabalhador Examinado</label>
                  <select
                    value={activeEmpId}
                    onChange={(e) => setActiveEmpId(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="">Selecione o Colaborador...</option>
                    {companyEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.matricula})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select NR Course */}
                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Curso / Norma Reguladora</label>
                  <select
                    value={activeTrainingId}
                    onChange={(e) => setActiveTrainingId(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="">Selecione a NR de Formação...</option>
                    {trainings.map((t) => (
                      <option key={t.id} value={t.id}>{t.nr} - {t.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full bg-[#1e293b] hover:bg-[#0f172a] hover:text-white transition font-bold p-2.5 rounded flex items-center justify-center gap-1.5 text-white uppercase text-[10px] tracking-wide cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-safety-green" />
                  Iniciar Avaliação Online
                </button>
              </div>
            ) : !quizFinished ? (
              <div className="space-y-3 animate-fade-in text-slate-700">
                <div className="flex justify-between bg-safety-green/10 text-safety-green p-2 rounded border border-safety-green/20 font-bold uppercase text-[9px] tracking-wide">
                  <span>{selectedTraining?.nr} Exam Center</span>
                  <span>Questão {currentQuestionIdx + 1} de {activeQuizQuestions.length}</span>
                </div>

                {activeQuizQuestions[currentQuestionIdx] ? (
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-slate-800 text-[11px] leading-snug">
                      {activeQuizQuestions[currentQuestionIdx].question}
                    </h4>

                    <div className="space-y-1.5">
                      {activeQuizQuestions[currentQuestionIdx].options.map((opt, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setSelectedAnswer(i)}
                          className={`w-full text-left p-2 rounded border text-[11px] transition-all leading-tight ${
                            selectedAnswer === i 
                              ? 'border-safety-green bg-safety-green/10 text-safety-green font-bold' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={selectedAnswer === null}
                      onClick={handleNextQuestion}
                      className="w-full bg-safety-green hover:bg-safety-green-dark text-white font-bold p-2 rounded transition mt-2 text-[10px] uppercase font-mono tracking-wide cursor-pointer disabled:opacity-50"
                    >
                      {currentQuestionIdx + 1 === activeQuizQuestions.length ? 'Finalizar Exame' : 'Avançar Questão'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <p>Sem questionários cadastrados na base para este treinamento regulamentar ainda.</p>
                    <button onClick={() => setQuizStarted(false)} className="text-safety-green underline mt-2 font-bold font-mono">Voltar</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-safety-green mx-auto animate-bounce" />
                <h4 className="font-extrabold text-slate-800 text-xs leading-snug">Exame Concluído!</h4>
                
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-600 max-w-xs mx-auto">
                  <p className="text-[10px]">Aproveitamento total:</p>
                  <strong className="text-lg font-bold font-mono block text-safety-green mt-0.5">
                    {Math.round((correctCount / activeQuizQuestions.length) * 100)}%
                  </strong>
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                    {correctCount >= activeQuizQuestions.length / 2 
                      ? 'Parabéns! Certificado de Capacitação expedido com validação.' 
                      : 'Escore insuficiente. Repita o plano pedagógico antes de retestar.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuizStarted(false);
                    setQuizFinished(false);
                  }}
                  className="bg-[#1e293b] hover:bg-[#0f172a] transition text-white px-3 py-1.5 rounded font-bold text-[9px] uppercase"
                >
                  Confirmar e Voltar
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>Certificações autenticadas por blockchain interna</span>
            <span className="text-safety-green font-bold">Portaria SIT 231 MTE</span>
          </div>
        </div>

        {/* Right columns: Master qualification grid and certificate download links */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-tight mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-safety-green" />
              Histórico de Capacitações e Certificados
            </h3>

            {activeCerts.length > 0 ? (
              <div className="space-y-2 font-sans text-xs text-slate-700">
                {activeCerts.map((cert) => {
                  const isExpired = cert.status === 'Vencido' || new Date(cert.expiryDate) < new Date();
                  return (
                    <div key={cert.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 hover:bg-white hover:shadow-sm transition flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#1e293b] text-white font-mono font-bold px-1.5 py-0.5 rounded text-[8px]">
                            {cert.nr}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            isExpired ? 'bg-red-50 text-red-700 border border-red-200/50' : 'bg-safety-green/10 text-safety-green border border-safety-green/20'
                          }`}>
                            {isExpired ? 'Vencido' : 'Certificado Ativo'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-[11px]">{cert.employeeName}</h4>
                        <p className="text-slate-400 text-[9px] leading-tight">{cert.trainingTitle}</p>
                        
                        <div className="flex gap-3 text-[9px] text-slate-400 font-mono pt-0.5">
                          <span className="flex items-center gap-0.5 font-medium"><CalendarDays className="w-3 h-3 text-slate-400" /> Expedido em: {cert.issueDate}</span>
                          <span className="flex items-center gap-0.5 font-medium"><Clock className="w-3 h-3 text-slate-400" /> Validade: {cert.expiryDate}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-between items-end h-14">
                        <span className="text-slate-400 font-mono text-[9px]">Aproveitamento: <strong className="text-slate-800 font-bold">{cert.score}%</strong></span>
                        
                        <button
                          onClick={() => alert(`Certificação de ${cert.employeeName} referente à norma ${cert.nr} gerada com validade nacional em formato ABNT!`)}
                          className="text-safety-green font-bold hover:underline flex items-center gap-0.5 text-[10px] uppercase font-mono cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          Diploma PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-450 border border-dashed border-slate-200 rounded flex flex-col items-center justify-center gap-1.5">
                <BookOpen className="w-8 h-8 text-slate-350 bg-slate-100/40" />
                <span className="font-bold text-slate-600 uppercase text-[10px]">Sem Capacitações Registradas</span>
                <p className="text-[9px] max-w-[200px] mx-auto leading-relaxed text-slate-400">Emita um novo certificado realizando uma prova na ala integrada LMS à esquerda.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
