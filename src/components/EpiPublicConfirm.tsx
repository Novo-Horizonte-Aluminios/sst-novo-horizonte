import React, { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, CheckCircle, AlertTriangle, Shield, X } from "lucide-react";

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

const PIN_LENGTH = 6;

function getEpiEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("oculos") || n.includes("\u00f3culos")) return "\uD83E\uDD7D";
  if (n.includes("colete")) return "\uD83E\uDDBA";
  if (n.includes("capacete")) return "\uD83E\uDE96";
  if (n.includes("luva")) return "\uD83E\uDDE4";
  if (n.includes("botina") || n.includes("bota")) return "\uD83D\uDC62";
  if (n.includes("respirador") || n.includes("mascara") || n.includes("m\u00e1scara")) return "\uD83D\uDE37";
  if (n.includes("protetor auricular") || n.includes("abafador")) return "\uD83C\uDFA7";
  if (n.includes("cinto") || n.includes("talabarte")) return "\uD83E\uDE9D";
  if (n.includes("avental") || n.includes("mangote")) return "\uD83E\uDD7C";
  return "\uD83D\uDEE1\uFE0F";
}

function fmt(isoDate: string, type: "date" | "time"): string {
  try {
    const d = new Date(isoDate);
    return type === "date"
      ? d.toLocaleDateString("pt-BR")
      : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return "\u2014"; }
}

function genProtocol(hash: string): string {
  return "PROT-" + hash.substring(0, 8).toUpperCase();
}

