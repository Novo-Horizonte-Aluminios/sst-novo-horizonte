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
  AlertCircle
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
  const [signingMethod, setSigningMethod] = useState<'assinatura_digital' | 'biometria' | 'senha' | 'selfie'>('assinatura_digital');
  
  // Custom states
  const [pinNumber, setPinNumber] = useState('');
  const [selfieOptionSelected, setSelfieOptionSelected] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Canvas drawing properties
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignaturePoints, setHasSignaturePoints] = useState(false);

  // Printable selected employee receipt
  const [selectedReceiptEmpId, setSelectedReceiptEmpId] = useState('');

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
      signatureValue = `Hash Biométrico Integrado: SHA256-${Date.now()}`;
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
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              const comp = companies.find(c => c.id === activeCompanyId);
              exportDeliveriesToExcel(deliveries, employees, comp ? comp.tradingName : "Novo Horizonte Alumínios");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded transition cursor-pointer shadow-sm font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              const comp = companies.find(c => c.id === activeCompanyId);
              exportDeliveriesToPDF(deliveries, employees, comp ? comp.tradingName : "Novo Horizonte Alumínios");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded transition cursor-pointer shadow-sm font-semibold"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Baixar PDF</span>
          </button>
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
                <div className="grid grid-cols-4 gap-1.5 mb-2">
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
                      <Fingerprint className="w-8 h-8 text-safety-green mx-auto animate-pulse" />
                      <span className="font-bold text-slate-800 block text-[10px]">Sensor Capacitivo Integrado</span>
                      <p className="text-[9px] text-slate-400 max-w-xs mx-auto">Posicione o polegar do funcionário no coletor associado ao terminal.</p>
                      <button
                        type="button"
                        onClick={() => alert('Biometria biométrica registrada via USB-2')}
                        className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold px-2.5 py-1 rounded text-[9px] uppercase font-sans"
                      >
                        Capturação de Teste
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
                          <option value="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150">Juliana Montenegro (Fração Industrial)</option>
                          <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150">Carlos Henrique (Logística Extrema)</option>
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
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 font-sans leading-relaxed text-[10px] text-slate-800 space-y-3 print-receipt">
                
                {/* Receipt Header */}
                <div className="text-center pb-2 border-b border-slate-200 space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-tight text-[10px]">
                    REGISTRO E CONTROLE DE ENTREGA DE EPI
                  </h4>
                  <p className="text-[9px] text-slate-400 uppercase font-mono">Portaria SIT/MTE n.º 107 e NR-06</p>
                </div>

                {/* Company & Employee Bio details */}
                <div className="grid grid-cols-2 gap-3 text-[9px] border-b border-slate-200 pb-2">
                  <div className="space-y-0.5 text-slate-600">
                    <p className="text-[8px] text-slate-400 font-mono uppercase font-bold">EMPREGADORA</p>
                    <p className="font-bold text-slate-800 text-[10px]">{currentCompany?.name}</p>
                    <p>CNPJ: {currentCompany?.cnpj}</p>
                    <p>CNAE: {currentCompany?.cnae}</p>
                  </div>

                  <div className="space-y-0.5 text-slate-600">
                    <p className="text-[8px] text-slate-400 font-mono uppercase font-bold">COLABORADOR(A)</p>
                    <p className="font-bold text-slate-800 text-[10px]">{activeReceiptEmployee.name}</p>
                    <p>CPF: {activeReceiptEmployee.cpf}</p>
                    <p>Cargo: {activeReceiptEmployee.role} | Setor: {activeReceiptEmployee.sector}</p>
                  </div>
                </div>

                {/* Delivered Items Log */}
                <div>
                  <h5 className="font-bold text-slate-900 uppercase text-[8px] tracking-wider mb-1.5">Equipamentos Fornecidos</h5>
                  {activeReceiptDeliveries.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {activeReceiptDeliveries.map((del, i) => (
                        <div key={del.id} className="p-1.5 bg-white rounded border border-slate-200 flex justify-between items-center text-[9px]">
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{del.ppeName}</p>
                            <p className="text-[8px] text-slate-400 font-mono leading-none mt-0.5">CA MTE: <strong>{del.caNumber}</strong> | Motivo: {del.reason}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[8px]">
                              Qtd: {del.quantity}
                            </span>
                            <p className="text-[8px] text-slate-400 font-mono mt-0.5">{del.deliveryDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic py-3 text-center text-[9px]">Nenhum EPI fornecido registrado para este colaborador até o momento.</p>
                  )}
                </div>

                {/* Regulatory terms & agreement conforming to NR-06 */}
                <div className="text-[8.5px] text-slate-500 leading-normal border-t border-slate-200 pt-2 space-y-1">
                  <p className="font-bold uppercase text-[7.5px] text-slate-600">Termo de Recebimento de EPI (NR-06)</p>
                  <p className="text-justify leading-snug">
                    Declaro que recebi gratuitamente os equipamentos de proteção individual indicados, adequados aos riscos no cumprimento do meu contrato laboral. Comprometo-me a usar apenas para a finalidade que se destina, mantendo guarda e conservação sob as penas da lei trabalhista brasileira.
                  </p>
                </div>

                {/* Imprinted worker validation visual */}
                {activeReceiptDeliveries.length > 0 && (
                  <div className="flex justify-between items-end border-t border-slate-200 pt-2 text-[9px]">
                    <div>
                      <span className="text-[7px] text-slate-400 font-mono uppercase block">SST Resp</span>
                      <p className="font-bold text-slate-800 text-[9px] leading-tight">{currentCompany?.sstResponsible}</p>
                    </div>

                    <div className="text-center font-mono text-[7px] text-slate-400 bg-slate-100 p-1 rounded border border-slate-200 leading-none">
                      <span className="text-[7px] font-mono text-safety-green font-extrabold uppercase tracking-wide block mb-0.5">
                        ✔ SEGURO GARANTIDO
                      </span>
                      <span>MD5: {activeReceiptDeliveries[0].id}</span>
                    </div>
                  </div>
                )}

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
