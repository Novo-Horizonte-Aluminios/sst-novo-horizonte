import React, { useState } from 'react';
import { 
  ScrollText, 
  FileDown, 
  Printer, 
  LayoutDashboard, 
  FileCheck, 
  ShieldAlert, 
  GraduationCap, 
  Flame, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Cpu
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Company, 
  Employee, 
  PPE, 
  PPEDelivery, 
  EmployeeTraining, 
  AccidentReport, 
  ActionPlan, 
  FISPQDocument 
} from '../types';
import { 
  exportDeliveriesToExcel, 
  exportDeliveriesToPDF, 
  exportDashboardToExcel, 
  exportDashboardToPDF 
} from '../utils/exportUtils';
import { generateBulkZip } from '../utils/bulkExportUtils';
import { Archive, FolderDown, Check, Columns, Filter, CheckSquare } from 'lucide-react';
import Swal from 'sweetalert2';

interface ReportsTabProps {
  companies: Company[];
  employees: Employee[];
  ppes: PPE[];
  deliveries: PPEDelivery[];
  employeeTrainings: EmployeeTraining[];
  accidents: AccidentReport[];
  actionPlans: ActionPlan[];
  fispqDocs: FISPQDocument[];
  activeCompanyId: string;
}

export default function ReportsTab({
  companies,
  employees,
  ppes,
  deliveries,
  employeeTrainings,
  accidents,
  actionPlans,
  fispqDocs,
  activeCompanyId
}: ReportsTabProps) {
  const currentCompany = companies.find(c => c.id === activeCompanyId);
  const activeCompanyName = currentCompany ? currentCompany.tradingName : "Diretoria Geral";

  // Filter datasets relative to current active company
  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId);
  const employeeIds = companyEmployees.map(e => e.id);

  const companyDeliveries = deliveries.filter(d => employeeIds.includes(d.employeeId));
  const companyTrainings = employeeTrainings.filter(t => employeeIds.includes(t.employeeId));
  const companyAccidents = accidents; // All accidents are accessible globally

  // 1. Dashboard static datasets matching DashboardTab.tsx charts
  const deliveryHistoryData = [
    { name: 'Jan/26', 'Entregas Concluídas': 92, 'Meta de Segurança': 95 },
    { name: 'Fev/26', 'Entregas Concluídas': 94, 'Meta de Segurança': 95 },
    { name: 'Mar/26', 'Entregas Concluídas': 91, 'Meta de Segurança': 95 },
    { name: 'Abr/26', 'Entregas Concluídas': 96, 'Meta de Segurança': 95 },
    { name: 'Mai/26', 'Entregas Concluídas': 98, 'Meta de Segurança': 95 },
    { name: 'Jun/26', 'Entregas Concluídas': 97, 'Meta de Segurança': 95 }
  ];

  const accidentHistoryData = [
    { name: 'Jan/26', 'Quase Acidentes': 4, 'Acidentes Graves': 0 },
    { name: 'Fev/26', 'Quase Acidentes': 2, 'Acidentes Graves': 0 },
    { name: 'Mar/26', 'Quase Acidentes': 5, 'Acidentes Graves': 0 },
    { name: 'Abr/26', 'Quase Acidentes': 3, 'Acidentes Graves': 1 },
    { name: 'Mai/26', 'Quase Acidentes': 2, 'Acidentes Graves': 0 },
    { name: 'Jun/26', 'Quase Acidentes': 1, 'Acidentes Graves': 0 }
  ];

  // Local state to feedback user
  const [downloadSuccessName, setDownloadSuccessName] = useState<string | null>(null);

  const handleFeedback = (name: string) => {
    setDownloadSuccessName(name);
    setTimeout(() => {
      setDownloadSuccessName(null);
    }, 3500);
  };

  // --- COMPREHENSIVE BULK EXPORT STATE & HANDLERS ---
  const companySectors = Array.from(new Set(companyEmployees.map(e => e.sector).filter(Boolean))) as string[];

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReports, setSelectedReports] = useState({
    dashboard: true,
    deliveries: true,
    trainings: true,
    accidents: true,
  });
  const [selectedFormats, setSelectedFormats] = useState({
    pdf: true,
    csv: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector) 
        : [...prev, sector]
    );
  };

  const handleSelectAllSectors = () => {
    setSelectedSectors(companySectors);
  };

  const handleClearSectors = () => {
    setSelectedSectors([]);
  };

  const handleBulkExport = async () => {
    const hasAnyReportSelected = Object.values(selectedReports).some(Boolean);
    const hasAnyFormatSelected = Object.values(selectedFormats).some(Boolean);

    if (!hasAnyReportSelected) {
      Swal.fire('Atenção', "Por favor, selecione pelo menos um tipo de relatório na lista.", 'warning');
      return;
    }
    if (!hasAnyFormatSelected) {
      Swal.fire('Atenção', "Por favor, selecione pelo menos um formato de arquivo (PDF ou CSV).", 'warning');
      return;
    }

    setIsExporting(true);
    setExportMessage("Mapeando filtros industriais...");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportMessage("Compilando relatórios e PDF Books...");
      await new Promise(resolve => setTimeout(resolve, 700));
      setExportMessage("Formatando tabelas e arquivos CSV semicolon...");
      await new Promise(resolve => setTimeout(resolve, 600));
      setExportMessage("Comprimindo em lote e encriptando no ZIP...");
      await new Promise(resolve => setTimeout(resolve, 300));

      const blob = await generateBulkZip({
        companies,
        employees,
        ppes,
        deliveries,
        employeeTrainings,
        accidents,
        actionPlans,
        activeCompanyId,
        selectedSectors,
        startDate,
        endDate,
        selectedReports,
        formats: selectedFormats
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SST_Export_Massa_${activeCompanyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      handleFeedback("Lote compactado ZIP em Massa");
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', "Houve um erro inesperado ao processar a compactação local.", 'error');
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Title Header */}
      <div className="bg-white p-4 rounded border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-safety-green" />
            Central de Relatórios &amp; Legal Compliance SST
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Exportação homologada de laudos, históricos de eSocial e fichas regulamentares para fiscalização trabalhista ativa (NR-01, NR-06 &amp; NR-35).
          </p>
        </div>
      </div>

      {downloadSuccessName && (
        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-700 font-bold flex items-center gap-2 animate-fade-in text-[10.5px]">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>O relatório "{downloadSuccessName}" foi exportado e baixado com sucesso no seu dispositivo!</span>
        </div>
      )}

      {/* --- PREMIUM PORTUGUESE BULK EXPORT CONTROL CENTER --- */}
      <div className="bg-slate-900 text-slate-100 rounded-lg border border-slate-800 p-4.5 shadow-md space-y-4">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-50 uppercase tracking-wider flex items-center gap-1.5">
              <FolderDown className="w-4 h-4 text-safety-green" />
              Painel de Arquivamento e Exportação em Lote (Bulk ZIP Pack)
            </h3>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Filtre múltiplos setores ou intervalos de datas para gerar uma consolidação compilada em um pacote único ZIP (PDFs Oficiais e Planilhas CSV).
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[8.5px] font-mono text-slate-300 self-start flex items-center gap-1 font-bold">
            <Archive className="w-3 h-3 text-warning-yellow" />
            <span>ARQUIVO ZIP COMPRIMIDO</span>
          </div>
        </div>

        {/* Inputs and Checkboxes selection grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Sector Selection (Col 1) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded border border-slate-850">
              <span className="font-bold text-[9px] uppercase text-slate-300 font-mono flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                1. Seleção de Setores Ativos
              </span>
              <div className="flex gap-1.5 text-[8.5px]">
                <button 
                  type="button" 
                  onClick={handleSelectAllSectors} 
                  className="text-safety-green hover:underline cursor-pointer font-bold"
                >
                  Selecionar Todos
                </button>
                <span className="text-slate-700">|</span>
                <button 
                  type="button" 
                  onClick={handleClearSectors} 
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-[85px] overflow-y-auto pr-1">
              {companySectors.map(sec => {
                const isSelected = selectedSectors.includes(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSector(sec)}
                    className={`text-[9px] text-left px-2 py-1 rounded-md border transition cursor-pointer select-none flex items-center justify-between text-ellipsis overflow-hidden whitespace-nowrap ${
                      isSelected 
                        ? "bg-slate-800 border-safety-green text-white font-bold" 
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate">{sec}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 text-safety-green shrink-0 ml-1" />}
                  </button>
                );
              })}
              {companySectors.length === 0 && (
                <p className="text-slate-500 italic text-[8.5px] col-span-3 py-1 text-center">Nenhum setor localizado na unidade.</p>
              )}
            </div>
            
            <p className="text-[8.5px] text-slate-505 font-mono">
              {selectedSectors.length === 0 
                ? "💡 Nenhum setor especifico marcado: será exportado todo o contingente operacional da empresa." 
                : `✓ ${selectedSectors.length} de ${companySectors.length} setores ativos selecionados no escopo.`
              }
            </p>
          </div>

          {/* Date Picker Range selection (Col 2) */}
          <div className="space-y-2">
            <span className="font-bold text-[9px] uppercase text-slate-300 font-mono flex items-center gap-1 bg-slate-950/40 p-1.5 rounded border border-slate-850">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              2. Filtro Temporal (Data de Lançamento / Emissão)
            </span>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Data Inicial</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Data Final</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-slate-700 font-mono"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Third Row: Target Reports & Extension Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
          
          {/* Formats checklists */}
          <div className="space-y-2">
            <span className="font-bold text-[9px] uppercase text-slate-300 font-mono flex items-center gap-1 bg-slate-950/40 p-1.5 rounded border border-slate-850">
              <Columns className="w-3.5 h-3.5 text-slate-400" />
              3. Extensão &amp; Tipagem de Saída (Output)
            </span>
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedFormats(prev => ({ ...prev, pdf: !prev.pdf }))}
                className={`flex-1 py-1.5 border rounded-md transition text-center font-bold text-[9.5px] cursor-pointer ${
                  selectedFormats.pdf 
                    ? "bg-slate-800 border-sky-500 text-sky-300" 
                    : "bg-slate-950/20 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                Gerar PDFs Oficiais
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormats(prev => ({ ...prev, csv: !prev.csv }))}
                className={`flex-1 py-1.5 border rounded-md transition text-center font-bold text-[9.5px] cursor-pointer ${
                  selectedFormats.csv
                    ? "bg-slate-800 border-emerald-500 text-emerald-300"
                    : "bg-slate-950/20 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                Gerar CSVs (Planilhas Excel)
              </button>
            </div>
          </div>

          {/* Specific Reports Checklists */}
          <div className="space-y-2">
            <span className="font-bold text-[9px] uppercase text-slate-300 font-mono flex items-center gap-1 bg-slate-950/40 p-1.5 rounded border border-slate-850">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              4. Seleção dos Cadernos de Auditoria
            </span>
            <div className="grid grid-cols-2 gap-1 pt-0.5">
              {[
                { id: 'dashboard', label: '1. Dossiê Estatísticas SST' },
                { id: 'deliveries', label: '2. Histórico NR-06' },
                { id: 'trainings', label: '3. Certificações LMS' },
                { id: 'accidents', label: '4. Sinistros & PDCA' },
              ].map(rep => {
                const checked = selectedReports[rep.id as keyof typeof selectedReports];
                return (
                  <button
                    type="button"
                    key={rep.id}
                    onClick={() => setSelectedReports(prev => ({ ...prev, [rep.id]: !prev[rep.id as keyof typeof selectedReports] }))}
                    className={`text-left p-1 rounded border transition flex items-center gap-1.5 select-none cursor-pointer ${
                      checked 
                        ? "bg-slate-850 border-slate-700 text-slate-100" 
                        : "bg-slate-950/20 border-slate-850 text-slate-550 hover:text-slate-350"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded flex items-center justify-center border font-bold text-[8px] shrink-0 ${checked ? "bg-safety-green border-safety-green text-slate-900" : "border-slate-700 bg-slate-950"}`}>
                      {checked && "✓"}
                    </span>
                    <span className="text-[9px] font-semibold truncate">{rep.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Real-time Dynamic Math estimators and submission actions */}
        <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px]">
          <div className="text-slate-400 space-y-0.5 w-full sm:w-auto text-left leading-relaxed">
            <p className="font-bold text-slate-200">🔍 Estimativa em tempo real de registros que serão compilados:</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[8.2px] text-slate-400">
              <span className="bg-slate-900 px-1 border border-slate-800 rounded">
                Colaboradores ativos: <strong className="text-slate-200">{
                  selectedSectors.length === 0 
                    ? companyEmployees.length 
                    : companyEmployees.filter(e => selectedSectors.includes(e.sector)).length
                }</strong>
              </span>
              <span className="bg-slate-900 px-1 border border-slate-800 rounded">
                Fichas EPI: <strong className="text-slate-200">{
                  companyDeliveries.filter(d => {
                    const emp = companyEmployees.find(e => e.id === d.employeeId);
                    const isInSet = selectedSectors.length === 0 || (emp && selectedSectors.includes(emp.sector));
                    const isWithinDate = (!startDate || d.deliveryDate >= startDate) && (!endDate || d.deliveryDate <= endDate);
                    return isInSet && isWithinDate;
                  }).length
                }</strong>
              </span>
              <span className="bg-slate-900 px-1 border border-slate-800 rounded">
                Cursos NRs: <strong className="text-slate-200">{
                  companyTrainings.filter(t => {
                    const emp = companyEmployees.find(e => e.id === t.employeeId);
                    const isInSet = selectedSectors.length === 0 || (emp && selectedSectors.includes(emp.sector));
                    const isWithinDate = (!startDate || t.issueDate >= startDate) && (!endDate || t.issueDate <= endDate);
                    return isInSet && isWithinDate;
                  }).length
                }</strong>
              </span>
              <span className="bg-slate-900 px-1 border border-slate-800 rounded">
                CAT / Desvios: <strong className="text-slate-200">{
                  companyAccidents.filter(a => {
                    const isInSet = selectedSectors.length === 0 || selectedSectors.includes(a.sector);
                    const isWithinDate = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
                    return isInSet && isWithinDate;
                  }).length
                }</strong>
              </span>
            </div>
          </div>
          
          <div className="w-full sm:w-auto shrink-0">
            {isExporting ? (
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-md flex items-center gap-2 font-mono text-[9.5px]">
                <div className="w-3.5 h-3.5 border-2 border-safety-green border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-300 font-bold">{exportMessage}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBulkExport}
                className="w-full sm:w-auto bg-safety-green hover:bg-safety-green-dark text-slate-900 font-black px-4 py-2 rounded font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-md"
              >
                <FolderDown className="w-4 h-4 text-slate-900" />
                Exportar Lote ZIP em Massa
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Grid of Auditable Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Module 1: Dashboard e Indicadores de Conformidade */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">1. Indicadores de Desempenho (I-SST)</h3>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded">
                Dossiê Corporativo
              </span>
            </div>
            
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Consolidação de taxas de adesão, métricas de conformidade regulamentar, análise temporal de investigações de CATs e quase acidentes (desvios). Ideal para apresentações à diretoria empresarial.
            </p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9px] text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Total de Colaboradores Avaliados:</span>
                <strong className="text-slate-800 font-mono">{companyEmployees.length} ativos</strong>
              </div>
              <div className="flex justify-between">
                <span>EPIs Analisados na Unidade:</span>
                <strong className="text-slate-800 font-mono">{ppes.length} códigos</strong>
              </div>
              <div className="flex justify-between">
                <span>Histórico de Entregas Mensais:</span>
                <strong className="text-slate-800 font-mono">6 períodos apurados</strong>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                exportDashboardToPDF(
                  employees,
                  ppes,
                  deliveries,
                  companyTrainings,
                  deliveryHistoryData,
                  accidentHistoryData,
                  activeCompanyName
                );
                handleFeedback("Dossiê Executivo SST (PDF)");
              }}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF Dossiê
            </button>
            
            <button
              onClick={() => {
                exportDashboardToExcel(
                  employees,
                  ppes,
                  deliveries,
                  companyTrainings,
                  deliveryHistoryData,
                  accidentHistoryData,
                  activeCompanyName
                );
                handleFeedback("Dossiê Executivo SST (Excel)");
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel Planilha
            </button>
          </div>
        </div>

        {/* Module 2: Histórico de Entregas de EPI (NR-06) */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">2. Entregas de EPI &amp; Fichas (NR-06)</h3>
              </div>
              <span className="font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">
                eSocial S-2240
              </span>
            </div>
            
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Relatório contendo todos os recebimentos de EPIs de colaboradores da unidade ativa. Inclui detalhamento das assinaturas regulamentares recolhidas, números de CA e motivos dos fornecimentos.
            </p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9px] text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Registros de Entrega na Unidade:</span>
                <strong className="text-slate-800 font-mono">{companyDeliveries.length} fichas emitidas</strong>
              </div>
              <div className="flex justify-between">
                <span>Assinaturas Digitais em Tela:</span>
                <strong className="text-slate-800 font-mono">
                  {companyDeliveries.filter(d => d.signingMethod === 'assinatura_digital').length} recolhidas
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Assinaturas via PIN Eletrônico:</span>
                <strong className="text-slate-800 font-mono">
                  {companyDeliveries.filter(d => d.signingMethod === 'senha').length} confirmadas
                </strong>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (companyDeliveries.length === 0) {
                  Swal.fire('Atenção', "Nenhum lançamento de entrega registrado nesta unidade para exportar.", 'info');
                  return;
                }
                exportDeliveriesToPDF(companyDeliveries, employees, activeCompanyName);
                handleFeedback("Laudo de Entrega de EPI (PDF)");
              }}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF Laudo
            </button>
            
            <button
              onClick={() => {
                if (companyDeliveries.length === 0) {
                  Swal.fire('Atenção', "Nenhum lançamento de entrega registrado nesta unidade para exportar.", 'info');
                  return;
                }
                exportDeliveriesToExcel(companyDeliveries, employees, activeCompanyName);
                handleFeedback("Histórico de Entregas de EPI (Excel)");
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel Planilha
            </button>
          </div>
        </div>

        {/* Module 3: Treinamentos e Certificados LMS (NR-10, NR-35) */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">3. Certificações de Treinamento (NRs)</h3>
              </div>
              <span className="font-mono text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                eSocial S-2245
              </span>
            </div>
            
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Histórico de capacitação e reciclagem periódica de segurança exigidos por lei para atividades críticas (Trabalho em Altura, Instalações Elétricas, Máquinas e Equipamentos).
            </p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9px] text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Total de Treinamentos Mapeados:</span>
                <strong className="text-slate-800 font-mono">{companyTrainings.length} cursos</strong>
              </div>
              <div className="flex justify-between">
                <span>Status Aprovado:</span>
                <strong className="text-emerald-700 font-semibold font-mono">
                  {companyTrainings.filter(t => t.status === 'Aprovado').length} em dia
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Vencidos / Recorrentes:</span>
                <strong className="text-red-500 font-bold font-mono">
                  {companyTrainings.filter(t => t.status === 'Vencido').length} alertas
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (companyTrainings.length === 0) {
                Swal.fire('Atenção', "Nenhum treinamento correspondente localizado para exportação.", 'info');
                return;
              }
              const formatted = companyTrainings.map(t => {
                const emp = employees.find(e => e.id === t.employeeId);
                return {
                  "Matrícula": emp?.matricula || "N/A",
                  "Nome do Colaborador": t.employeeName,
                  "Cargo": emp?.role || "N/A",
                  "Treinamento Legal": t.trainingTitle,
                  "Norma Regulamentadora": t.nr,
                  "Data de Realização": t.issueDate,
                  "Validade Expirante": t.expiryDate,
                  "Nota do Exame (%)": t.score,
                  "Situação no LMS": t.status
                };
              });
              const ws = XLSX.utils.json_to_sheet(formatted);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Treinamentos_Trabalhadores");
              XLSX.writeFile(wb, `Central_SST_Treinamentos_${activeCompanyName.replace(/\s+/g, '_')}.xlsx`);
              handleFeedback("Relatório de Treinamentos NRs (Excel)");
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer text-center"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Planilha de Cursos Ativos &amp; Expirações
          </button>
        </div>

        {/* Module 4: Análise de Acidentes & CATs (PGR/NR-01) */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">4. Registro de Sinistros e Planos de Ação</h3>
              </div>
              <span className="font-mono text-[9px] font-bold text-red-600 bg-red-50 border border-red-150 px-1.5 py-0.5 rounded">
                eSocial S-2210
              </span>
            </div>
            
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Auditoria de incidentes registrados, planos de ação estabelecidos, análises metodológicas (Causa Raiz / 5 Porquês / Diagrama de Ishikawa) e severidade.
            </p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9px] text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Acidentes / Desvios Totais:</span>
                <strong className="text-slate-800 font-mono">{companyAccidents.length} casos</strong>
              </div>
              <div className="flex justify-between">
                <span>Planos de Ação Pendentes:</span>
                <strong className="text-amber-500 font-bold font-mono">
                  {actionPlans.filter(p => p.status !== 'Concluído').length} pendências
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Conformidade de Execução:</span>
                <strong className="text-slate-800 font-mono">
                  {actionPlans.length > 0 
                    ? Math.round((actionPlans.filter(p => p.status === 'Concluído').length / actionPlans.length) * 100) 
                    : 100}% resolvido
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (companyAccidents.length === 0) {
                Swal.fire('Atenção', "Nenhuma ocorrência registrada no sistema local para exportar.", 'info');
                return;
              }
              const formatted = companyAccidents.map(a => ({
                "ID Caso": a.id,
                "Data": a.date,
                "Tipo de Ocorrência": a.type,
                "Relatado por": a.reporterName,
                "Setor Afetado": a.sector,
                "Descrição dos Fatos": a.description,
                "Nível de Gravidade": a.severity,
                "Status da Investigação": a.status
              }));
              const ws = XLSX.utils.json_to_sheet(formatted);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Ocorrencias_SST");
              XLSX.writeFile(wb, `Central_SST_Sinistros_${activeCompanyName.replace(/\s+/g, '_')}.xlsx`);
              handleFeedback("Planilha de Ocorrências e CATs (Excel)");
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-2 rounded text-[10px] flex items-center justify-center gap-1.5 font-bold transition uppercase cursor-pointer text-center"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Planilha de CATs &amp; Investigação de Desvios
          </button>
        </div>

      </div>

      {/* Corporate Compliance Rating Stamp footer */}
      <div className="bg-slate-100 p-3.5 rounded border border-slate-200 text-[10px] text-slate-500 flex items-start gap-2 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-700">Responsabilidade Jurídica sobre Arquivamento Digital (Portaria SIT/MTE n.º 107)</p>
          <p className="mt-0.5">
            A Novo Horizonte Alumínios armazena e certifica todos os logs de fornecimento e treinamentos com hash único integrados às requisições do almoxarifado. Em casos de inquéritos, a validade jurídica das assinaturas digitais recolhidas na Central protege a empresa de litígios operacionais comuns.
          </p>
        </div>
      </div>
    </div>
  );
}
