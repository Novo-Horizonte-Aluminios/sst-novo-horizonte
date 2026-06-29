import React, { useState, useEffect } from "react";
import {
  ShieldCheck, CheckCircle, Clock, AlertTriangle,
  Fingerprint, Eye, EyeOff, Shield
} from "lucide-react";

interface EpiConfirmData {
  delivery: {
    id: string;
    ppeName: string;
    caNumber: string;
    quantity: number;
    reason: string;
    createdAt: string;
    expiresAt: string;
    technicianName?: string;
  };
  employee: {
    id: string;
    name: string;
    matricula: string;
    sector: string;
    role: string;
    hasPin: boolean;
  };
  company: string;
  alreadyConfirmed: boolean;
  confirmedAt?: string;
  integrityHash?: string;
}

function getEpiEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("óculos") || n.includes("oculos")) return "🥽";
  if (n.includes("colete")) return "🦺";
  if (n.includes("capacete")) return "🪖";
  if (n.includes("luva")) return "🧤";
  if (n.includes("botina") || n.includes("bota")) return "👢";
  if (n.includes("respirador") || n.includes("máscara") || n.includes("mascara")) return "😷";
  if (n.includes("protetor auricular") || n.includes("abafador")) return "🎧";
  if (n.includes("cinto") || n.includes("talabarte")) return "🪝";
  return "🛡️";
}

