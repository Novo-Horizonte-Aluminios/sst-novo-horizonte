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
  Send
} from 'lucide-react';
import { Employee, PPE, PPEDelivery, Company } from '../types';
import { exportDeliveriesToExcel, exportDeliveriesToPDF } from '../utils/exportUtils';

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

  // Biometric states
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricHash, setBiometricHash] = useState<string | null>(null);

  // Canvas drawing properties
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignaturePoints, setHasSignaturePoints] = useState(false);

  // Printable selected employee receipt
  const [selectedReceiptEmpId, setSelectedReceiptEmpId] = useState('');

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

  const handleCaptureBiometrics = async () => {
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
        setBiometricHash(data.hash);
      } else {
        setBiometricError(data.error || 'Erro ao extrair biometria.');
      }
    } catch (err) {
      setBiometricError('Agente Futronic Local não encontrado. Certifique-se de que o Bridge está rodando. Na 1ª vez, acesse https://localhost:8443 no Chrome e aceite o certificado.');
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedPpeId) {
      alert('Favor preencher o Colaborador e o EPI antes de registrar.');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmpId);
    const ppe = ppes.find(p => p.id === selectedPpeId);
    if (!employee || !ppe) return;

    if (ppe.stockCount < quantity) {
      if (!confirm('Quantidade solicitada é maior que o estoque em mãos do EPI. Prosseguir mesmo assim?')) {
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
        alert('Por favor, efetue a captura da biometria primeiro.');
        return;
      }
      signatureValue = `Biometria Futronic: ${biometricHash}`;
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

    setSuccessMsg(`EPI "${ppe.name}" fornecido com sucesso para ${employee.name}!`);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);

    // Reset fields
    setSelectedPpeId('');
    setQuantity(1);
    clearCanvas();
    setPinNumber('');
  };

  // Receipt visual logic
  const activeReceiptEmployee = employees.find(e => e.id === selectedReceiptEmpId);
  const activeReceiptDeliveries = deliveries.filter(d => d.employeeId === selectedReceiptEmpId);

  return (
    <div className="space-y-4 text-xs">
      
      {/* Top Export Banner */}
      <div className="bg-white p-4 rounded border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-safety-green" />
            Fichas e Comprovantes de Entrega de EPI (NR-06)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Módulo de controle individual de EPIs e conformidade do eSocial S-2240. Gere de forma imediata laudos e planilhas regulamentares.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left column: Create Hand-out registration */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileCheck className="w-4 h-4 text-safety-green" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Registro de Entrega (NR-06)</h3>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Evite passivos trabalhistas. Registre a entrega de novos EPIs com assinatura eletrônica de validade jurídica imediata.
            </p>

            {successMsg && (
              <div className="p-2.5 bg-safety-green/10 text-safety-green rounded border border-safety-green/20 font-bold mb-3 text-[11px] animate-fade-in flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDelivery} className="space-y-3 text-slate-700">
              
              {/* Select target worker */}
              <div>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Colaborador Destinatário</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    if (!selectedReceiptEmpId) setSelectedReceiptEmpId(e.target.value);
                  }}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                >
                  <option value="">Selecione o Colaborador...</option>
                  {companyEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} - {emp.matricula})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select PPE and Qty */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">EPI a Fornecer</label>
                  <select
                    required
                    value={selectedPpeId}
                    onChange={(e) => setSelectedPpeId(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white text-[11px]"
                  >
                    <option value="">Selecione o EPI...</option>
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
                    className="w-full border border-slate-250 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 bg-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Reason for delivery */}
              <div>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Motivo do Fornecimento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                  {(['Entrega Inicial', 'Substituição', 'Extravio', 'Danificado'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReason(m)}
                      className={`p-1.5 rounded border text-center transition font-bold text-[10px] uppercase tracking-tighter ${
                        reason === m 
                          ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signing workflow configurations */}
              <div>
                <label className="font-bold block mb-1 text-[10px] text-slate-500 uppercase">Método de Assinatura Regulatória (NR-06)</label>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setSigningMethod('assinatura_digital')}
                    className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 font-bold ${
                      signingMethod === 'assinatura_digital' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-tight">Digital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('biometria')}
                    className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 font-bold ${
                      signingMethod === 'biometria' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-tight">Biometria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('senha')}
                    className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 font-bold ${
                      signingMethod === 'senha' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-tight">PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('selfie')}
                    className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 font-bold ${
                      signingMethod === 'selfie' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-tight">Selfie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('link')}
                    className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 font-bold ${
                      signingMethod === 'link' 
                        ? 'border-safety-green bg-safety-green/10 text-safety-green' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-tight">Celular</span>
                  </button>
                </div>

                {/* Sub signature interface blocks */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200/60">
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
                    <div className="text-center py-3 space-y-1.5">
                      <Fingerprint className={`w-8 h-8 mx-auto ${isScanningBiometrics ? 'text-blue-500 animate-spin' : 'text-safety-green animate-pulse'}`} />
                      <span className="font-bold text-slate-800 block text-[10px]">Sensor Futronic FS80H</span>
                      <p className="text-[9px] text-slate-400 max-w-xs mx-auto">Posicione o polegar do funcionário no coletor associado ao terminal.</p>
                      
                      {biometricError && (
                        <div className="text-red-500 text-[9px] font-bold mt-2 bg-red-50 p-1.5 rounded border border-red-200">
                          {biometricError}
                        </div>
                      )}
                      {biometricHash && (
                        <div className="text-safety-green text-[9px] font-bold mt-2 bg-safety-green/10 p-1.5 rounded border border-safety-green/20 break-all">
                          ✓ Digital Capturada com Sucesso
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCaptureBiometrics}
                        disabled={isScanningBiometrics || !!biometricHash}
                        className="bg-[#1e293b] hover:bg-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-3 py-1.5 rounded text-[9px] uppercase font-sans mt-2"
                      >
                        {isScanningBiometrics ? 'Aguardando Leitor...' : biometricHash ? 'Biometria Pronta' : 'Capturar Digital'}
                      </button>
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
                          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-bold text-[9px] uppercase transition shadow-sm"
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
                className="w-full bg-safety-green hover:bg-safety-green-dark text-white font-bold p-2.5 rounded transition flex items-center justify-center gap-1.5 uppercase text-[10px] tracking-wide cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Entrega e Criar Ficha
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Interactive Printable Regulatory Sheet (Ficha de EPI) conforme Portaria SIT/MTE n.º 107 */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Ficha Regulamentada (NR-06)</h3>
              </div>
              
              {/* Select recipe to check */}
              <select
                value={selectedReceiptEmpId}
                onChange={(e) => setSelectedReceiptEmpId(e.target.value)}
                className="border border-slate-200 rounded p-1 text-[10px] bg-white font-sans focus:outline-none"
              >
                <option value="">Selecione Colaborador...</option>
                {employees.filter(e => e.companyId === activeCompanyId).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
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
                <div className="border-b border-slate-300 px-3 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
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
                                {del.signatureData?.replace('Biometria Futronic: FUT-', 'FUT-').substring(0, 20)}...
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
                    <div className="px-10 py-4 mt-6 border-t-2 border-slate-800 grid grid-cols-2 gap-16 text-xs">

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
    </div>
  );
}
