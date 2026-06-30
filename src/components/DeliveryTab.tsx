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
import Swal from '../utils/swal';

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
  const [selfieOptionSelected, setSelfieOptionSelected] = useState('');
  const [isAnalyzingFace, setIsAnalyzingFace] = useState(false);
  const [faceMatchScore, setFaceMatchScore] = useState<number | null>(null);
  const [baseFaceDescriptor, setBaseFaceDescriptor] = useState<Float32Array | null>(null);

  // Webcam states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{empName: string, ppeName: string} | null>(null);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchFingers, setMismatchFingers] = useState<string[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Biometric states
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricHash, setBiometricHash] = useState<string | null>(null);

  // Canvas drawing properties
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignaturePoints, setHasSignaturePoints] = useState(false);

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

  // Remote link confirmation states
  const [pendingLink, setPendingLink] = useState<{url: string; token: string; expiresAt: string} | null>(null);
  const [selectedAuditDelivery, setSelectedAuditDelivery] = useState<PPEDelivery | null>(null);
  const [showAuditReceipt, setShowAuditReceipt] = useState(false);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Refs for click outside
  const deliveryDropdownRef = useRef<HTMLDivElement>(null);
  const receiptDropdownRef = useRef<HTMLDivElement>(null);
  const ppeDropdownRef = useRef<HTMLDivElement>(null);

  // PPE Combobox states
  const [searchTermPpe, setSearchTermPpe] = useState('');
  const [isOpenPpe, setIsOpenPpe] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target as Node)) {
        setIsOpenDelivery(false);
      }
      if (receiptDropdownRef.current && !receiptDropdownRef.current.contains(event.target as Node)) {
        setIsOpenReceipt(false);
      }
      if (ppeDropdownRef.current && !ppeDropdownRef.current.contains(event.target as Node)) {
        setIsOpenPpe(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Webcam controls
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      Swal.fire('Erro', 'Não foi possível acessar a câmera. Verifique as permissões.', 'error');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsWebcamActive(false);
    }
  };

  const capturePhoto = async (autoMatched: boolean = false, autoScore: number = 0) => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelfieOptionSelected(dataUrl);
        stopWebcam();

        if (autoMatched) {
           setFaceMatchScore(autoScore);
           Swal.fire({
             title: 'Identidade Confirmada',
             text: `Rosto validado com sucesso pelo Auto-Scan! (Precisão: ${(autoScore * 100).toFixed(1)}%)`,
             icon: 'success',
             timer: 2000,
             showConfirmButton: false
           });
           return;
        }

        // RUN MANUAL FACE RECOGNITION IF CLICKED
        const selectedEmployeeObj = companyEmployees.find(e => e.id === selectedEmpId);
        if (selectedEmployeeObj && selectedEmployeeObj.photoUrl) {
          setIsAnalyzingFace(true);
          try {
            const { compareFaces } = await import('../utils/faceRecognition');
            const result = await compareFaces(selectedEmployeeObj.photoUrl, dataUrl);
            setFaceMatchScore(result.score);
            if (!result.match) {
              Swal.fire('Rosto Incompatível', 'A foto capturada não corresponde à foto de perfil do colaborador cadastrado.', 'error');
              setSelfieOptionSelected('');
              setFaceMatchScore(null);
            } else {
              Swal.fire({
                title: 'Identidade Confirmada',
                text: `Rosto validado com sucesso! (Precisão: ${(result.score * 100).toFixed(1)}%)`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          } catch (e: any) {
            Swal.fire('Aviso de Validação Facial', 'Não foi possível analisar o rosto. Verifique se o colaborador possui uma foto clara no perfil.', 'warning');
            console.error(e);
            setSelfieOptionSelected('');
            setFaceMatchScore(null);
          } finally {
            setIsAnalyzingFace(false);
          }
        } else {
          Swal.fire('Sem Foto Base', 'Este colaborador não possui uma foto de perfil cadastrada no sistema. O Face ID exige uma foto base para comparação.', 'warning');
          setSelfieOptionSelected('');
        }
      }
    }
  };

  // Pre-load base face descriptor
  useEffect(() => {
    if (signingMethod === 'selfie' && selectedEmpId) {
      const emp = companyEmployees.find(e => e.id === selectedEmpId);
      if (emp && emp.photoUrl) {
        import('../utils/faceRecognition').then(m => {
          m.getBaseDescriptor(emp.photoUrl).then(desc => {
            setBaseFaceDescriptor(desc);
          });
        });
      } else {
        setBaseFaceDescriptor(null);
      }
    } else {
      setBaseFaceDescriptor(null);
    }
  }, [signingMethod, selectedEmpId, companyEmployees]);

  // Auto-scan video feed
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWebcamActive && !selfieOptionSelected && baseFaceDescriptor && videoRef.current) {
      interval = setInterval(async () => {
        if (!videoRef.current || !isWebcamActive || selfieOptionSelected || isAnalyzingFace) return;
        
        try {
          const { compareVideoFace } = await import('../utils/faceRecognition');
          const result = await compareVideoFace(videoRef.current, baseFaceDescriptor);
          if (result && result.match && result.score) {
            clearInterval(interval);
            capturePhoto(true, result.score);
          }
        } catch (e) {
          // Silent fail on interval
        }
      }, 1000); // Check every 1 second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWebcamActive, selfieOptionSelected, baseFaceDescriptor, isAnalyzingFace]);

  useEffect(() => {
    if (signingMethod !== 'selfie') {
      stopWebcam();
      setSelfieOptionSelected('');
      setFaceMatchScore(null);
    }
  }, [signingMethod]);

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
        const threshold = 0.89; // 89% similarity threshold - calibrado para evitar falsos positivos mas permitir variação no posicionamento do dedo
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

    if (signingMethod === 'link') {
      if (!selectedEmpId || !selectedPpeId) {
        Swal.fire('Atenção', 'Selecione o colaborador e o EPI antes de gerar o link.', 'warning');
        return;
      }
      const employee = employees.find(emp => emp.id === selectedEmpId);
      const ppe = ppes.find(p => p.id === selectedPpeId);
      if (!employee || !ppe) return;

      if (!employee.pin) {
        const confirm = await Swal.fire({
          title: '⚠️ Sem PIN cadastrado',
          text: `${employee.name} não possui PIN cadastrado. O colaborador não conseguirá confirmar o recebimento. Deseja prosseguir assim mesmo?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Gerar link mesmo assim',
          cancelButtonText: 'Cancelar'
        });
        if (!confirm.isConfirmed) return;
      }

      try {
        const res = await fetch('/api/deliveries/pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ppeId: selectedPpeId,
            employeeId: selectedEmpId,
            quantity,
            employeeName: employee.name,
            ppeName: ppe.name,
            caNumber: ppe.caNumber,
            reason,
          })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Erro ao gerar link');

        setPendingLink({ url: result.confirmUrl, token: result.confirmToken, expiresAt: result.expiresAt });

        // Gerar QR code simples via API pública (sem biblioteca extra)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(result.confirmUrl)}`;
        setQrDataUrl(qrApiUrl);

        setSelectedPpeId('');
        setQuantity(1);

        await Swal.fire({
          title: '🔗 Link Gerado!',
          html: `<div class="text-sm">Link enviado via WhatsApp para <b>${employee.name}</b>.<br/>O colaborador tem <b>72 horas</b> para confirmar.</div>`,
          icon: 'success',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Mostrar QR Code'
        });
      } catch (err: any) {
        Swal.fire('Erro', err.message, 'error');
      }
      return;
    }

    let signatureValue = '';
    if (signingMethod === 'assinatura_digital' && canvasRef.current) {
      signatureValue = canvasRef.current.toDataURL(); // base64 SVG/PNG data
    } else if (signingMethod === 'senha') {
      if (!pinNumber) {
        Swal.fire('Atenção', 'Por favor, digite o PIN numérico do colaborador.', 'warning');
        return;
      }
      if (!employee.pin) {
        Swal.fire('Não Cadastrado', 'Este colaborador não possui PIN cadastrado em sua ficha. Peça para o RH registrar no cadastro.', 'error');
        return;
      }
      if (employee.pin !== pinNumber) {
        Swal.fire('PIN Incorreto', 'O PIN digitado não confere com o registrado para o colaborador.', 'error');
        return;
      }
      signatureValue = `PIN Assinado validado`;
    } else if (signingMethod === 'biometria') {
      if (!biometricHash) {
        Swal.fire('Atenção', 'Por favor, efetue a captura da biometria primeiro.', 'warning');
        return;
      }
      signatureValue = `Biometria: ${biometricHash}`;
    } else {
      if (!selfieOptionSelected) {
        Swal.fire('Atenção', 'Por favor, capture a foto do colaborador antes de registrar.', 'warning');
        return;
      }
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

  const handleResendLink = async (deliveryId: string) => {
    try {
      const res = await fetch(`/api/deliveries/resend-link/${deliveryId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reenviar link');
      
      Swal.fire({
        title: 'Sucesso!',
        text: 'Link reenviado para o WhatsApp do colaborador.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Erro', err.message, 'error');
    }
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
  const filteredEmployeesDelivery = Array.from(
    companyEmployees.filter(emp => {
      const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const term = normalize(searchTermDelivery);
      return (
        normalize(emp.name).includes(term) ||
        normalize(emp.matricula).includes(term) ||
        normalize(emp.cpf).includes(term) ||
        normalize(emp.role).includes(term) ||
        normalize(emp.sector).includes(term)
      );
    }).reduce((acc, emp) => {
      const key = emp.matricula || emp.cpf || emp.name.toLowerCase();
      if (!acc.has(key)) acc.set(key, emp);
      return acc;
    }, new Map<string, Employee>()).values()
  );

  return (
    <div className="space-y-4 text-xs">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left column: Create Hand-out registration */}
        <div className="flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-safety-green text-white p-1.5 rounded-lg shadow-sm">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Registro de Entrega (NR-06)</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed ml-9">
              Siga os passos abaixo para registrar a entrega de EPIs com assinatura eletrônica de validade jurídica.
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmitDelivery} className="space-y-4 text-slate-700 dark:text-slate-200">
              
              {/* Card 1: Dados da Entrega */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">1</span>
                  Dados da Entrega
                </h4>
                <div className="space-y-3">
              {/* Select target worker */}
              <div className="relative" ref={deliveryDropdownRef}>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 dark:text-slate-400 uppercase">Colaborador Destinatário</label>
                <input type="hidden" name="employeeId" value={selectedEmpId} required />
                <button
                  type="button"
                  onClick={() => setIsOpenDelivery(!isOpenDelivery)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white dark:bg-slate-800 text-[13px] text-left flex justify-between items-center cursor-pointer transition-all hover:border-slate-300 dark:border-slate-600"
                >
                  <span className={selectedEmployeeObj ? "text-[15px] text-slate-900 dark:text-white font-black tracking-tight" : "text-[15px] text-slate-500 dark:text-slate-400 font-bold"}>
                    {selectedEmployeeObj 
                      ? `${selectedEmployeeObj.name} (${selectedEmployeeObj.role} - ${selectedEmployeeObj.matricula})`
                      : "Selecione o Colaborador..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>

                {isOpenDelivery && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-h-60 flex flex-col">
                    <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, setor, matrícula, CPF..."
                        value={searchTermDelivery}
                        onChange={(e) => setSearchTermDelivery(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-[14px] text-slate-700 dark:text-slate-200 py-1"
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
                              selectedEmpId === emp.id ? "bg-safety-green/5 text-safety-green font-bold" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {emp.photoUrl ? (
                                <img src={emp.photoUrl} alt={emp.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-600" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                </div>
                              )}
                              <div>
                                <span className="block text-[14px] font-bold text-slate-800 dark:text-slate-100">{emp.name}</span>
                                <span className="block text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  {emp.role} {emp.sector ? `• ${emp.sector}` : ''}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
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
                <div className="col-span-2 relative" ref={ppeDropdownRef}>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 dark:text-slate-400 uppercase">EPI a Fornecer</label>
                  <input type="hidden" name="ppeId" value={selectedPpeId} required />
                  <button
                    type="button"
                    onClick={() => setIsOpenPpe(!isOpenPpe)}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white dark:bg-slate-800 text-[13px] text-left flex justify-between items-center cursor-pointer transition-all hover:border-slate-300 dark:border-slate-600"
                  >
                    <span className={selectedPpeId ? "text-[14px] text-slate-900 dark:text-white font-black tracking-tight" : "text-[14px] text-slate-500 dark:text-slate-400 font-bold"}>
                      {selectedPpeId && ppes.find(p => p.id === selectedPpeId)
                        ? `${ppes.find(p => p.id === selectedPpeId)?.name} (CA: ${ppes.find(p => p.id === selectedPpeId)?.caNumber})`
                        : "Selecione o EPI..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>

                  {isOpenPpe && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-h-60 flex flex-col">
                      <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar EPI por nome, CA, marca..."
                          value={searchTermPpe}
                          onChange={(e) => setSearchTermPpe(e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none text-[14px] text-slate-700 dark:text-slate-200 py-1"
                          autoFocus
                        />
                      </div>
                      <ul className="overflow-y-auto py-1 max-h-48 text-[11px]">
                        {ppes.filter(p => {
                          const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const term = normalize(searchTermPpe);
                          return normalize(p.name).includes(term) || normalize(p.caNumber).includes(term) || normalize(p.brand).includes(term);
                        }).length === 0 ? (
                          <li className="p-2 text-slate-400 italic text-center">Nenhum EPI encontrado</li>
                        ) : (
                          ppes.filter(p => {
                            const normalize = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                            const term = normalize(searchTermPpe);
                            return normalize(p.name).includes(term) || normalize(p.caNumber).includes(term) || normalize(p.brand).includes(term);
                          }).map((p) => {
                            const isCaExpired = p.caStatus !== 'Válido';
                            return (
                              <li
                                key={p.id}
                                onClick={() => {
                                  if (!isCaExpired) {
                                    setSelectedPpeId(p.id);
                                    setIsOpenPpe(false);
                                    setSearchTermPpe('');
                                  }
                                }}
                                className={`p-2 px-3 hover:bg-safety-green/10 hover:text-safety-green flex justify-between items-center transition-colors ${
                                  isCaExpired ? "opacity-50 cursor-not-allowed bg-rose-50/20" : "cursor-pointer"
                                } ${selectedPpeId === p.id ? "bg-safety-green/5 text-safety-green font-bold" : "text-slate-700 dark:text-slate-200"}`}
                              >
                                <div className="flex items-center gap-3">
                                  {p.photoUrl ? (
                                    <img src={p.photoUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-250 dark:border-slate-600" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-750 flex items-center justify-center shrink-0">
                                      <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100">{p.name}</span>
                                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                      Marca: {p.brand} • Estoque: {p.stockCount} un
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                                  isCaExpired ? "bg-rose-100 text-rose-800" : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                                }`}>
                                  CA: {p.caNumber} {isCaExpired ? '⚠️ EXPIRED' : ''}
                                </span>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 dark:text-slate-400 uppercase">Qtd Fornecida</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white dark:bg-slate-800 font-mono text-[16px] font-black text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>

                </div>
              </div>

              {/* Card 2: Motivo do Fornecimento */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">2</span>
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
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 3: Autenticação */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">3</span>
                  Assinatura Regulatória
                </h4>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSigningMethod('assinatura_digital')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 font-bold cursor-pointer ${
                      signingMethod === 'assinatura_digital' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
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
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
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
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
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
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
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
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-tight">Celular</span>
                  </button>
                </div>

                {/* Sub signature interface blocks */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded cursor-crosshair h-20 shadow-inner"
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
                        className="w-full p-1 px-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded font-mono focus:outline-none focus:border-safety-green text-center text-[11px]"
                      />
                    </div>
                  )}

                  {signingMethod === 'biometria' && (
                    <div className="text-center py-6 space-y-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
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
                        <span className="font-black text-slate-800 dark:text-slate-100 tracking-tight text-[12px] uppercase mb-1">
                          Leitor Biométrico
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto font-medium leading-relaxed">
                          {selectedEmployeeObj?.biometricFinger ? (
                            <>Posicione o dedo <strong className="text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">{getFingerLabel(selectedEmployeeObj.biometricFinger)}</strong> no sensor para validar a assinatura legal.</>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-2">
                      <div className="space-y-1 text-[10px]">
                        <span className="text-[11px] text-slate-700 dark:text-slate-200 font-bold block">Captura de Reconhecimento Facial</span>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-snug mb-3">Tire a foto do colaborador com o EPI em mãos para garantir a validade jurídica.</p>
                        
                        {!isWebcamActive && !selfieOptionSelected && (
                          <button
                            type="button"
                            onClick={startWebcam}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition shadow flex justify-center items-center gap-2"
                          >
                            <Camera className="w-4 h-4" /> Iniciar Câmera
                          </button>
                        )}
                        
                        {isWebcamActive && !selfieOptionSelected && (
                          <div className="flex flex-col gap-2">
                            {baseFaceDescriptor ? (
                              <div className="w-full py-2 bg-blue-50 text-blue-700 rounded font-bold text-xs border border-blue-200 flex justify-center items-center gap-2 animate-pulse">
                                <Scan className="w-4 h-4" /> Escaneando Rosto...
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => capturePhoto(false)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition shadow flex justify-center items-center gap-2"
                              >
                                <Camera className="w-4 h-4" /> Capturar Foto (Manual)
                              </button>
                            )}
                          </div>
                        )}

                        {selfieOptionSelected && !isAnalyzingFace && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieOptionSelected('');
                              setFaceMatchScore(null);
                              startWebcam();
                            }}
                            className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-bold text-xs transition shadow flex justify-center items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Tirar Novamente
                          </button>
                        )}
                        
                        {isAnalyzingFace && (
                          <div className="w-full py-2 bg-blue-100 text-blue-700 rounded font-bold text-xs border border-blue-200 flex justify-center items-center gap-2">
                            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            Analisando Face ID...
                          </div>
                        )}
                        
                        {faceMatchScore && (
                          <div className="mt-2 text-center text-[9px] font-bold text-emerald-700 bg-emerald-50 py-1 rounded border border-emerald-200">
                            ✓ Face ID Confirmado ({(faceMatchScore * 100).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-600 p-2 overflow-hidden flex justify-center items-center min-h-[140px]">
                        {!isWebcamActive && !selfieOptionSelected && (
                          <div className="text-slate-400 flex flex-col items-center">
                            <Camera className="w-8 h-8 mb-1 opacity-50" />
                            <span className="text-[9px] uppercase font-bold tracking-wider">Câmera Desligada</span>
                          </div>
                        )}
                        
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className={`w-full max-w-[200px] rounded shadow-sm ${(!isWebcamActive || selfieOptionSelected) ? 'hidden' : 'block'}`}
                        />
                        
                        {selfieOptionSelected && (
                          <img 
                            src={selfieOptionSelected} 
                            className="w-full max-w-[200px] object-contain rounded shadow-sm border border-safety-green"
                            alt="Selfie capturada" 
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {signingMethod === 'link' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Smartphone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">Confirmação Remota por Link</p>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                              Ao registrar, o sistema gera um link único e envia via WhatsApp para o colaborador.
                              Ele confirma o recebimento com o PIN no próprio celular — ideal para turno noturno.
                            </p>
                          </div>
                        </div>
                      </div>

                      {pendingLink ? (
                        <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/40 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">Link gerado com sucesso!</span>
                          </div>
                          {qrDataUrl && (
                            <div className="flex flex-col items-center gap-2">
                              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 border-4 border-slate-200 dark:border-slate-700 rounded-xl shadow" />
                              <span className="text-[9px] text-slate-500 font-mono text-center break-all max-w-[200px]">{pendingLink.url}</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(pendingLink.url).then(() => Swal.fire({title: 'Copiado!', icon: 'success', timer: 1500, showConfirmButton: false}))}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[10px] uppercase transition hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                              <QrCode className="w-3.5 h-3.5" /> Copiar Link
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingLink(null)}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-500 rounded-lg font-bold text-[10px] uppercase transition hover:bg-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400 text-center">
                            Expira em: {pendingLink.expiresAt ? new Date(pendingLink.expiresAt).toLocaleString('pt-BR') : '72h'}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center">
                          <Smartphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400 font-bold">O QR Code e link aparecerão aqui após registrar</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-black p-4 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 uppercase text-[12px] tracking-wider cursor-pointer mt-6 ${
                  signingMethod === 'link'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-brand-primary-dark hover:bg-brand-primary-dark text-white shadow-brand-primary-dark/30'
                }`}
              >
                {signingMethod === 'link' ? (
                  <><Send className="w-4 h-4" /> Gerar Link e Enviar WhatsApp</>
                ) : (
                  <><Plus className="w-4 h-4" /> Registrar Entrega e Gerar Ficha Legal</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Interactive Printable Regulatory Sheet (Ficha de EPI) conforme Portaria SIT/MTE n.º 107 */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ficha Regulamentada (NR-06)</h3>
              </div>
              
              {/* Select recipe to check */}
              {/* Filtro de Mês e Ano */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Filtro:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:border-safety-green cursor-pointer"
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
                  className="border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:border-safety-green cursor-pointer"
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
              <div className="flex-1 mt-4 overflow-y-auto pr-2 custom-scrollbar print:overflow-visible print:h-auto print:m-0 print:pr-0" style={{maxHeight: 'calc(100vh - 14rem)'}}>
                <div className="print-receipt bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-100 shadow-sm mx-auto w-full print:border print:border-slate-300 dark:border-slate-600 print:shadow-none" style={{fontFamily: "'Inter', sans-serif"}}>
                  {/* ── CABEÇALHO ── */}
                  <div className="flex items-center border-b-2 border-slate-700 px-3 py-2 gap-3">
                    {/* Foto do colaborador */}
                    <div className="shrink-0">
                      {activeReceiptEmployee.photoUrl ? (
                        <img src={activeReceiptEmployee.photoUrl} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Título central */}
                    <div className="flex-1 text-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Portaria SIT/MTE n.º 107 — NR-06</p>
                      <h1 className="text-base font-extrabold text-slate-900 dark:text-white uppercase leading-tight">
                        FICHA DE FORNECIMENTO DE<br />EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)
                      </h1>
                    </div>

                    {/* Logo da empresa */}
                    <div className="shrink-0 text-right flex flex-col items-end justify-center">
                      <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="h-10 object-contain mb-1" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Segurança do Trabalho</p>
                    </div>
                  </div>

                  {/* ── DADOS DO EMPREGADOR E EMPREGADO ── */}
                  <div className="grid grid-cols-2 gap-4 px-4 py-2 text-[10px] uppercase font-mono">
                    <div className="space-y-1">
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Empresa:</span> Novo Horizonte Alumínios LTDA</p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Colaborador:</span> <strong className="text-[11px] text-slate-800 dark:text-slate-100">{activeReceiptEmployee.name}</strong></p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Cargo:</span> {activeReceiptEmployee.role}</p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Setor:</span> {activeReceiptEmployee.sector}</p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Admissão:</span> {activeReceiptEmployee.admissionDate ? new Date(activeReceiptEmployee.admissionDate).toLocaleDateString('pt-BR') : '-'}</p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">CNPJ:</span> 01.374.729/0001-90</p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">CPF:</span> {activeReceiptEmployee.cpf}</p>
                      <p><span className="font-bold text-slate-900 dark:text-white inline-block w-24">Nº Matrícula:</span> <strong className="text-[11px] text-slate-800 dark:text-slate-100">{activeReceiptEmployee.matricula}</strong></p>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 dark:border-slate-600 py-1.5 text-center bg-slate-50 dark:bg-slate-900/50">
                    <p className="font-bold text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-300">Data de Emissão do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>

                  {/* ── TABELA DE EQUIPAMENTOS ── */}
                  <div className="min-h-[150px]">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-800 text-white uppercase font-bold text-[9px] tracking-wider">
                          <th className="p-2 border-y border-slate-700 text-center w-12">Qtde</th>
                          <th className="p-2 border border-slate-700">Descrição do Equipamento</th>
                          <th className="p-2 border border-slate-700 text-center w-24">Data da<br/>Entrega</th>
                          <th className="p-2 border border-slate-700 text-center w-20">Nº CA MTE</th>
                          <th className="p-2 border border-slate-700 text-center w-24">Motivo</th>
                          <th className="p-2 border-y border-slate-700 text-center w-36">Assinatura do<br/>Colaborador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activeReceiptDeliveries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-mono italic">
                              Nenhum registro de entrega encontrado para este filtro.
                            </td>
                          </tr>
                        ) : (
                          activeReceiptDeliveries.map((delivery, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900">
                              <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                                {String(delivery.quantity).padStart(2, '0')}
                              </td>
                              <td className="p-2 font-bold text-slate-800 dark:text-slate-100 uppercase border-r border-slate-200 dark:border-slate-700">
                                {delivery.ppeName}
                              </td>
                              <td className="p-2 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                                {new Date(delivery.deliveryDate || '').toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                                {delivery.caNumber || 'N/A'}
                              </td>
                              <td className="p-2 text-center text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                                {delivery.reason}
                              </td>
                              <td className="p-2 text-center flex items-center justify-center">
                                {/* Lógica de Assinatura Eletrônica na Tabela */}
                                {delivery.signatureData?.startsWith('data:image/') ? (
                                  <img src={delivery.signatureData} alt="Assinatura Digital" className="h-8 max-w-[120px] object-contain drop-shadow-sm opacity-90" />
                                ) : delivery.signatureData?.startsWith('Biometria:') ? (
                                  <div className="text-center">
                                    <Fingerprint className="w-5 h-5 text-emerald-600 mx-auto opacity-80" />
                                    <span className="text-[7px] font-bold text-emerald-700 uppercase block mt-0.5 tracking-tighter">Biometria</span>
                                    <span className="text-[5.5px] font-mono text-slate-400 block mt-0.5 leading-none">{delivery.signatureData.split(':')[1]?.substring(0,20)}...</span>
                                  </div>
                                ) : delivery.signatureData?.startsWith('Selfie') || delivery.selfieUrl ? (
                                  <div className="flex flex-col items-center">
                                    <img src={delivery.selfieUrl || delivery.signatureData?.split('Selfie Anexa: ')[1]} alt="Selfie" className="w-7 h-7 object-cover rounded-full border border-slate-300 dark:border-slate-600" />
                                    <span className="text-[7px] font-bold text-indigo-600 uppercase block mt-0.5 tracking-tighter">Reconhecimento</span>
                                  </div>
                                ) : delivery.signatureData?.startsWith('PIN') ? (
                                  <div className="text-center">
                                    <Lock className="w-5 h-5 text-sky-600 mx-auto opacity-80" />
                                    <span className="text-[7px] font-bold text-sky-700 uppercase block mt-0.5 tracking-tighter">PIN Pessoal</span>
                                  </div>
                                ) : (delivery.status === 'Entregue' && delivery.signingMethod === 'link') || delivery.confirmedAt ? (
                                  <div 
                                    onClick={() => {
                                      setSelectedAuditDelivery(delivery);
                                      setShowAuditReceipt(true);
                                    }}
                                    title="Clique para visualizar o recibo eletrônico completo"
                                    className="text-center flex flex-col items-center cursor-pointer hover:bg-emerald-500/10 p-1 rounded transition-colors group"
                                  >
                                    <Lock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform mx-auto opacity-80" />
                                    <span className="text-[7px] font-bold text-emerald-700 uppercase block mt-0.5 tracking-tighter decoration-dotted group-hover:underline">Link Validado</span>
                                    {delivery.confirmedIp && (
                                      <span className="text-[6px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5" title="IP de Autenticação">IP: {delivery.confirmedIp}</span>
                                    )}
                                    {delivery.integrityHash && (
                                      <span className="text-[5.5px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 rounded block mt-0.5 select-all" title="Protocolo de Auditoria">
                                        PROT-{delivery.integrityHash.substring(0, 8).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                ) : delivery.status === 'Pendente' && delivery.signingMethod === 'link' ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[8px] italic text-slate-400 font-serif">— Pendente —</span>
                                    <button 
                                      onClick={() => handleResendLink(delivery.id)}
                                      title="Reenviar link para WhatsApp"
                                      className="px-1.5 py-0.5 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 hover:text-sky-600 rounded text-[7px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Send className="w-2 h-2" /> Reenviar
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[8px] italic text-slate-400 font-serif">— Pendente —</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── TERMO DE RESPONSABILIDADE ── */}
                  <div className="p-3 border-y border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/80">
                    <p className="text-[8.5px] font-bold uppercase text-slate-700 dark:text-slate-200 mb-1">Termo de Recebimento de EPI (NR-06 / Portaria SIT/MTE n.º 107):</p>
                    <p className="text-[8.5px] text-slate-600 dark:text-slate-300 leading-relaxed text-justify uppercase font-mono">
                      Declaro que recebi gratuitamente os equipamentos de proteção individual relacionados acima, adequados aos riscos inerentes ao cumprimento do meu contrato de trabalho. Comprometo-me a utilizá-los apenas para a finalidade que se destinam, conservando-os adequadamente e comunicando ao empregador qualquer alteração que o torne impróprio para uso, sob penas da legislação trabalhista vigente.
                    </p>
                  </div>

                  {/* ── ÁREA DE ASSINATURAS MANUAIS (CASO IMPRESSO VAZIO OU RESPONSÁVEL) ── */}
                  {(() => {
                    const company = companies.find(c => c.id === activeCompanyId);
                    const sstName = company?.sstResponsible || 'Responsável SST';
                    const colabName = activeReceiptEmployee.name;

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
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">{sstName}</p>
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
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">CPF: {activeReceiptEmployee.cpf} | Mat: {activeReceiptEmployee.matricula}</p>
                        </div>

                      </div>
                    );
                  })()}

                  {/* ── HASH DE INTEGRIDADE DO DOCUMENTO ── */}
                  <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-600 flex justify-between items-center text-[9px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Sistema SST Novo Horizonte Alumínios — {new Date().toLocaleString('pt-BR')}</span>
                    <span>DOC-ID: {activeReceiptDeliveries[0]?.id?.substring(0, 16).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 mt-4 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400 rounded flex flex-col items-center justify-center gap-1.5">
                <Eye className="w-8 h-8 text-slate-350 bg-slate-100 dark:bg-slate-800/80/40" />
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">Ficha Vazia</span>
                <p className="text-[9px] max-w-[200px] mx-auto leading-relaxed text-slate-450">Selecione um colaborador no seletor acima para carregar a Ficha de EPI regulamentada para visualização, conferência ou impressão legal.</p>
              </div>
            )}
            
            {/* Action buttons at the bottom of right panel */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                disabled={!activeReceiptEmployee}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-2 px-5 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-safety-green/20 overflow-hidden transform animate-scale-in">
            <div className="bg-safety-green/10 border-b border-safety-green/20 p-5 flex flex-col items-center justify-center relative">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm text-safety-green mb-3 ring-4 ring-safety-green/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight text-center">Entrega Registrada!</h3>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                O EPI <strong className="text-slate-800 dark:text-slate-100">{successModalData.ppeName}</strong> foi entregue com sucesso para <strong className="text-slate-800 dark:text-slate-100">{successModalData.empName}</strong>.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-6 italic leading-relaxed">
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 overflow-hidden transform animate-scale-in">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex justify-between items-start">
              <div className="flex gap-3 items-start">
                <div className="bg-rose-100 p-2 rounded-full mt-1 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Divergência Biométrica</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Esta digital não pertence ao colaborador selecionado.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMismatchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">Tente novamente utilizando uma das seguintes digitais cadastradas para <span className="font-bold text-slate-800 dark:text-slate-100">{selectedEmployeeObj?.name?.split(' ')[0]}</span>:</p>
                
                {mismatchFingers.length > 0 ? (
                  <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                    {mismatchFingers.map((f, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 px-3 rounded-md flex items-center justify-center gap-2">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{getFingerLabel(f)}</span>
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

      {/* Audit Receipt Modal (Comprovante de Validacao por Link) */}
      {showAuditReceipt && selectedAuditDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] text-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800 overflow-hidden transform animate-scale-in relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />
            <button 
              onClick={() => { setShowAuditReceipt(false); setSelectedAuditDelivery(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 bg-slate-800/40 rounded-full hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-6">
              <div className="flex justify-center mb-5 mt-2">
                <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="w-36 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-lg font-black text-white tracking-tight text-center">Recebimento Confirmado!</h2>
                <p className="text-emerald-400 text-xs font-semibold mt-1 text-center">{selectedAuditDelivery.employeeName}</p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-mono font-bold">
                    PROT-{selectedAuditDelivery.integrityHash?.substring(0, 8).toUpperCase() || 'SEM-PROT'}
                  </span>
                </div>
              </div>
              <div className="bg-[#1B263B] rounded-2xl border border-slate-700/50 overflow-hidden mb-5">
                <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-700/50">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Comprovante de Entrega</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Colaborador</span><span className="text-white font-bold text-right">{selectedAuditDelivery.employeeName}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">EPI</span><span className="text-white font-bold text-right max-w-[55%]">{selectedAuditDelivery.ppeName}</span></div>
                  {selectedAuditDelivery.caNumber && (<div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">CA</span><span className="text-emerald-400 font-mono font-bold">{selectedAuditDelivery.caNumber} ✔</span></div>)}
                  <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Quantidade</span><span className="text-white font-bold">{selectedAuditDelivery.quantity} unidade{(selectedAuditDelivery.quantity || 0) > 1 ? "s" : ""}</span></div>
                  <div className="flex justify-between gap-2 border-t border-slate-700/50 pt-2.5"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Data</span><span className="text-white font-bold">{selectedAuditDelivery.confirmedAt ? new Date(selectedAuditDelivery.confirmedAt).toLocaleDateString("pt-BR") : "—"}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hora</span><span className="text-white font-bold">{selectedAuditDelivery.confirmedAt ? new Date(selectedAuditDelivery.confirmedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></div>
                  {selectedAuditDelivery.confirmedIp && (<div className="flex justify-between gap-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">IP de Autenticação</span><span className="text-slate-300 font-mono">{selectedAuditDelivery.confirmedIp}</span></div>)}
                  {selectedAuditDelivery.integrityHash && (<div className="border-t border-slate-700/50 pt-2.5"><span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Hash de Integridade</span><span className="text-emerald-400 font-mono text-[9px] break-all leading-relaxed select-all">{selectedAuditDelivery.integrityHash}</span></div>)}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed text-center mb-4">Este comprovante tem validade jurídica conforme a Lei nº 14.063/2020 e a NR-06.</p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      const dateStr = selectedAuditDelivery.confirmedAt ? new Date(selectedAuditDelivery.confirmedAt).toLocaleDateString("pt-BR") : "—";
                      const timeStr = selectedAuditDelivery.confirmedAt ? new Date(selectedAuditDelivery.confirmedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
                      const protocolStr = selectedAuditDelivery.integrityHash ? "PROT-" + selectedAuditDelivery.integrityHash.substring(0, 8).toUpperCase() : "—";
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Comprovante de Entrega de EPI - ${selectedAuditDelivery.employeeName}</title>
                            <style>
                              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
                              .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                              .logo-text { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.025em; }
                              .subtitle { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; font-weight: 600; margin-top: 4px; }
                              .title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin-top: 15px; color: #1e293b; }
                              .receipt-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #f8fafc; margin-bottom: 25px; }
                              .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
                              .row:last-child { border-bottom: none; }
                              .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
                              .value { font-size: 12px; font-weight: 700; color: #0f172a; }
                              .protocol-badge { display: inline-block; background: #e2e8f0; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 700; font-family: monospace; margin: 15px 0; }
                              .legal-text { font-size: 10px; color: #64748b; text-align: center; margin-top: 30px; line-height: 1.5; }
                              .hash-box { margin-top: 15px; padding-top: 15px; border-t: 1px dashed #cbd5e1; font-family: monospace; font-size: 9px; word-break: break-all; color: #475569; }
                              @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" style="max-height: 48px; margin-bottom: 12px; filter: brightness(0) saturate(100%) invert(8%) sepia(21%) saturate(5463%) prev-color;" onError="this.style.display='none';" />
                              <div class="subtitle">Segurança e Saúde do Trabalho</div>
                              <div class="title">Comprovante de Entrega de EPI</div>
                              <div class="protocol-badge">${protocolStr}</div>
                            </div>
                            
                            <div class="receipt-card">
                              <div class="row"><span class="label">Colaborador</span><span class="value">${selectedAuditDelivery.employeeName}</span></div>
                              <div class="row"><span class="label">Equipamento (EPI)</span><span class="value">${selectedAuditDelivery.ppeName}</span></div>
                              ${selectedAuditDelivery.caNumber ? `<div class="row"><span class="label">CA (MTE)</span><span class="value">${selectedAuditDelivery.caNumber}</span></div>` : ''}
                              <div class="row"><span class="label">Quantidade</span><span class="value">${selectedAuditDelivery.quantity} unidade(s)</span></div>
                              <div class="row"><span class="label">Data de Confirmação</span><span class="value">${dateStr}</span></div>
                              <div class="row"><span class="label">Hora de Confirmação</span><span class="value">${timeStr}</span></div>
                              ${selectedAuditDelivery.confirmedIp ? `<div class="row"><span class="label">IP do Dispositivo</span><span class="value">${selectedAuditDelivery.confirmedIp}</span></div>` : ''}
                              
                              ${selectedAuditDelivery.integrityHash ? `
                                <div class="hash-box">
                                  <strong>HASH DE INTEGRIDADE (SHA-256):</strong><br/>
                                  ${selectedAuditDelivery.integrityHash}
                                </div>
                              ` : ''}
                            </div>
                            
                            <div class="legal-text">
                              Declaração de autenticidade jurídica sob a égide da Lei Federal nº 14.063/2020 e Norma Regulamentadora NR-06 do Ministério do Trabalho.<br/>
                              Este documento comprova a assinatura digital realizada pelo colaborador via PIN pessoal.
                            </div>
                            
                            <script>
                              window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button 
                  onClick={() => { setShowAuditReceipt(false); setSelectedAuditDelivery(null); }} 
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wide transition-all active:scale-95 border border-slate-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

