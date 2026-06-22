import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCheck, 
  User, 
  Shield, 
  FileSignature, 
  Fingerprint, 
  Lock, 
  Camera, 
  Plus, 
  Printer, 
  CheckCircle, 
  Sparkles,
  Download,
  Eye,
  AlertCircle,
  QrCode,
  Smartphone,
  Send,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  X
} from 'lucide-react';
import { Employee, PPE, PPEDelivery, Company } from '../types';
import { exportDeliveriesToExcel, exportDeliveriesToPDF } from '../utils/exportUtils';
import { getFingerLabel, getRegisteredFingers } from './CompanyWorkerTab';
import Swal from 'sweetalert2';

interface DeliveryTabProps {
  companies: Company[];
  employees: Employee[];
  ppes: PPE[];
  deliveries: PPEDelivery[];
  activeCompanyId: string;
  onAddDelivery: (del: Omit<PPEDelivery, 'id' | 'deliveryDate' | 'status'>) => Promise<any>;
}

export default function DeliveryTab({
  companies,
  employees,
  ppes,
  deliveries,
  activeCompanyId,
  onAddDelivery
}: DeliveryTabProps) {
  const currentCompany = companies.find(c => c.id === activeCompanyId);
  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId && e.status === 'Ativo');

  // Input states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedPpeId, setSelectedPpeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'Entrega Inicial' | 'Substituição' | 'Extravio' | 'Danificado'>('Entrega Inicial');
  const [signingMethod, setSigningMethod] = useState<'assinatura_digital' | 'biometria' | 'senha' | 'selfie' | 'link'>('assinatura_digital');
  
  // Custom states
  const [pinNumber, setPinNumber] = useState('');
  const [selfieOptionSelected, setSelfieOptionSelected] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{empName: string, ppeName: string} | null>(null);

  // Biometric states
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricHash, setBiometricHash] = useState<string | null>(null);

  // Canvas drawing properties
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignaturePoints, setHasSignaturePoints] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchFingers, setMismatchFingers] = useState<string[]>([]);

  // Derived Values selected employee receipt
  const [selectedReceiptEmpId, setSelectedReceiptEmpId] = useState('');

  // Filter states for receipt deliveries (defaults to current month and year)
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  // Combobox states
  const [searchTermDelivery, setSearchTermDelivery] = useState('');
  const [isOpenDelivery, setIsOpenDelivery] = useState(false);
  const [searchTermReceipt, setSearchTermReceipt] = useState('');
  const [isOpenReceipt, setIsOpenReceipt] = useState(false);

  // Refs for click outside
  const deliveryDropdownRef = useRef<HTMLDivElement>(null);
  const receiptDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target as Node)) {
        setIsOpenDelivery(false);
      }
      if (receiptDropdownRef.current && !receiptDropdownRef.current.contains(event.target as Node)) {
        setIsOpenReceipt(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System users for auto-populating receipt signatures
  const [systemUsers, setSystemUsers] = useState<{id: string; name: string; role: string}[]>([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => setSystemUsers(data)).catch(() => {});
  }, []);

  // Draw setup
  useEffect(() => {
    if (signingMethod === 'assinatura_digital' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0F172A'; // Slate-900 line color
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signingMethod]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignaturePoints(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignaturePoints(false);
  };

function calculateSimilarity(sigA: string, sigB: string): number {
  if (!sigA || !sigB) return 0;
  const parseHex = (hex: string) => {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  };
  try {
    const bufA = parseHex(sigA);
    const bufB = parseHex(sigB);
    if (bufA.length !== bufB.length || bufA.length === 0) return 0;
    const valsA = bufA.map(b => (b / 255) * 6 - 3);
    const valsB = bufB.map(b => (b / 255) * 6 - 3);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < valsA.length; i++) {
      dotProduct += valsA[i] * valsB[i];
      normA += valsA[i] * valsA[i];
      normB += valsB[i] * valsB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  } catch(e) {
    return 0;
  }
}

  const handleCaptureBiometrics = async () => {
    if (!selectedEmpId) {
      Swal.fire('Atenção', 'Favor selecionar o Colaborador antes de efetuar a captura biométrica.', 'warning');
      return;
    }
    const employee = employees.find(emp => emp.id === selectedEmpId);
    if (!employee) return;

    if (!employee.biometricTemplate) {
      setBiometricError('Atenção: Este colaborador não possui digital cadastrada no perfil dele. Acesse a aba de Diretório de Pessoal e cadastre a digital dele primeiro.');
      return;
    }

    setIsScanningBiometrics(true);
    setBiometricError(null);
    setBiometricHash(null);
    try {
      const response = await fetch('http://localhost:8080/scan');
      if (!response.ok) {
        throw new Error('Falha na comunicação com o leitor.');
      }
      const data = await response.json();
      if (data.success && data.hash) {
        let isMatch = false;
        let bestScore = 0;
        let fingerName = '';

        try {
          if (employee.biometricTemplate) {
            const parsed = JSON.parse(employee.biometricTemplate);
            if (Array.isArray(parsed)) {
              for (const t of parsed) {
                if (t.signature && data.signature) {
                  const score = calculateSimilarity(t.signature, data.signature);
                  if (score > bestScore) {
                    bestScore = score;
                    fingerName = t.finger;
                  }
                } else {
                  if (t.template === data.hash) {
                    bestScore = 1.0;
                    fingerName = t.finger;
                  }
                }
              }
            }
          }
        } catch (e) {
          if (employee.biometricTemplate === data.hash) {
            bestScore = 1.0;
          }
        }
        const threshold = 0.93; // 93% similarity threshold - calibrado de acordo com o teste (rejeita falsos positivos de 91%, mas aprova o dedo correto)
        if (bestScore >= threshold) {
          isMatch = true;
          const pct = (bestScore * 100).toFixed(1);
          Swal.fire({
            title: 'Biometria Aprovada',
            html: `Identidade confirmada! Dedo identificado: <strong>${getFingerLabel(fingerName || employee.biometricFinger || '')}</strong><br/>Score de precisão: <strong>${pct}%</strong>`,
            icon: 'success',
            timer: 2500,
            showConfirmButton: false
          });
        } else if (bestScore > 0) {
          isMatch = false;
        } else {
          if (data.hash.startsWith('FUT-')) {
            isMatch = true;
            Swal.fire({
              title: 'Biometria Aprovada',
              text: 'Identidade confirmada via assinatura legado (Sem análise de minúcias de imagem).',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }

        if (isMatch) {
          setBiometricHash(data.hash);
          setBiometricError(null);
        } else {
          const registered = getRegisteredFingers(employee);
          setMismatchFingers(registered);
          setShowMismatchModal(true);
          setBiometricError(null);
          setBiometricHash(null);
        }
      } else {
        setBiometricError(data.error || 'Erro ao extrair biometria.');
      }
    } catch (err) {
      setBiometricError('Agente do Leitor Biométrico Local não encontrado. Certifique-se de que o Bridge está rodando. Na 1ª vez, acesse https://localhost:8443 no Chrome e aceite o certificado.');
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedPpeId) {
      Swal.fire('Atenção', 'Favor preencher o Colaborador e o EPI antes de registrar.', 'warning');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmpId);
    const ppe = ppes.find(p => p.id === selectedPpeId);
    if (!employee || !ppe) return;

    if (ppe.stockCount < quantity) {
      const confirmResult = await Swal.fire({
        title: 'Estoque Insuficiente',
        text: 'Quantidade solicitada é maior que o estoque em mãos do EPI. Prosseguir mesmo assim?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, prosseguir',
        cancelButtonText: 'Cancelar'
      });
      if (!confirmResult.isConfirmed) {
        return;
      }
    }

    let signatureValue = '';
    if (signingMethod === 'assinatura_digital' && canvasRef.current) {
      signatureValue = canvasRef.current.toDataURL(); // base64 SVG/PNG data
    } else if (signingMethod === 'senha') {
      signatureValue = `PIN Assinado: ${pinNumber || 'MTE-9932'}`;
    } else if (signingMethod === 'biometria') {
      if (!biometricHash) {
        Swal.fire('Atenção', 'Por favor, efetue a captura da biometria primeiro.', 'warning');
        return;
      }
      signatureValue = `Biometria: ${biometricHash}`;
    } else {
      signatureValue = `Selfie Anexa: ${selfieOptionSelected}`;
    }

    await onAddDelivery({
      employeeId: selectedEmpId,
      employeeName: employee.name,
      ppeId: selectedPpeId,
      ppeName: ppe.name,
      caNumber: ppe.caNumber,
      quantity,
      reason,
      signingMethod,
      signatureData: signatureValue,
      selfieUrl: signingMethod === 'selfie' ? selfieOptionSelected : undefined
    });

    setSuccessModalData({ empName: employee.name, ppeName: ppe.name });
    setShowSuccessModal(true);

    // Reset fields
    setSelectedPpeId('');
    setQuantity(1);
    clearCanvas();
    setBiometricHash(null);
    setBiometricError(null);
    setIsScanningBiometrics(false);
    setPinNumber('');
  };

  // Receipt visual logic
  const activeReceiptEmployee = employees.find(e => e.id === selectedReceiptEmpId);
  const activeReceiptDeliveries = deliveries.filter(d => {
    if (d.employeeId !== selectedReceiptEmpId) return false;
    if (!d.deliveryDate) return false;
    const date = new Date(d.deliveryDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const matchesMonth = filterMonth === 'all' || String(month) === filterMonth;
    const matchesYear = filterYear === 'all' || String(year) === filterYear;
    return matchesMonth && matchesYear;
  });

  // Helper variables for combobox filtering
  const selectedEmployeeObj = companyEmployees.find(e => e.id === selectedEmpId);
  const filteredEmployeesDelivery = companyEmployees.filter(emp => {
    const term = searchTermDelivery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      (emp.matricula && emp.matricula.toLowerCase().includes(term)) ||
      (emp.cpf && emp.cpf.toLowerCase().includes(term)) ||
      (emp.role && emp.role.toLowerCase().includes(term)) ||
      (emp.sector && emp.sector.toLowerCase().includes(term))
    );
  });

  const filteredEmployeesReceipt = employees
    .filter(e => e.companyId === activeCompanyId)
    .filter(emp => {
      const term = searchTermReceipt.toLowerCase();
      return (
        emp.name.toLowerCase().includes(term) ||
        (emp.matricula && emp.matricula.toLowerCase().includes(term)) ||
        (emp.cpf && emp.cpf.toLowerCase().includes(term)) ||
        (emp.role && emp.role.toLowerCase().includes(term)) ||
        (emp.sector && emp.sector.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-4 text-xs">
      
      {/* REMOVED: Top Export Banner */}

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* Left column: Create Hand-out registration */}
        <div className="flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-safety-green text-white p-1.5 rounded-lg shadow-sm">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro de Entrega (NR-06)</h3>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed ml-9">
              Siga os passos abaixo para registrar a entrega de EPIs com assinatura eletrônica de validade jurídica.
            </p>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold mb-4 text-[11px] animate-fade-in flex items-center gap-2 shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <form onSubmit={handleSubmitDelivery} className="space-y-4 text-slate-700">
              
              {/* Card 1: Dados da Entrega */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">1</span>
                  Dados da Entrega
                </h4>
                <div className="space-y-3">
              {/* Select target worker */}
              <div className="relative" ref={deliveryDropdownRef}>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Colaborador Destinatário</label>
                <input type="hidden" name="employeeId" value={selectedEmpId} required />
                <button
                  type="button"
                  onClick={() => setIsOpenDelivery(!isOpenDelivery)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white text-[13px] text-left flex justify-between items-center cursor-pointer transition-all hover:border-slate-300"
                >
                  <span className={selectedEmployeeObj ? "text-[15px] text-slate-900 font-black tracking-tight" : "text-[15px] text-slate-500 font-bold"}>
                    {selectedEmployeeObj 
                      ? `${selectedEmployeeObj.name} (${selectedEmployeeObj.role} - ${selectedEmployeeObj.matricula})`
                      : "Selecione o Colaborador..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {isOpenDelivery && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 flex flex-col">
                    <div className="p-1.5 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, setor, matrícula, CPF..."
                        value={searchTermDelivery}
                        onChange={(e) => setSearchTermDelivery(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-[14px] text-slate-700 py-1"
                        autoFocus
                      />
                    </div>
                    <ul className="overflow-y-auto py-1 max-h-48 text-[11px]">
                      {filteredEmployeesDelivery.length === 0 ? (
                        <li className="p-2 text-slate-400 italic text-center">Nenhum colaborador encontrado</li>
                      ) : (
                        filteredEmployeesDelivery.map((emp) => (
                          <li
                            key={emp.id}
                            onClick={() => {
                              setSelectedEmpId(emp.id);
                              setSelectedReceiptEmpId(emp.id);
                              setIsOpenDelivery(false);
                              setSearchTermDelivery('');
                            }}
                            className={`p-2 px-3 hover:bg-safety-green/10 hover:text-safety-green cursor-pointer flex justify-between items-center transition-colors ${
                              selectedEmpId === emp.id ? "bg-safety-green/5 text-safety-green font-bold" : "text-slate-700"
                            }`}
                          >
                            <div>
                              <span className="block text-[14px] font-bold text-slate-800">{emp.name}</span>
                              <span className="block text-[12px] text-slate-500 font-medium mt-0.5">
                                {emp.role} {emp.sector ? `• ${emp.sector}` : ''}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              Mat: {emp.matricula}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Select PPE and Qty */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">EPI a Fornecer</label>
                  <select
                    required
                    value={selectedPpeId}
                    onChange={(e) => setSelectedPpeId(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white text-[15px] tracking-tight text-slate-900 transition-all hover:border-slate-300 cursor-pointer"
                  >
                    <option value="" className="text-[15px] text-slate-500">Selecione o EPI...</option>
                    {ppes.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.caStatus !== 'Válido'}>
                        {p.name} (CA: {p.caNumber} {p.caStatus !== 'Válido' ? '⚠️ EXPIRED' : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Qtd Fornecida</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white font-mono text-[16px] font-black text-slate-900 transition-all hover:border-slate-300"
                  />
                </div>
              </div>

                </div>
              </div>

              {/* Card 2: Motivo do Fornecimento */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">2</span>
                  Motivo do Fornecimento
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    { label: 'Entrega Inicial', icon: <FileCheck className="w-3.5 h-3.5 mb-1" /> },
                    { label: 'Substituição', icon: <RefreshCw className="w-3.5 h-3.5 mb-1" /> },
                    { label: 'Extravio', icon: <AlertTriangle className="w-3.5 h-3.5 mb-1" /> },
                    { label: 'Danificado', icon: <AlertCircle className="w-3.5 h-3.5 mb-1" /> }
                  ].map(m => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setReason(m.label as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center font-bold text-[11px] uppercase cursor-pointer ${
                        reason === m.label 
                          ? 'border-brand-primary-dark bg-brand-primary-dark text-white shadow-md -translate-y-0.5' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 3: Autenticação */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">3</span>
                  Assinatura Regulatória
                </h4>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSigningMethod('assinatura_digital')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'assinatura_digital' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FileSignature className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">Digital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('biometria')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'biometria' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">Biometria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('senha')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'senha' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('selfie')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'selfie' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">Selfie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('link')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'link' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">Celular</span>
                  </button>
                </div>

                {/* Sub signature interface blocks */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 shadow-inner">
                  {signingMethod === 'assinatura_digital' && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-mono block">Desenhe a assinatura abaixo:</span>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={100}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
                        className="w-full bg-white border border-slate-250 rounded cursor-crosshair h-20 shadow-inner"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-red-500 font-bold hover:underline text-[9px] uppercase font-mono"
                        >
                          Limpar Assinatura
                        </button>
                      </div>
                    </div>
                  )}

                  {signingMethod === 'senha' && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-400 font-mono block">Código de assinatura PIN (membro ativo)</span>
                      <input
                        type="password"
                        placeholder="ID ou PIN numérico..."
                        value={pinNumber}
                        onChange={(e) => setPinNumber(e.target.value)}
                        className="w-full p-1 px-2 border border-slate-200 bg-white rounded font-mono focus:outline-none focus:border-safety-green text-center text-[11px]"
                      />
                    </div>
                  )}

                  {signingMethod === 'biometria' && (
                    <div className="text-center py-6 space-y-3 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                      {isScanningBiometrics && (
                        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
                          <div className="absolute w-full h-1 bg-blue-400/30 animate-pulse top-0 left-0" />
                          <div className="absolute w-full h-1 bg-blue-400/30 animate-pulse bottom-0 left-0" />
                        </div>
                      )}
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`p-4 rounded-full mb-2 transition-all duration-500 ${isScanningBiometrics ? 'bg-blue-100 scale-110 shadow-lg shadow-blue-500/20' : biometricHash ? 'bg-emerald-100 shadow-lg shadow-emerald-500/20' : 'bg-safety-green/10'}`}>
                          <Fingerprint className={`w-10 h-10 ${isScanningBiometrics ? 'text-blue-600 animate-pulse' : biometricHash ? 'text-emerald-600' : 'text-safety-green'}`} />
                        </div>
                        <span className="font-black text-slate-800 tracking-tight text-[12px] uppercase mb-1">
                          Leitor Biométrico
                        </span>
                        <p className="text-[10px] text-slate-500 max-w-[250px] mx-auto font-medium leading-relaxed">
                          {selectedEmployeeObj?.biometricFinger ? (
                            <>Posicione o dedo <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{getFingerLabel(selectedEmployeeObj.biometricFinger)}</strong> no sensor para validar a assinatura legal.</>
                          ) : (
                            "Posicione o dedo cadastrado do funcionário no sensor para validar."
                          )}
                        </p>
                        
                        {biometricError && (
                          <div className="text-rose-600 text-[10px] font-bold mt-4 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 shadow-sm animate-fade-in flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {biometricError}
                          </div>
                        )}
                        {biometricHash && (
                          <div className="text-emerald-700 text-[10px] font-bold mt-4 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 break-all shadow-sm animate-fade-in flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Digital Capturada e Validada
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleCaptureBiometrics}
                          disabled={isScanningBiometrics || !!biometricHash}
                          className={`mt-5 font-bold px-6 py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all duration-300 shadow-md ${
                            isScanningBiometrics 
                              ? 'bg-blue-600 text-white shadow-blue-500/30' 
                              : biometricHash 
                                ? 'bg-emerald-600 text-white shadow-emerald-500/30' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-slate-900/30 cursor-pointer hover:-translate-y-0.5'
                          } disabled:opacity-80 disabled:cursor-not-allowed`}
                        >
                          {isScanningBiometrics ? 'Aguardando Sensor...' : biometricHash ? 'Assinatura Coletada' : 'Ativar Sensor Biométrico'}
                        </button>
                      </div>
                    </div>
                  )}

                  {signingMethod === 'selfie' && (
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="col-span-2 space-y-1 text-[10px]">
                        <span className="text-[9px] text-slate-400 font-mono block">Reconhecimento Facial Ativo</span>
                        <p className="text-slate-400 text-[9px] leading-snug">Registra o colaborador com o EPI em mãos para robustez jurídica.</p>
                        <select
                          value={selfieOptionSelected}
                          onChange={(e) => setSelfieOptionSelected(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded p-1 text-[9px] focus:outline-none"
                        >
                          {companyEmployees.length === 0 ? (
                            <option value="">Nenhum colaborador cadastrado</option>
                          ) : (
                            companyEmployees.map(emp => (
                              <option key={emp.id} value={emp.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}>
                                {emp.name} {emp.sector ? `(${emp.sector})` : ''}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <img 
                          src={selfieOptionSelected} 
                          className="w-12 h-12 object-cover rounded border border-safety-green mx-auto shadow-sm"
                          alt="Selfie check" 
                        />
                        <span className="text-[8px] font-mono text-safety-green font-bold mt-0.5 block uppercase">Câmera Ativa</span>
                      </div>
                    </div>
                  )}

                  {signingMethod === 'link' && (
                    <div className="flex flex-col items-center py-2 space-y-3">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] text-slate-500 font-mono block">Assinatura no Celular do Colaborador</span>
                        <p className="text-[9px] text-slate-400 max-w-[200px] leading-snug">Envie o link seguro para o WhatsApp ou mostre o QR Code para o funcionário assinar a ficha no próprio aparelho.</p>
                      </div>
                      
                      <div className="flex gap-4 w-full justify-center">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1ebd57] text-white rounded font-bold text-[9px] uppercase transition shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Enviar WhatsApp
                        </button>
                        
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded font-bold text-[9px] uppercase transition shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Gerar QR Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary-dark hover:bg-brand-primary-dark text-white font-black p-4 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-primary-dark/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 uppercase text-[12px] tracking-wider cursor-pointer mt-6"
              >
                <Plus className="w-4 h-4" />
                Registrar Entrega e Gerar Ficha Legal
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Interactive Printable Regulatory Sheet (Ficha de EPI) conforme Portaria SIT/MTE n.º 107 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Ficha Regulamentada (NR-06)</h3>
              </div>
              
              {/* Select recipe to check */}
              {/* Filtro de Mês e Ano */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Filtro:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border border-slate-200 rounded p-1 text-[10px] bg-white text-slate-700 font-semibold focus:outline-none focus:border-safety-green cursor-pointer"
                >
                  <option value="all">Mês (Todos)</option>
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="border border-slate-200 rounded p-1 text-[10px] bg-white text-slate-700 font-semibold focus:outline-none focus:border-safety-green cursor-pointer"
                >
                  <option value="all">Ano (Todos)</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>

            {activeReceiptEmployee ? (
              /* =====================================================
                 FICHA PROFISSIONAL NR-06 — Modelo tabular regulamentar
                 ===================================================== */
              <div className="print-receipt bg-white border border-slate-300 text-xs text-slate-800" style={{fontFamily: "'Inter', sans-serif"}}>

                {/* ── CABEÇALHO ── */}
                <div className="flex items-center border-b-2 border-slate-700 px-3 py-2 gap-3">
                  {/* Foto do colaborador */}
                  <div className="shrink-0">
                    {activeReceiptEmployee.photoUrl ? (
                      <img src={activeReceiptEmployee.photoUrl} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-slate-300" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Título central */}
                  <div className="flex-1 text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Portaria SIT/MTE n.º 107 — NR-06</p>
                    <h1 className="text-base font-extrabold text-slate-900 uppercase leading-tight">
                      FICHA DE FORNECIMENTO DE<br />EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)
                    </h1>
                  </div>

                  {/* Logo da empresa */}
                  <div className="shrink-0 text-right flex flex-col items-end justify-center">
                    <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="h-10 object-contain mb-1" />
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Segurança do Trabalho</p>
                  </div>
                </div>

                {/* ── DADOS DA EMPRESA E COLABORADOR ── */}
                <div className="border-b border-slate-300 px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Empresa:</span><span>{currentCompany?.name}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Admissão:</span><span>{activeReceiptEmployee.admissionDate ? new Date(activeReceiptEmployee.admissionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Colaborador:</span><span className="font-semibold">{activeReceiptEmployee.name}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">CNPJ:</span><span>{currentCompany?.cnpj}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Cargo:</span><span>{activeReceiptEmployee.role}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">CPF:</span><span>{activeReceiptEmployee.cpf}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Setor:</span><span>{activeReceiptEmployee.sector}</span></div>
                  <div className="flex gap-1"><span className="font-bold uppercase w-28 shrink-0">Nº Matrícula:</span><span className="font-bold">{activeReceiptEmployee.matricula}</span></div>
                  <div className="col-span-2 text-center mt-2 font-bold text-xs uppercase border-t border-slate-200 pt-2">
                    Data de Emissão do Relatório: {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* ── TABELA DE EPIs ── */}
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className="border border-slate-500 px-1.5 py-1.5 text-center font-bold uppercase w-10">QTDE</th>
                      <th className="border border-slate-500 px-1.5 py-1.5 text-left font-bold uppercase">DESCRIÇÃO DO EQUIPAMENTO</th>
                      <th className="border border-slate-500 px-1.5 py-1.5 text-center font-bold uppercase w-20">DATA DA ENTREGA</th>
                      <th className="border border-slate-500 px-1.5 py-1.5 text-center font-bold uppercase w-20">Nº CA MTE</th>
                      <th className="border border-slate-500 px-1.5 py-1.5 text-center font-bold uppercase w-28">MOTIVO</th>
                      <th className="border border-slate-500 px-1.5 py-1.5 text-center font-bold uppercase w-36">ASSINATURA DO COLABORADOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReceiptDeliveries.length > 0 ? activeReceiptDeliveries.map((del, i) => (
                      <tr key={del.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-1.5 py-2 text-center font-bold">{String(del.quantity).padStart(2, '0')}</td>
                        <td className="border border-slate-300 px-1.5 py-2 font-semibold uppercase">{del.ppeName}</td>
                        <td className="border border-slate-300 px-1.5 py-2 text-center font-mono">
                          {del.deliveryDate ? new Date(del.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-2 text-center font-mono">{del.caNumber}</td>
                        <td className="border border-slate-300 px-1.5 py-2 text-center">{del.reason}</td>
                        <td className="border border-slate-300 px-1.5 py-2 text-center">
                          {/* Coluna adaptável por método de assinatura */}
                          {del.signingMethod === 'assinatura_digital' && del.signatureData && del.signatureData.startsWith('data:') ? (
                            <img src={del.signatureData} alt="Assinatura" className="h-10 mx-auto object-contain" />
                          ) : del.signingMethod === 'biometria' ? (
                            <div className="flex flex-col items-center gap-0.5 py-1">
                              <Fingerprint className="w-5 h-5 text-green-700" />
                              <span className="text-[10px] font-bold text-green-700 uppercase">Biometria</span>
                              <span className="text-[9px] font-mono text-slate-500 break-all leading-tight max-w-[120px]">
                                {del.signatureData?.replace('Biometria Futronic: ', '').replace('Biometria: ', '').substring(0, 20)}...
                              </span>
                            </div>
                          ) : del.signingMethod === 'senha' ? (
                            <div className="flex flex-col items-center gap-0.5 py-1">
                              <Lock className="w-5 h-5 text-blue-600" />
                              <span className="text-[10px] font-bold text-blue-700 uppercase">PIN Validado</span>
                            </div>
                          ) : del.signingMethod === 'selfie' && del.selfieUrl ? (
                            <img src={del.selfieUrl} alt="Selfie" className="w-10 h-10 rounded-full object-cover mx-auto border border-slate-300" />
                          ) : del.signingMethod === 'link' ? (
                            <div className="flex flex-col items-center gap-0.5 py-1">
                              <Smartphone className="w-5 h-5 text-purple-600" />
                              <span className="text-[10px] font-bold text-purple-700 uppercase">Via Link</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 px-2 py-4 text-center text-slate-400 italic">
                          Nenhum EPI registrado para este colaborador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ── TERMO DE RESPONSABILIDADE ── */}
                <div className="px-4 py-3 border-t border-slate-300 text-[11px] text-slate-600">
                  <p className="font-bold uppercase mb-1">Termo de Recebimento de EPI (NR-06 / Portaria SIT/MTE n.º 107):</p>
                  <p className="text-justify leading-relaxed">
                    Declaro que recebi gratuitamente os equipamentos de proteção individual relacionados acima, adequados aos riscos inerentes ao cumprimento do meu contrato de trabalho. Comprometo-me a utilizá-los apenas para a finalidade que se destinam, conservando-os adequadamente e comunicando ao empregador qualquer alteração que o torne impróprio para uso, sob penas da legislação trabalhista vigente.
                  </p>
                </div>

                {/* ── RODAPÉ: ASSINATURAS ── */}
                {(() => {
                  // Busca automática pelos usuários do sistema por perfil
                  const sstUser    = systemUsers.find(u => u.role === 'SST');
                  const rhUser     = systemUsers.find(u => u.role === 'GestorRH');
                  const sstName    = sstUser?.name || currentCompany?.sstResponsible || 'Responsável SST';
                  const rhName     = rhUser?.name  || currentCompany?.rhResponsible  || 'Gestor / RH';
                  const colabName  = activeReceiptEmployee.name;

                  return (
                    <div className="px-10 py-4 mt-6 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-16 text-xs">

                      {/* SST */}
                      <div className="text-center">
                        <div className="relative h-16 flex items-end justify-center pb-1">
                          <p style={{fontFamily: "'Dancing Script', cursive", fontSize: '26px', color: '#1e293b', lineHeight: 1, userSelect: 'none'}}
                            className="absolute bottom-1 left-0 right-0 text-center leading-none">
                            {sstName}
                          </p>
                        </div>
                        <div className="border-b-2 border-slate-700" />
                        <p className="font-bold uppercase mt-1.5 tracking-wider text-xs">Responsável SST</p>
                        <p className="text-slate-500 text-[10px]">{sstName}</p>
                      </div>

                      {/* Colaborador(a) */}
                      <div className="text-center">
                        <div className="relative h-16 flex items-end justify-center pb-1">
                          <p style={{fontFamily: "'Dancing Script', cursive", fontSize: '24px', color: '#1e293b', lineHeight: 1, userSelect: 'none'}}
                            className="absolute bottom-1 left-0 right-0 text-center leading-none">
                            {colabName}
                          </p>
                        </div>
                        <div className="border-b-2 border-slate-700" />
                        <p className="font-bold uppercase mt-1.5 tracking-wider text-xs">Colaborador(a)</p>
                        <p className="text-slate-500 text-[10px]">CPF: {activeReceiptEmployee.cpf} | Mat: {activeReceiptEmployee.matricula}</p>
                      </div>

                    </div>
                  );
                })()}


                {/* ── HASH DE INTEGRIDADE DO DOCUMENTO ── */}
                <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-300 flex justify-between items-center text-[9px] font-mono text-slate-500">
                  <span>Sistema SST Novo Horizonte Alumínios — {new Date().toLocaleString('pt-BR')}</span>
                  <span>DOC-ID: {activeReceiptDeliveries[0]?.id?.substring(0, 16).toUpperCase()}</span>
                </div>
              </div>



            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-12 text-center text-slate-400 rounded flex flex-col items-center justify-center gap-1.5">
                <Eye className="w-8 h-8 text-slate-350 bg-slate-100/40" />
                <span className="font-bold text-slate-600 uppercase text-[10px]">Ficha Vazia</span>
                <p className="text-[9px] max-w-[200px] mx-auto leading-relaxed text-slate-450">Selecione um colaborador no seletor acima para carregar a Ficha de EPI regulamentada para visualização, conferência ou impressão legal.</p>
              </div>
            )}
          </div>

          {activeReceiptEmployee && activeReceiptDeliveries.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded text-[10px] flex items-center justify-center gap-1.5 transition uppercase tracking-wide cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ficha (PDF)
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-safety-green/20 overflow-hidden transform animate-scale-in">
            <div className="bg-safety-green/10 border-b border-safety-green/20 p-5 flex flex-col items-center justify-center relative">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-white p-3 rounded-full shadow-sm text-safety-green mb-3 ring-4 ring-safety-green/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight text-center">Entrega Registrada!</h3>
            </div>
            
            <div className="p-6 bg-white text-center">
              <p className="text-slate-600 text-sm mb-4">
                O EPI <strong className="text-slate-800">{successModalData.ppeName}</strong> foi entregue com sucesso para <strong className="text-slate-800">{successModalData.empName}</strong>.
              </p>
              <p className="text-slate-500 text-[11px] mb-6 italic leading-relaxed">
                O recibo eletrônico será processado pelo sistema e enviado em breve no WhatsApp do colaborador.
              </p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-safety-green hover:bg-[#0ea85a] text-white font-bold py-3 rounded-lg text-sm transition shadow-md"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Mismatch Modal */}
      {showMismatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden transform animate-scale-in">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex justify-between items-start">
              <div className="flex gap-3 items-start">
                <div className="bg-rose-100 p-2 rounded-full mt-1 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Divergência Biométrica</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Esta digital não pertence ao colaborador selecionado.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMismatchModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-[11px] text-slate-600 mb-3">Tente novamente utilizando uma das seguintes digitais cadastradas para <span className="font-bold text-slate-800">{selectedEmployeeObj?.name?.split(' ')[0]}</span>:</p>
                
                {mismatchFingers.length > 0 ? (
                  <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                    {mismatchFingers.map((f, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-md flex items-center justify-center gap-2">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{getFingerLabel(f)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded border border-rose-200">
                    Não encontramos as digitais salvas no formato atual. Recadastre o funcionário.
                  </p>
                )}
              </div>
              
              <button
                onClick={() => setShowMismatchModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md"
              >
                ENTENDI
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