function formatDate(isoDate: string): string {
  try { return new Date(isoDate).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

function formatTime(isoDate: string): string {
  try { return new Date(isoDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

function generateProtocol(hash: string): string {
  return "PROT-" + hash.substring(0, 8).toUpperCase();
}

export default function EpiPublicConfirm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EpiConfirmData | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [receiptHash, setReceiptHash] = useState("");
  const [receiptTimestamp, setReceiptTimestamp] = useState("");
  const [alert, setAlert] = useState<{ title: string; msg: string; type: string } | null>(null);

  useEffect(() => { loadDelivery(); }, [token]);

  const loadDelivery = async () => {
    try {
      const res = await fetch(`/api/deliveries/confirm/${token}`);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Link inválido ou expirado."); }
      const json = await res.json();
      setData(json);
      if (json.alreadyConfirmed) {
        setConfirmed(true);
        setReceiptTimestamp(json.confirmedAt || "");
        setReceiptHash(json.integrityHash || "");
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const showAlertMsg = (title: string, msg: string, type: string) => {
    setAlert({ title, msg, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length < 4) { showAlertMsg("PIN inválido", "Digite seu PIN de 4 a 6 dígitos.", "warning"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deliveries/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await res.json();
      if (!res.ok) { showAlertMsg("Erro", result.error || "Não foi possível confirmar.", "error"); return; }
      setReceiptHash(result.integrityHash);
      setReceiptTimestamp(result.confirmedAt);
      setConfirmed(true);
    } catch { showAlertMsg("Erro de conexão", "Tente novamente em instantes.", "error"); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 text-white font-sans">
      <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="w-44 mb-8 opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">Carregando ficha de EPI...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 font-sans">
      <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="w-44 mb-8 opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <div className="bg-[#0f172a] border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Link Inválido ou Expirado</h2>
        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{error}</p>
        <p className="text-xs text-slate-600 mt-6 border-t border-slate-800 pt-4">Novo Horizonte Alumínios — SESMT</p>
      </div>
    </div>
  );

  if (confirmed) {
    const protocol = receiptHash ? generateProtocol(receiptHash) : "—";
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-600/8 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/8 blur-[150px] pointer-events-none" />
        <div className="w-full max-w-sm bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl relative z-10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />
          <div className="p-7">
            <div className="flex justify-center mb-6">
              <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="w-48 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight text-center">Recebimento Confirmado!</h2>
              <p className="text-emerald-400 text-sm font-semibold mt-1 text-center">{data?.employee.name}</p>
            </div>
            <div className="flex justify-center mb-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-mono font-bold">{protocol}</span>
              </div>
            </div>
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden mb-5">
              <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Comprovante de Entrega</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs gap-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Colaborador</span><span className="text-white font-bold text-right">{data?.employee.name}</span></div>
                <div className="flex justify-between text-xs gap-2"><span className="text-slate-500 font-bold uppercase tracking-wider">EPI</span><span className="text-white font-bold text-right max-w-[55%]">{data?.delivery.ppeName}</span></div>
                {data?.delivery.caNumber && (<div className="flex justify-between text-xs gap-2"><span className="text-slate-500 font-bold uppercase tracking-wider">CA</span><span className="text-emerald-400 font-mono font-bold">{data.delivery.caNumber} ✔</span></div>)}
                <div className="flex justify-between text-xs gap-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Quantidade</span><span className="text-white font-bold">{data?.delivery.quantity} unidade{(data?.delivery.quantity || 0) > 1 ? "s" : ""}</span></div>
                <div className="flex justify-between text-xs gap-2 border-t border-slate-800 pt-3"><span className="text-slate-500 font-bold uppercase tracking-wider">Data</span><span className="text-white font-bold">{receiptTimestamp ? formatDate(receiptTimestamp) : "—"}</span></div>
                <div className="flex justify-between text-xs gap-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Hora</span><span className="text-white font-bold">{receiptTimestamp ? formatTime(receiptTimestamp) : "—"}</span></div>
                {receiptHash && (<div className="border-t border-slate-800 pt-3"><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block mb-1">Hash de Integridade</span><span className="text-emerald-400 font-mono text-[9px] break-all leading-relaxed">{receiptHash}</span></div>)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed text-center mb-4">Este comprovante tem validade jurídica conforme a Lei nº 14.063/2020 e a NR-06.</p>
            <button onClick={() => window.close()} className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95 border border-slate-700">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = data?.delivery.expiresAt ? new Date(data.delivery.expiresAt) : null;
  const hoursLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 3600000)) : 0;
  const createdAt = data?.delivery.createdAt;
  const epiEmoji = data?.delivery.ppeName ? getEpiEmoji(data.delivery.ppeName) : "🛡️";

  return (
    <div className="min-h-screen bg-[#070b13] flex items-start justify-center p-4 pt-6 pb-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-amber-600/6 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/6 blur-[150px] pointer-events-none" />
      {alert && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-3.5 rounded-xl border shadow-2xl text-sm font-bold text-center transition-all ${alert.type === "error" ? "bg-red-950 border-red-800 text-red-300" : alert.type === "warning" ? "bg-amber-950 border-amber-800 text-amber-300" : "bg-emerald-950 border-emerald-800 text-emerald-300"}`}>
          {alert.title} — {alert.msg}
        </div>
      )}
      <div className="w-full max-w-sm bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl relative z-10 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-red-500" />
        <div className="px-6 pt-7 pb-2 text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo_horizontal.png" alt="Novo Horizonte Alumínios" className="w-[200px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <p className="text-slate-500 text-[10px] font-semibold tracking-widest uppercase mb-4">Segurança e Saúde do Trabalho</p>
          <div className="border-t border-slate-800/60 pt-4 pb-2">
            <h1 className="text-base font-black text-white tracking-tight uppercase leading-tight">Confirmação de Recebimento de EPI</h1>
          </div>
          {hoursLeft > 0 && hoursLeft < 24 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              <Clock className="w-3 h-3 text-amber-400" /><span className="text-amber-400 text-[10px] font-bold">Link expira em {hoursLeft}h</span>
            </div>
          )}
        </div>
        <div className="px-6 pb-7 space-y-4 mt-2">
          {/* Employee Card */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
              <span className="text-base">👷</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Colaborador</span>
            </div>
            <div className="p-4">
              <div className="font-black text-white text-base leading-tight mb-2">{data?.employee.name}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px]"><span className="text-slate-600 font-bold uppercase tracking-wider w-16">Matrícula</span><span className="text-slate-300 font-semibold">{data?.employee.matricula || "—"}</span></div>
                <div className="flex items-center gap-2 text-[10px]"><span className="text-slate-600 font-bold uppercase tracking-wider w-16">Cargo</span><span className="text-slate-300 font-semibold">{data?.employee.role || "—"}</span></div>
                <div className="flex items-center gap-2 text-[10px]"><span className="text-slate-600 font-bold uppercase tracking-wider w-16">Setor</span><span className="text-slate-300 font-semibold">{data?.employee.sector || "—"}</span></div>
              </div>
            </div>
          </div>
          {/* EPI Card */}
          <div className="bg-slate-900/70 rounded-2xl border border-amber-900/30 overflow-hidden">
            <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-900/30 flex items-center gap-2">
              <span className="text-base">{epiEmoji}</span>
              <span className="text-[9px] font-mono text-amber-600/80 uppercase tracking-widest font-bold">EPI Fornecido</span>
            </div>
            <div className="p-4">
              <div className="font-black text-white text-sm leading-tight mb-3">{data?.delivery.ppeName}</div>
              <div className="flex flex-wrap gap-2">
                {data?.delivery.caNumber && (
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 text-[9px] font-mono px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                    CA {data.delivery.caNumber} <span className="text-emerald-400">✔</span>
                  </span>
                )}
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-2.5 py-1 rounded-lg">
                  {data?.delivery.quantity} unidade{(data?.delivery.quantity || 0) > 1 ? "s" : ""}
                </span>
                {data?.delivery.reason && (
                  <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[9px] px-2.5 py-1 rounded-lg">{data.delivery.reason}</span>
                )}
              </div>
            </div>
          </div>
          {/* Delivery info */}
          {(data?.delivery.technicianName || createdAt) && (
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Dados da Entrega</span>
              </div>
              <div className="p-4 space-y-2">
                {data?.delivery.technicianName && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span>👷</span><span className="text-slate-500 font-bold uppercase tracking-wider">Entregue por</span>
                    <span className="text-slate-300 font-semibold ml-auto">{data.delivery.technicianName}</span>
                  </div>
                )}
                {createdAt && (<>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span>📅</span><span className="text-slate-500 font-bold uppercase tracking-wider">Data</span>
                    <span className="text-slate-300 font-semibold ml-auto">{formatDate(createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span>🕒</span><span className="text-slate-500 font-bold uppercase tracking-wider">Hora</span>
                    <span className="text-slate-300 font-semibold ml-auto">{formatTime(createdAt)}</span>
                  </div>
                </>)}
              </div>
            </div>
          )}
          {/* Declaration */}
          <div className="bg-blue-950/25 border border-blue-900/25 rounded-xl p-4">
            <p className="text-xs text-blue-200/80 leading-relaxed text-center">
              Declaro que recebi o Equipamento de Proteção Individual acima descrito em perfeitas condições de uso e estou ciente da obrigatoriedade de sua utilização conforme a <strong className="text-blue-300">NR-06</strong>, procedimentos internos da empresa e demais normas aplicáveis.
            </p>
          </div>
          {/* PIN Form */}
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">Confirmação por PIN</label>
              <p className="text-[10px] text-slate-500 mb-2">Digite seu PIN de segurança para confirmar o recebimento.</p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                  <Fingerprint className="w-4 h-4" />
                </span>
                <input
                  id="pin-input"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric" pattern="[0-9]*" required maxLength={6} minLength={4}
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="PIN 4–6 dígitos"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500/80 text-white rounded-xl py-4 pl-11 pr-11 text-lg font-mono tracking-[0.5em] text-center outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 placeholder:text-xs"
                  autoComplete="off"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {data && !data.employee.hasPin && (
                <p className="text-[10px] text-amber-400 mt-1.5 text-center">⚠ PIN não cadastrado. Contate o RH para regularização.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || pin.length < 4 || !(data?.employee.hasPin)}
              className={`w-full rounded-2xl py-4 text-sm font-black tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 min-h-[56px] ${
                submitting || pin.length < 4 || !(data?.employee.hasPin)
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                  : "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black shadow-lg shadow-amber-900/30 active:scale-[0.98] hover:shadow-xl hover:shadow-amber-900/40"
              }`}
            >
              {submitting ? (<><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Confirmando...</>) : (<><ShieldCheck className="w-4 h-4" />Confirmar Recebimento</>)}
            </button>
          </form>
          {/* Footer */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[9px] text-slate-600 text-center leading-relaxed">
              Assinatura eletrônica registrada conforme a Lei nº 14.063/2020.<br />
              Os registros de data, hora, endereço IP, dispositivo e navegador serão armazenados para fins de auditoria, rastreabilidade e conformidade com a LGPD e NR-06.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
