import React, { useState } from 'react';
import { 
  Package, 
  ArrowRight, 
  TrendingDown, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  ShoppingCart, 
  CheckCircle2, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { PPE } from '../types';
import Swal from '../utils/swal';

interface StockTabProps {
  ppes: PPE[];
  onAdjustStock: (ppeId: string, value: number) => void;
  onReplenishUnderstocked?: () => Promise<any>;
}

export default function StockTab({ ppes, onAdjustStock, onReplenishUnderstocked }: StockTabProps) {
  const [adjustmentId, setAdjustmentId] = useState<string>('');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [replenishing, setReplenishing] = useState(false);

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentId || !adjustmentValue) return;
    setUpdating(true);
    
    setTimeout(() => {
      onAdjustStock(adjustmentId, parseInt(adjustmentValue));
      setAdjustmentValue('');
      setAdjustmentId('');
      setUpdating(false);
    }, 600);
  };

  const handleBulkReplenish = async () => {
    if (!onReplenishUnderstocked) return;
    setReplenishing(true);
    try {
      const data = await onReplenishUnderstocked();
      if (data && data.success) {
        Swal.fire('Sucesso', `Foram emitidas as requisições de compra e o estoque físico foi reabastecido para os ${data.updated.length} EPIs críticos.`, 'success');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', 'Houve um erro técnico ao reabastecer os equipamentos de segurança.', 'error');
    } finally {
      setReplenishing(false);
    }
  };

  // Automated purchasing suggestions calculation
  const shoppingSuggestions = ppes
    .filter(p => p.stockCount <= p.minStock)
    .map(p => {
      const deficit = p.minStock * 2 - p.stockCount; // Suggest buying up to twice the safety stock
      return {
        ...p,
        suggestedQty: deficit,
        estimateCost: deficit * (p.category.includes('Altura') ? 145 : p.category.includes('Feet') || p.category.includes('Pés') ? 85 : 22)
      };
    });

  return (
    <div className="space-y-4 text-xs">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-750">
        <div className="dense-card">
          <span className="text-[9px] uppercase font-mono text-slate-400 block mb-0.5">Giro Médio Anual</span>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">4.8x Giros</p>
          <p className="text-[10px] text-safety-green font-bold mt-1">Fluxo logístico sob conformidade legal</p>
        </div>

        <div className="dense-card">
          <span className="text-[9px] uppercase font-mono text-slate-400 block mb-0.5">Janela de Cobertura</span>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">42 Dias de Estoque</p>
          <p className="text-[10px] text-slate-400 mt-1">Autonomia média global do almoxarifado</p>
        </div>

        <div className="dense-card">
          <span className="text-[9px] uppercase font-mono text-slate-400 block mb-0.5">Dispersão de Consumo</span>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">12% Desvio Padrão</p>
          <p className="text-[10px] text-slate-400 mt-1">Altamente estável perante NR-01/PGR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Complete Inventory & Simple adjustments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-tight mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-safety-green" />
              Níveis Atuais de Estoque (Almoxarifado)
            </h3>

            <div className="space-y-2.5 font-sans">
              {ppes.map((p) => {
                const stockPercentage = Math.min(100, (p.stockCount / (p.minStock * 2.5)) * 100);
                const isUnderstocked = p.stockCount <= p.minStock;
                return (
                  <div key={p.id} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700/50 relative">
                    <div className="flex justify-between items-center mb-1 text-slate-800 dark:text-slate-100 text-[11px]">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 font-bold">{p.name}</strong>
                        <p className="text-[9px] text-slate-400 mt-0.5">Mínimo necessário: {p.minStock} un | CA {p.caNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[12px] font-mono font-bold ${isUnderstocked ? 'text-red-650 text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                          {p.stockCount} un
                        </span>
                        <p className="text-[8px] text-slate-400 mt-0.5">Estoque disponível</p>
                      </div>
                    </div>

                    {/* Progress Bar representation */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded overflow-hidden mb-1">
                      <div 
                        className={`h-full rounded transition-all duration-500 ${
                          isUnderstocked ? 'bg-red-500' : 'bg-safety-green'
                        }`} 
                        style={{ width: `${stockPercentage}%` }}
                      ></div>
                    </div>

                    {isUnderstocked && (
                      <div className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Estoque Crítico! Adquirir mais {p.minStock * 2 - p.stockCount} un para retornar ao ponto operacional seguro.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Adjustment Console */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-tight mb-2.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-safety-green" />
              Ajuste de Estoque Rápido (Lançamento Almoxarifado)
            </h3>
            
            <form onSubmit={handleUpdateStock} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end text-[11px]">
              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase font-bold">EPI Relacionado</label>
                <select
                  required
                  value={adjustmentId}
                  onChange={(e) => setAdjustmentId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white dark:bg-slate-800 text-[11px]"
                >
                  <option value="">Selecione...</option>
                  {ppes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (CA {p.caNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase font-bold">Nova Quantidade Física</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ex: 150"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded p-1.5 focus:outline-none focus:border-safety-green bg-white dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold p-1.5 py-2.5 transition rounded text-[11px] uppercase tracking-wider cursor-pointer"
              >
                {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Sincronizar Estoque'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Sugestão de Compra Automática */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ShoppingCart className="w-4 h-4 text-safety-green" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Sugestões de Compra (PGR / GRO)</h3>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Análise inteligente de consumo baseada nas fichas NR-06 e níveis de estoque mínimo de segurança.
            </p>

            <div className="space-y-2">
              {shoppingSuggestions.length > 0 ? (
                shoppingSuggestions.map(p => (
                  <div key={p.id} className="p-3 bg-safety-green/[0.03] rounded border border-safety-green/10 text-xs">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[11.5px] leading-snug">{p.name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-0.5">Déficit: {p.minStock - p.stockCount} un | CA {p.caNumber}</p>
                    
                    <div className="mt-2 flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-150 font-mono text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-450 block font-sans">SUGESTÃO</span>
                        <strong className="text-safety-green font-bold">{p.suggestedQty} un</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-slate-450 block font-sans">CUSTO EST.</span>
                        <strong className="text-slate-700 dark:text-slate-200 font-bold">R$ {p.estimateCost.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-8 h-8 text-safety-green animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">Abastecimento Seguro</span>
                  <p className="text-[9px] max-w-[150px] leading-snug text-slate-450">Todos os EPIs estão com níveis adequados e seguros.</p>
                </div>
              )}
            </div>
          </div>

          {shoppingSuggestions.length > 0 && (
            <button
              type="button"
              disabled={replenishing}
              onClick={handleBulkReplenish}
              className="mt-4 w-full bg-safety-green hover:bg-safety-green-dark text-white font-bold p-2.5 rounded transition flex items-center justify-center gap-1.5 uppercase text-[10px] tracking-wide cursor-pointer disabled:opacity-55"
            >
              {replenishing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
              {replenishing ? 'Processando Compra...' : 'Emitir Ordem & Reabastecer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