// Individual PIN boxes with auto-advance and auto-back
function PinInput({ length, onChange, disabled }: { length: number; onChange: (v: string) => void; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => { refs.current[i]?.focus(); };

  const handleKeyDown = useCallback((i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) { next[i] = ""; setDigits(next); onChange(next.join("")); }
      else if (i > 0) { next[i - 1] = ""; setDigits(next); onChange(next.join("")); focus(i - 1); }
    } else if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    else if (e.key === "ArrowRight" && i < length - 1) focus(i + 1);
  }, [digits, length, onChange]);

  const handleChange = useCallback((i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    const next = [...digits];
    let idx = i;
    for (const c of raw.split("")) {
      if (idx >= length) break;
      next[idx++] = c;
    }
    setDigits(next);
    onChange(next.join(""));
    const nextEmpty = next.findIndex((d, j) => j >= i && !d);
    focus(nextEmpty !== -1 ? nextEmpty : Math.min(idx, length - 1));
  }, [digits, length, onChange]);

  const handleFocus = (i: number) => {
    const firstEmpty = digits.findIndex(d => !d);
    if (firstEmpty !== -1 && firstEmpty < i) focus(firstEmpty);
  };

  useEffect(() => { focus(0); }, []);

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="Campo PIN">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d ? "\u2022" : ""}
          onChange={ev => handleChange(i, ev)}
          onKeyDown={ev => handleKeyDown(i, ev)}
          onFocus={() => handleFocus(i)}
          disabled={disabled}
          aria-label={"D\u00edgito " + (i + 1) + " do PIN"}
          autoComplete="off"
          style={{ caretColor: "transparent" }}
          className={[
            "w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 text-center text-2xl font-bold",
            "bg-[#1B263B] text-white outline-none transition-all duration-150",
            d ? "border-amber-400 bg-[#22304a] shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
              : "border-slate-600 focus:border-amber-400 focus:bg-[#1e2d42]",
            disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-white text-xs font-bold text-right max-w-[55%]">{value}</span>
    </div>
  );
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
  const [toast, setToast] = useState<{ msg: string; type: "error" | "warn" } | null>(null);

  useEffect(() => { loadDelivery(); }, [token]);

  const loadDelivery = async () => {
    try {
      const res = await fetch("/api/deliveries/confirm/" + token);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Link inv\u00e1lido ou expirado."); }
      const json = await res.json();
      setData(json);
      if (json.alreadyConfirmed) {
        setConfirmed(true);
        setReceiptTimestamp(json.confirmedAt || "");
        setReceiptHash(json.integrityHash || "");
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const showToast = (msg: string, type: "error" | "warn") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { showToast("Digite seu PIN de 4 a 6 d\u00edgitos.", "warn"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deliveries/confirm/" + token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await res.json();
      if (!res.ok) { showToast(result.error || "N\u00e3o foi poss\u00edvel confirmar.", "error"); return; }
      setReceiptHash(result.integrityHash || "");
      setReceiptTimestamp(result.confirmedAt || "");
      setConfirmed(true);
    } catch { showToast("Erro de conex\u00e3o. Tente novamente.", "error"); } finally { setSubmitting(false); }
  };

  const canSubmit = pin.length >= 4 && !!data?.employee.hasPin && !submitting;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{ background: "#111827" }}>
      <img src="/logo_horizontal.png" alt="Novo Horizonte Alum\u00ednios" className="w-36 mb-8 opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <div className="w-10 h-10 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin mb-3" />
      <p className="text-slate-400 text-sm">Carregando ficha...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{ background: "#111827" }}>
      <img src="/logo_horizontal.png" alt="Novo Horizonte Alum\u00ednios" className="w-36 mb-8 opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <div className="w-full max-w-xs rounded-2xl border border-red-800/50 p-6 text-center" style={{ background: "#1B263B" }}>
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-white font-bold text-base mb-2">Link Inv\u00e1lido</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
        <p className="text-slate-600 text-xs mt-4">Novo Horizonte Alum\u00ednios \u2014 SESMT</p>
      </div>
    </div>
  );

  if (confirmed) {
    const protocol = receiptHash ? genProtocol(receiptHash) : "\u2014";
    const qty = data?.delivery.quantity || 1;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans" style={{ background: "#111827" }}>
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#1B263B" }}>
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400" />
          <div className="p-6 flex flex-col items-center">
            <img src="/logo_horizontal.png" alt="Novo Horizonte Alum\u00ednios" className="w-36 mb-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-white text-xl font-black text-center mb-1">Recebimento Confirmado!</h2>
            <p className="text-emerald-400 text-sm font-semibold mb-4 text-center">{data?.employee.name}</p>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-mono font-bold">{protocol}</span>
            </div>
            <div className="w-full rounded-2xl overflow-hidden mb-5 border border-slate-700/50" style={{ background: "#111827" }}>
              <div className="px-4 py-2.5 border-b border-slate-700/50">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Comprovante</span>
              </div>
              <div className="px-4 py-2">
                <Row label="Colaborador" value={data?.employee.name || "\u2014"} />
                <Row label="EPI" value={data?.delivery.ppeName || "\u2014"} />
                {data?.delivery.caNumber && <Row label="CA" value={data.delivery.caNumber + " \u2714"} />}
                <Row label="Quantidade" value={qty + " unidade" + (qty > 1 ? "s" : "")} />
                <Row label="Data" value={receiptTimestamp ? fmt(receiptTimestamp, "date") : "\u2014"} />
                <Row label="Hora" value={receiptTimestamp ? fmt(receiptTimestamp, "time") : "\u2014"} />
                {receiptHash && (
                  <div className="pt-2 pb-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Hash</span>
                    <span className="text-emerald-400 font-mono text-[9px] break-all">{receiptHash}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-500 text-[10px] text-center leading-relaxed mb-4">
              Validade jur\u00eddica conforme a Lei n\u00ba 14.063/2020 e NR-06.
            </p>
            <button onClick={() => window.close()} className="w-full py-4 rounded-2xl font-bold text-sm text-white border border-slate-600 hover:bg-slate-700 active:scale-[0.98] transition-all" style={{ background: "#1B263B" }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const epiEmoji = data?.delivery.ppeName ? getEpiEmoji(data.delivery.ppeName) : "\uD83D\uDEE1\uFE0F";

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#111827" }}>
      {toast && (
        <div className={"fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3.5 shadow-xl text-sm font-semibold " + (toast.type === "error" ? "bg-red-900 text-red-100" : "bg-amber-900 text-amber-100")}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-10 max-w-sm mx-auto w-full">

        {/* HEADER */}
        <div className="w-full text-center mb-5">
          <img src="/logo_horizontal.png" alt="Novo Horizonte Alum\u00ednios" className="w-40 mx-auto mb-3 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest mb-3">Seguran\u00e7a e Sa\u00fade do Trabalho</p>
          <div className="border-t border-slate-700/50 pt-3">
            <h1 className="text-white text-sm font-black uppercase tracking-tight leading-tight">Confirma\u00e7\u00e3o de Recebimento de EPI</h1>
          </div>
        </div>

        {/* COLLABORATOR */}
        <div className="w-full rounded-2xl overflow-hidden mb-3 border border-slate-700/30" style={{ background: "#1B263B" }}>
          <div className="px-4 py-2.5 border-b border-slate-700/30 flex items-center gap-2" style={{ background: "#162032" }}>
            <span className="text-base leading-none">\uD83D\uDC77</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Colaborador</span>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-white text-lg font-black leading-tight mb-2">{data?.employee.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {data?.employee.matricula && <span className="text-slate-400 text-[11px]"><span className="text-slate-500 font-semibold">Mat. </span><span className="text-slate-200 font-bold">{data.employee.matricula}</span></span>}
              {data?.employee.role && <span className="text-slate-300 text-[11px] font-semibold">{data.employee.role}</span>}
              {data?.employee.sector && <span className="text-slate-400 text-[11px]">{data.employee.sector}</span>}
            </div>
          </div>
        </div>

        {/* EPI CARD */}
        <div className="w-full rounded-2xl overflow-hidden mb-3 border border-amber-800/30" style={{ background: "#1B263B" }}>
          <div className="px-4 py-2.5 border-b border-amber-800/20 flex items-center gap-2" style={{ background: "#1a1f2e" }}>
            <span className="text-base leading-none">{epiEmoji}</span>
            <span className="text-amber-500/80 text-[10px] font-bold uppercase tracking-widest">EPI Fornecido</span>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-white text-base font-black leading-tight mb-3">{data?.delivery.ppeName}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {data?.delivery.caNumber && (
                <span className="flex items-center gap-1 border text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold" style={{ background: "#1a2436", borderColor: "rgba(100,116,139,0.4)", color: "#e2e8f0" }}>
                  CA {data.delivery.caNumber} <span className="text-emerald-400">\u2714</span>
                </span>
              )}
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                {data?.delivery.quantity} unidade{(data?.delivery.quantity || 1) > 1 ? "s" : ""}
              </span>
              {data?.delivery.reason && <span className="text-[10px] px-2.5 py-1 rounded-lg border text-slate-400" style={{ background: "rgba(30,40,58,0.6)", borderColor: "rgba(100,116,139,0.3)" }}>{data.delivery.reason}</span>}
            </div>
            {(data?.delivery.createdAt || data?.delivery.technicianName) && (
              <div className="border-t border-slate-700/40 pt-2.5 grid grid-cols-2 gap-1.5">
                {data?.delivery.createdAt && <>
                  <div className="text-[11px]"><span className="text-slate-500">\uD83D\uDCC5 </span><span className="text-slate-300 font-semibold">{fmt(data.delivery.createdAt, "date")}</span></div>
                  <div className="text-[11px]"><span className="text-slate-500">\uD83D\uDD52 </span><span className="text-slate-300 font-semibold">{fmt(data.delivery.createdAt, "time")}</span></div>
                </>}
                {data?.delivery.technicianName && <div className="text-[11px] col-span-2"><span className="text-slate-500">\uD83D\uDC77 </span><span className="text-slate-300 font-semibold">{data.delivery.technicianName}</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* DECLARATION */}
        <div className="w-full rounded-xl border px-4 py-3 mb-5" style={{ background: "rgba(29,53,87,0.25)", borderColor: "rgba(37,99,235,0.2)" }}>
          <p className="text-blue-200/70 text-[11px] leading-relaxed text-center">
            Declaro que recebi o Equipamento de Prote\u00e7\u00e3o Individual acima descrito em perfeitas condi\u00e7\u00f5es de uso e estou ciente da obrigatoriedade de sua utiliza\u00e7\u00e3o conforme a <strong className="text-blue-300">NR-06</strong> e os procedimentos internos da empresa.
          </p>
        </div>

        {/* PIN */}
        <div className="w-full mb-5">
          <p className="text-slate-200 text-xs font-bold uppercase tracking-widest text-center mb-1">Confirma\u00e7\u00e3o por PIN</p>
          <p className="text-slate-500 text-[11px] text-center mb-4">Digite seu PIN de seguran\u00e7a para confirmar o recebimento</p>
          {data?.employee.hasPin ? (
            <PinInput length={PIN_LENGTH} onChange={setPin} disabled={submitting} />
          ) : (
            <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-center">
              <p className="text-amber-400 text-xs font-semibold">\u26a0 PIN n\u00e3o cadastrado. Contate o RH para regulariza\u00e7\u00e3o.</p>
            </div>
          )}
        </div>

        {/* CONFIRM BUTTON */}
        <form onSubmit={handleConfirm} className="w-full mb-5">
          <button
            type="submit"
            disabled={!canSubmit}
            style={{ background: canSubmit ? "#F59E0B" : "#1e2737", minHeight: "60px", fontSize: "17px", fontWeight: 700 }}
            className={"w-full rounded-2xl flex items-center justify-center gap-2.5 uppercase tracking-wide transition-all duration-200 " + (canSubmit ? "text-black shadow-lg shadow-amber-900/30 active:scale-[0.97] hover:brightness-110" : "text-slate-600 cursor-not-allowed border border-slate-700")}
          >
            {submitting ? (
              <><div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" /><span>Confirmando...</span></>
            ) : (
              <><ShieldCheck className="w-5 h-5" /><span>Confirmar Recebimento</span></>
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="border-t border-slate-800 pt-4 w-full">
          <p className="text-slate-600 text-[9px] text-center leading-relaxed">
            Assinatura eletr\u00f4nica registrada conforme a Lei n\u00ba 14.063/2020 e NR-06.<br />
            Data, hora, endere\u00e7o IP, dispositivo e navegador ser\u00e3o registrados para fins de auditoria, rastreabilidade e conformidade com a LGPD.
          </p>
        </div>
      </div>
    </div>
  );
}