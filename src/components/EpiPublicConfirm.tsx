import React, { useState, useEffect } from "react";
import { ShieldCheck, Package, CheckCircle, Clock, AlertTriangle, Fingerprint, HardHat } from "lucide-react";

interface EpiConfirmData {
  delivery: {
    id: string;
    ppeName: string;
    caNumber: string;
    quantity: number;
    reason: string;
    createdAt: string;
    expiresAt: string;
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

export default function EpiPublicConfirm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EpiConfirmData | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [receiptHash, setReceiptHash] = useState("");
  const [receiptTimestamp, setReceiptTimestamp] = useState("");
  const [alert, setAlert] = useState<{ title: string; msg: string; type: string } | null>(null);

  useEffect(() => { loadDelivery(); }, [token]);

  const loadDelivery = async () => {
    try {
      const res = await fetch(`/api/deliveries/confirm/${token}`);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Link invalido ou expirado."); }
      const json = await res.json();
      setData(json);
      if (json.alreadyConfirmed) {
        setConfirmed(true);
        setReceiptTimestamp(json.confirmedAt || "");
        setReceiptHash(json.integrityHash || "");
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const showAlert = (title: string, msg: string, type: string) => {
    setAlert({ title, msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length < 4) { showAlert("PIN invalido", "Digite seu PIN de 4 a 6 digitos.", "warning"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deliveries/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await res.json();
      if (!res.ok) { showAlert("Erro", result.error || "Nao foi possivel confirmar.", "error"); return; }
      setReceiptHash(result.integrityHash);
      setReceiptTimestamp(result.confirmedAt);
      setConfirmed(true);
    } catch { showAlert("Erro de conexao", "Tente novamente em instantes.", "error"); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">Carregando ficha de EPI...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Link Invalido</h2>
        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{error}</p>
        <p className="text-xs text-slate-600 mt-4">Novo Horizonte Alumínios — SESMT</p>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-600/10 blur-[180px] pointer-events-none" />
      <div className="w-full max-w-sm bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl border border-emerald-900/40 shadow-2xl overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-1">Recebimento Confirmado!</h2>
          <p className="text-emerald-400 text-sm font-semibold mb-6">{data?.employee.name}</p>
          <div className="bg-slate-900/80 rounded-2xl p-4 text-left space-y-3 mb-6 border border-slate-800">
            <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">EPI</span><span className="text-white font-bold text-right max-w-[60%]">{data?.delivery.ppeName}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Quantidade</span><span className="text-white font-bold">{data?.delivery.quantity} un.</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Confirmado em</span><span className="text-white font-bold">{receiptTimestamp ? new Date(receiptTimestamp).toLocaleString("pt-BR") : "—"}</span></div>
            {receiptHash && (<div className="pt-2 border-t border-slate-800"><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block mb-1">Hash de Integridade</span><span className="text-emerald-400 font-mono text-[9px] break-all leading-relaxed">{receiptHash}</span></div>)}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Este comprovante eletrônico tem validade jurídica conforme a Lei 14.063/2020 e a NR-06. Guarde o hash para auditoria.</p>
          <p className="text-[10px] text-slate-600 mt-4 font-semibold">Novo Horizonte Alumínios — SESMT</p>
        </div>
      </div>
    </div>
  );

  const expiresAt = data?.delivery.expiresAt ? new Date(data.delivery.expiresAt) : null;
  const hoursLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 3600000)) : 0;

  return (
    <div className="min-h-screen bg-[#070b13] flex items-start justify-center p-4 pt-8 pb-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-amber-600/8 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/8 blur-[150px] pointer-events-none" />
      {alert && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-3 rounded-xl border shadow-xl text-sm font-bold text-center ${alert.type === "error" ? "bg-red-950 border-red-800 text-red-300" : alert.type === "warning" ? "bg-amber-950 border-amber-800 text-amber-300" : "bg-emerald-950 border-emerald-800 text-emerald-300"}`}>
          {alert.title} — {alert.msg}
        </div>
      )}
      <div className="w-full max-w-sm bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-red-500" />
        <div className="p-6 pb-0 text-center">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-base font-black text-white tracking-tight uppercase">Confirmação de EPI</h1>
          <p className="text-slate-400 text-xs mt-1">Novo Horizonte Alumínios — SESMT</p>
          {hoursLeft > 0 && hoursLeft < 24 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              <Clock className="w-3 h-3 text-amber-400" /><span className="text-amber-400 text-[10px] font-bold">Expira em {hoursLeft}h</span>
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block mb-2">Colaborador</span>
            <div className="font-black text-white text-sm">{data?.employee.name}</div>
            <div className="text-slate-400 text-[10px] mt-0.5">Mat. {data?.employee.matricula} · {data?.employee.sector}</div>
            <div className="text-slate-500 text-[10px]">{data?.employee.role}</div>
          </div>
          <div className="bg-slate-900/70 rounded-2xl p-4 border border-amber-900/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">EPI Fornecido</span>
                <div className="font-black text-white text-sm leading-tight">{data?.delivery.ppeName}</div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="bg-slate-800 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded-md font-bold">CA: {data?.delivery.caNumber || "N/A"}</span>
                  <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-md">{data?.delivery.quantity} un.</span>
                  <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-md">{data?.delivery.reason}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-950/30 border border-blue-900/30 rounded-xl p-3">
            <p className="text-xs text-blue-300 leading-relaxed text-center">
              Ao confirmar, declaro que <strong>recebi o equipamento acima</strong> em perfeito estado e me comprometo a utilizá-lo conforme a NR-06.
            </p>
          </div>
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-2">Sua Assinatura Digital (PIN)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500"><Fingerprint className="w-4 h-4" /></span>
                <input
                  type="password" inputMode="numeric" pattern="[0-9]*" required maxLength={6} minLength={4}
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="PIN 4-6 dígitos"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500/80 text-white rounded-xl py-3.5 pl-11 pr-4 text-lg font-mono tracking-[0.5em] text-center outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 placeholder:text-xs"
                  autoComplete="off"
                />
              </div>
              {data && !data.employee.hasPin && (
                <p className="text-[10px] text-amber-400 mt-1.5 text-center">Sem PIN cadastrado. Contate o RH.</p>
              )}
            </div>
            <button type="submit" disabled={submitting || pin.length < 4 || !(data?.employee.hasPin)}
              className={`w-full rounded-2xl py-4 text-sm font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${submitting || pin.length < 4 || !(data?.employee.hasPin) ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/30 active:scale-95"}`}>
              {submitting ? (<><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Confirmando...</>) : (<><ShieldCheck className="w-4 h-4" />Confirmar Recebimento</>)}
            </button>
          </form>
          <div className="pt-2 border-t border-slate-800">
            <p className="text-[9px] text-slate-600 text-center leading-relaxed">
              Assinatura eletrônica — Lei 14.063/2020 · NR-06<br/>Data/hora e IP registrados para auditoria LGPD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
