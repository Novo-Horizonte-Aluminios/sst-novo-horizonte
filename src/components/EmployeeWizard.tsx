import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  X,
  Phone,
  Mail,
  Trash2,
  Lock,
  Hand
} from 'lucide-react';
import { Employee } from '../types';
import PhotoSelector from './PhotoSelector';
import { maskCPF, maskPhone, maskRG } from '../utils/masks';
import { getFingerLabel, getRegisteredFingers } from './CompanyWorkerTab'; // Re-use helpers

interface EmployeeWizardProps {
  initialData: Partial<Employee>;
  isEdit: boolean;
  onSave: (emp: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
}

export default function EmployeeWizard({ initialData, isEdit, onSave, onCancel }: EmployeeWizardProps) {
  const [step, setStep] = useState(1);
  const [empData, setEmpData] = useState<Partial<Employee>>({ ...initialData });
  const [isSaving, setIsSaving] = useState(false);

  // Biometrics states
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Steps definition
  const steps = [
    { id: 1, title: 'Dados Pessoais', icon: <User className="w-4 h-4" /> },
    { id: 2, title: 'Dados Contratuais', icon: <Briefcase className="w-4 h-4" /> },
    { id: 3, title: 'Autenticação', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    // Validate PIN if provided
    if (empData.pin && (empData.pin.length < 4 || empData.pin.length > 6 || !/^\d+$/.test(empData.pin))) {
      alert("O PIN deve conter apenas números (de 4 a 6 dígitos).");
      return;
    }
    setIsSaving(true);
    await onSave(empData);
    setIsSaving(false);
  };

  const handleRegisterBiometrics = async () => {
    if (!empData.biometricFinger) {
      setBiometricError('Selecione um dedo primeiro.');
      return;
    }

    setIsScanningBiometrics(true);
    setBiometricError(null);
    try {
      const response = await fetch('http://localhost:8080/scan');
      if (!response.ok) throw new Error('Falha na comunicação com o leitor.');
      const data = await response.json();
      if (data.success && data.hash) {
        let updatedTemplates: any[] = [];
        try {
          if (empData.biometricTemplate) {
            const parsed = JSON.parse(empData.biometricTemplate);
            if (Array.isArray(parsed)) updatedTemplates = parsed;
          }
        } catch(e) {
          if (empData.biometricTemplate && empData.biometricFinger) {
            updatedTemplates.push({ finger: empData.biometricFinger, template: empData.biometricTemplate });
          }
        }
        
        updatedTemplates = updatedTemplates.filter((t:any) => t.finger !== empData.biometricFinger);
        updatedTemplates.push({ finger: empData.biometricFinger, template: data.hash, signature: data.signature });
        
        const newTemplateStr = JSON.stringify(updatedTemplates);
        setEmpData({ ...empData, biometricTemplate: newTemplateStr });
      } else {
        setBiometricError(data.error || 'Erro ao extrair biometria.');
      }
    } catch (err) {
      setBiometricError('Agente do Leitor Biométrico Local não encontrado. Certifique-se de que o Bridge está rodando.');
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  const handleClearBiometrics = () => {
    setEmpData({ ...empData, biometricTemplate: '', biometricFinger: '' });
    setBiometricError(null);
  };

  const renderHandSelector = (selectedFinger: string, registeredFingers: string[], onChange: (finger: string) => void) => {
    const hands = [
      {
        side: 'E',
        name: 'Mão Esquerda',
        fingers: [
          { code: 'E-Mínimo', name: 'Mínimo', abbrev: 'Mi', class: 'left-[10px] top-[45px]' },
          { code: 'E-Anelar', name: 'Anelar', abbrev: 'A', class: 'left-[32px] top-[22px]' },
          { code: 'E-Médio', name: 'Médio', abbrev: 'M', class: 'left-[54px] top-[14px]' },
          { code: 'E-Indicador', name: 'Indicador', abbrev: 'I', class: 'left-[76px] top-[22px]' },
          { code: 'E-Polegar', name: 'Polegar', abbrev: 'P', class: 'left-[96px] top-[50px]' },
        ]
      },
      {
        side: 'D',
        name: 'Mão Direita',
        fingers: [
          { code: 'D-Polegar', name: 'Polegar', abbrev: 'P', class: 'left-[10px] top-[50px]' },
          { code: 'D-Indicador', name: 'Indicador', abbrev: 'I', class: 'left-[30px] top-[22px]' },
          { code: 'D-Médio', name: 'Médio', abbrev: 'M', class: 'left-[52px] top-[14px]' },
          { code: 'D-Anelar', name: 'Anelar', abbrev: 'A', class: 'left-[74px] top-[22px]' },
          { code: 'D-Mínimo', name: 'Mínimo', abbrev: 'Mi', class: 'left-[96px] top-[45px]' },
        ]
      }
    ];

    return (
      <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 mt-2 shadow-inner w-full">
        <span className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-2">Selecione o dedo para cadastro</span>
        <div className="flex justify-around w-full gap-4">
          {hands.map(hand => (
            <div key={hand.side} className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-slate-600 mb-1">{hand.name}</span>
              <div className="relative w-32 h-24 border border-slate-100 bg-slate-50 rounded-xl overflow-hidden flex items-end justify-center pb-2">
                {/* Stylized hand illustration */}
                <div className="absolute inset-0 flex items-center justify-center translate-y-6 opacity-20 pointer-events-none">
                  <Hand 
                    className={`w-28 h-28 text-slate-800 ${hand.side === 'E' ? '-scale-x-100' : ''}`} 
                    strokeWidth={1.5}
                  />
                </div>
                {hand.fingers.map(finger => {
                  const isSelected = selectedFinger === finger.code;
                  return (
                    <button
                      key={finger.code}
                      type="button"
                      title={`${finger.name} - ${hand.name}`}
                      onClick={() => onChange(finger.code)}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all shadow-sm ${
                        isSelected
                          ? 'bg-safety-green text-white border-2 border-emerald-600 scale-110 z-10'
                          : registeredFingers.includes(finger.code)
                            ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 scale-105 z-10 pointer-events-none'
                            : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:scale-105'
                      } ${finger.class}`}
                    >
                      {finger.abbrev}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selectedFinger && (
          <span className="text-[10px] font-bold text-slate-700 mt-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Dedo Selecionado: <span className="text-safety-green">{getFingerLabel(selectedFinger)}</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-safety-green/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-safety-green" />
              {isEdit ? 'Editar Colaborador' : 'Cadastro de Colaborador (Wizard)'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Conformidade com o eSocial e NR-01</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer z-10 p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-safety-green rounded-full z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((s) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                    isActive 
                      ? 'bg-safety-green text-white scale-110 ring-4 ring-safety-green/20' 
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                    {s.icon}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white relative min-h-[350px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <PhotoSelector
                    photoUrl={empData.photoUrl || ''}
                    onPhotoSelected={(url) => setEmpData({ ...empData, photoUrl: url })}
                    onPhotoRemoved={() => setEmpData({ ...empData, photoUrl: '' })}
                    employeeName={empData.name || 'Novo Colaborador'}
                  />
                  <div className="flex-1 bg-blue-50/50 border border-blue-200 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-blue-800 uppercase mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Foto Base para Face ID
                    </h4>
                    <p className="text-[10px] text-blue-700/80 leading-snug">
                      A foto cadastrada aqui será usada como <strong>padrão de validação</strong> pelo sistema de Reconhecimento Facial durante as entregas de EPI. Para evitar rejeições falsas na entrega, exija uma foto clara e bem iluminada do rosto do colaborador.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Nome Completo</label>
                    <input
                      type="text"
                      value={empData.name || ''}
                      onChange={(e) => setEmpData({...empData, name: e.target.value})}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Data de Nascimento</label>
                    <input
                      type="date"
                      value={empData.birthDate || ''}
                      onChange={(e) => setEmpData({...empData, birthDate: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">CPF</label>
                    <input
                      type="text"
                      value={empData.cpf || ''}
                      onChange={(e) => setEmpData({...empData, cpf: maskCPF(e.target.value)})}
                      placeholder="000.000.000-00"
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">RG</label>
                    <input
                      type="text"
                      value={empData.rg || ''}
                      onChange={(e) => setEmpData({...empData, rg: maskRG(e.target.value)})}
                      placeholder="0.000.000"
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                    </label>
                    <input
                      type="text"
                      value={empData.phone || ''}
                      onChange={(e) => setEmpData({...empData, phone: maskPhone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                      className="w-full border-2 border-emerald-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 text-xs font-semibold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={empData.email || ''}
                      onChange={(e) => setEmpData({...empData, email: e.target.value})}
                      placeholder="email@empresa.com"
                      className="w-full border-2 border-emerald-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 text-xs font-semibold bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Matrícula Interna</label>
                    <input
                      type="text"
                      value={empData.matricula || ''}
                      onChange={(e) => setEmpData({...empData, matricula: e.target.value})}
                      placeholder="Ex: MAT-123"
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Data de Admissão</label>
                    <input
                      type="date"
                      value={empData.admissionDate || ''}
                      onChange={(e) => setEmpData({...empData, admissionDate: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Setor</label>
                    <select
                      value={empData.sector || 'Usinagem'}
                      onChange={(e) => setEmpData({...empData, sector: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold cursor-pointer"
                    >
                      <option value="Usinagem">Usinagem</option>
                      <option value="Soldagem">Soldagem</option>
                      <option value="Extrusão">Extrusão</option>
                      <option value="Logística">Logística / Almoxarifado</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Cargo</label>
                    <input
                      type="text"
                      value={empData.role || ''}
                      onChange={(e) => setEmpData({...empData, role: e.target.value})}
                      placeholder="Ex: Operador I"
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Gestor Direto</label>
                    <input
                      type="text"
                      value={empData.manager || ''}
                      onChange={(e) => setEmpData({...empData, manager: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-safety-green text-xs font-semibold"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Autenticação por PIN */}
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-5 items-start">
                  <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Registro de PIN (Senha Numérica)</h4>
                      <p className="text-[10px] text-blue-700/80 mt-0.5">O colaborador usará este PIN para aprovar entregas de EPI.</p>
                    </div>
                    <div className="max-w-xs pt-1">
                      <input
                        type="password"
                        maxLength={6}
                        value={empData.pin || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); // Somente números
                          setEmpData({...empData, pin: val});
                        }}
                        placeholder="Ex: 1234 (Apenas números)"
                        className="w-full border-2 border-blue-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-sm font-bold tracking-[0.25em] text-center"
                      />
                      <p className="text-[9px] text-blue-600 mt-1.5 text-center font-medium">De 4 a 6 dígitos numéricos.</p>
                    </div>
                  </div>
                </div>

                {/* Biometria */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">Biometria Digital</h4>
                      <p className="text-slate-500 text-[10px]">Captura biométrica para conformidade jurídica máxima.</p>
                      {biometricError && (
                        <span className="text-rose-600 font-bold block text-[10px] bg-rose-50 px-2 py-1 rounded inline-block mt-1">{biometricError}</span>
                      )}
                      {getRegisteredFingers(empData).length > 0 && !biometricError && (
                        <span className="text-emerald-600 font-bold block text-[10px] bg-emerald-50 px-2 py-1 rounded inline-block mt-1">
                          ✓ {getRegisteredFingers(empData).length} Digital(is) Cadastrada(s)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {getRegisteredFingers(empData).length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearBiometrics}
                          className="px-4 py-2 bg-white text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition text-[10px] uppercase tracking-wider border-2 border-rose-100 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRegisterBiometrics}
                          disabled={isScanningBiometrics || !empData.biometricFinger}
                          className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                          {isScanningBiometrics ? "Lendo..." : "Capturar Digital"}
                        </button>
                      )}
                    </div>
                  </div>

                  {getRegisteredFingers(empData).length === 0 && (
                    <div className="mt-4">
                      {renderHandSelector(empData.biometricFinger || '', getRegisteredFingers(empData), (finger) => setEmpData({...empData, biometricFinger: finger}))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={step === 1 ? onCancel : handlePrev}
            className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition text-[11px] uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            {step === 1 ? 'Cancelar' : <><ChevronLeft className="w-4 h-4" /> Voltar</>}
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-dark transition text-[11px] uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Avançar <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-6 py-2.5 bg-safety-green text-white font-bold rounded-xl hover:bg-safety-green-dark transition text-[11px] uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Concluir Cadastro</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
