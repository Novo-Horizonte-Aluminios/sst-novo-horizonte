import React, { useState } from 'react';
import { Flame, FileText, Search, Shield, AlertCircle, Info, Download } from 'lucide-react';
import { FISPQDocument } from '../types';

interface FispqTabProps {
  fispqDocs: FISPQDocument[];
}

export default function FispqTab({ fispqDocs }: FispqTabProps) {
  const [search, setSearch] = useState('');

  const filtered = fispqDocs.filter(f => 
    f.chemicalName.toLowerCase().includes(search.toLowerCase()) ||
    f.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 text-xs text-slate-700 font-sans">
      
      {/* Tab Header */}
      <div className="bg-white p-4 rounded border border-slate-200">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          Fichas de Informação de Segurança de Produtos Químicos (FISPQ / SDS)
        </h2>
        <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
          Catalogação centralizada de substâncias industriais e classificações do GHS (Globally Harmonized System) exigidas pelas NR-20 e NR-26.
        </p>
      </div>

      {/* Directory controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar Ficha Química (Composto, Fabricante)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-safety-green"
          />
        </div>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-start leading-none gap-2">
                <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200/50 font-mono uppercase tracking-wider">
                  GHS Classified
                </span>
                <span className="text-slate-400 text-[9px] font-mono">v{doc.version}</span>
              </div>

              <h4 className="font-bold text-xs text-slate-800 leading-snug">{doc.chemicalName}</h4>
              <p className="text-slate-400 text-[10px]">Fabricante: {doc.manufacturer}</p>
              
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1 uppercase text-[8px] tracking-wider">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span>Classificação de Perigo (GHS)</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-600 italic">
                  {doc.ghsClassification}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-mono text-[9px]">Revisão: {doc.revisionDate}</span>
              
              <button
                onClick={() => alert(`Invocando Download do arquivo oficial SDS da substância ${doc.chemicalName} em formato ABNT NBR 14725!`)}
                className="text-safety-green hover:underline font-bold flex items-center gap-0.5 uppercase text-[9px] font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-safety-green" />
                Baixar FISPQ (PDF)
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
