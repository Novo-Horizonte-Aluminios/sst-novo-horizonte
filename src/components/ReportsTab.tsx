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
  Cpu,
  Archive,
  FolderDown,
  Check,
  Filter,
  CheckSquare,
  Columns,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  BarChart3,
  Users,
  Shield,
  ExternalLink
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
import Swal from '../utils/swal';
import PageHeader from './ui/PageHeader';
import Badge from './ui/Badge';

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

  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId);
  const employeeIds = companyEmployees.map(e => e.id);

  const companyDeliveries = deliveries.filter(d => employeeIds.includes(d.employeeId));
  const companyTrainings = employeeTrainings.filter(t => employeeIds.includes(t.employeeId));
  const companyAccidents = accidents;

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

  const [downloadSuccessName, setDownloadSuccessName] = useState<string | null>(null);

  const handleFeedback = (name: string) => {
    setDownloadSuccessName(name);
    setTimeout(() => setDownloadSuccessName(null), 3500);
  };

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
  const [bulkOpen, setBulkOpen] = useState(false);

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleSelectAllSectors = () => setSelectedSectors(companySectors);
  const handleClearSectors = () => setSelectedSectors([]);

  const handleBulkExport = async () => {
    const hasAnyReportSelected = Object.values(selectedReports).some(Boolean);
    const hasAnyFormatSelected = Object.values(selectedFormats).some(Boolean);

    if (!hasAnyReportSelected) {
      Swal.fire('Atenção', "Por favor, selecione pelo menos um tipo de relatório.", 'warning');
      return;
    }
    if (!hasAnyFormatSelected) {
      Swal.fire('Atenção', "Por favor, selecione pelo menos um formato de arquivo (PDF ou CSV).", 'warning');
      return;
    }

    setIsExporting(true);
    setExportMessage("Preparando dados...");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportMessage("Compilando relatórios...");
      await new Promise(resolve => setTimeout(resolve, 700));
      setExportMessage("Gerando arquivos...");
      await new Promise(resolve => setTimeout(resolve, 600));
      setExportMessage("Compactando pacote ZIP...");
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

      handleFeedback("Lote compactado ZIP");
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', "Houve um erro ao processar a compactação.", 'error');
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  const reportModules = [
    {
      id: 'dashboard',
      title: 'Indicadores de Desempenho (I-SST)',
      icon: BarChart3,
      badge: 'Dossiê Corporativo',
      badgeVariant: 'info' as const,
      description: 'Consolidação de taxas de adesão, métricas de conformidade regulamentar, análise temporal de CATs e quase acidentes.',
      stats: [
        { label: 'Colaboradores Avaliados', value: `${companyEmployees.length} ativos` },
        { label: 'EPIs na Unidade', value: `${ppes.length} códigos` },
        { label: 'Histórico Mensal', value: '6 períodos apurados' },
      ],
      actions: [
        {
          label: 'PDF Dossiê',
          icon: Printer,
          variant: 'primary',
          onClick: () => {
            exportDashboardToPDF(employees, ppes, deliveries, companyTrainings, deliveryHistoryData, accidentHistoryData, activeCompanyName);
            handleFeedback("Dossiê Executivo SST (PDF)");
          }
        },
        {
          label: 'Excel Planilha',
          icon: FileSpreadsheet,
          variant: 'success',
          onClick: () => {
            exportDashboardToExcel(employees, ppes, deliveries, companyTrainings, deliveryHistoryData, accidentHistoryData, activeCompanyName);
            handleFeedback("Dossiê Executivo SST (Excel)");
          }
        }
      ]
    },
    {
      id: 'deliveries',
      title: 'Entregas de EPI & Fichas (NR-06)',
      icon: FileCheck,
      badge: 'eSocial S-2240',
      badgeVariant: 'info' as const,
      description: 'Todos os recebimentos de EPIs dos colaboradores. Inclui assinaturas digitais, números de CA e motivos dos fornecimentos.',
      stats: [
        { label: 'Registros na Unidade', value: `${companyDeliveries.length} fichas` },
        { label: 'Assinaturas Digitais', value: `${companyDeliveries.filter(d => d.signingMethod === 'assinatura_digital').length} recolhidas` },
        { label: 'Assinaturas via PIN', value: `${companyDeliveries.filter(d => d.signingMethod === 'senha').length} confirmadas` },
      ],
      actions: [
        {
          label: 'PDF Laudo',
          icon: Printer,
          variant: 'primary',
          onClick: () => {
            if (companyDeliveries.length === 0) {
              Swal.fire('Atenção', "Nenhum registro de entrega nesta unidade.", 'info');
              return;
            }
            exportDeliveriesToPDF(companyDeliveries, employees, activeCompanyName);
            handleFeedback("Laudo de Entrega de EPI (PDF)");
          }
        },
        {
          label: 'Excel Planilha',
          icon: FileSpreadsheet,
          variant: 'success',
          onClick: () => {
            if (companyDeliveries.length === 0) {
              Swal.fire('Atenção', "Nenhum registro de entrega nesta unidade.", 'info');
              return;
            }
            exportDeliveriesToExcel(companyDeliveries, employees, activeCompanyName);
            handleFeedback("Histórico de Entregas de EPI (Excel)");
          }
        }
      ]
    },
    {
      id: 'trainings',
      title: 'Certificações de Treinamento (NRs)',
      icon: GraduationCap,
      badge: 'eSocial S-2245',
      badgeVariant: 'warning' as const,
      description: 'Histórico de capacitação e reciclagem periódica para atividades críticas (altura, elétrica, máquinas).',
      stats: [
        { label: 'Treinamentos Mapeados', value: `${companyTrainings.length} cursos` },
        { label: 'Status Aprovado', value: `${companyTrainings.filter(t => t.status === 'Aprovado').length} em dia`, highlight: true },
        { label: 'Vencidos', value: `${companyTrainings.filter(t => t.status === 'Vencido').length} alertas`, danger: true },
      ],
      actions: [
        {
          label: 'Planilha de Cursos',
          icon: FileSpreadsheet,
          variant: 'primary',
          onClick: () => {
            if (companyTrainings.length === 0) {
              Swal.fire('Atenção', "Nenhum treinamento localizado.", 'info');
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
          }
        }
      ]
    },
    {
      id: 'accidents',
      title: 'Registro de Sinistros & Planos de Ação',
      icon: ShieldAlert,
      badge: 'eSocial S-2210',
      badgeVariant: 'danger' as const,
      description: 'Auditoria de incidentes, planos de ação, análises de causa raiz e severidade.',
      stats: [
        { label: 'Acidentes/Desvios', value: `${companyAccidents.length} casos` },
        { label: 'Planos Pendentes', value: `${actionPlans.filter(p => p.status !== 'Concluído').length} pendências`, danger: true },
        { label: 'Conformidade', value: `${actionPlans.length > 0 ? Math.round((actionPlans.filter(p => p.status === 'Concluído').length / actionPlans.length) * 100) : 100}% resolvido` },
      ],
      actions: [
        {
          label: 'Planilha de CATs',
          icon: FileSpreadsheet,
          variant: 'primary',
          onClick: () => {
            if (companyAccidents.length === 0) {
              Swal.fire('Atenção', "Nenhuma ocorrência registrada.", 'info');
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
          }
        }
      ]
    }
  ];

  return (
    <div className="space-y-5 text-xs">
      <PageHeader
        title="Central de Relatórios & Legal Compliance SST"
        subtitle="Exportação homologada de laudos, históricos de eSocial e fichas regulamentares para fiscalização trabalhista ativa (NR-01, NR-06 & NR-35)."
      >
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 bg-brand-primary/5 border border-brand-primary/10 rounded-lg px-2.5 py-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-primary" />
            <span className="font-semibold text-brand-primary">{activeCompanyName}</span>
          </div>
        </div>
      </PageHeader>

      {downloadSuccessName && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-700 font-bold flex items-center gap-2.5 animate-fade-in text-[11px] shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Relatório "{downloadSuccessName}" exportado e baixado com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="h-1 bg-brand-primary shrink-0" />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 leading-tight">{mod.title}</h3>
                      <Badge variant={mod.badgeVariant}>{mod.badge}</Badge>
                    </div>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500 leading-relaxed mb-4">{mod.description}</p>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 mb-4 flex-1">
                  {mod.stats.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">{stat.label}:</span>
                      <strong className={`font-mono text-[10px] ${
                        stat.danger ? 'text-rose-600' :
                        stat.highlight ? 'text-emerald-600' :
                        'text-slate-800'
                      }`}>{stat.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-auto">
                  {mod.actions.map((act, i) => {
                    const ActIcon = act.icon;
                    const isPrimary = act.variant === 'primary';
                    return (
                      <button
                        key={i}
                        onClick={act.onClick}
                        className={`flex-1 p-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer uppercase ${
                          isPrimary
                            ? 'bg-brand-primary hover:bg-brand-primary-dark text-white shadow-sm'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <ActIcon className="w-3.5 h-3.5" />
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setBulkOpen(!bulkOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Archive className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-slate-800">Exportação em Lote (ZIP)</h3>
              <p className="text-[10px] text-slate-500">Filtre setores, datas e tipos de relatório para gerar um pacote único</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-brand-primary bg-brand-primary/5 border border-brand-primary/10 px-2 py-1 rounded-lg">
              ZIP
            </span>
            {bulkOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {bulkOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3 h-3" />
                  Setores
                </span>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 text-[9px]">
                    <button onClick={handleSelectAllSectors} className="text-brand-primary hover:underline font-bold cursor-pointer">Todos</button>
                    <button onClick={handleClearSectors} className="text-slate-400 hover:underline cursor-pointer">Limpar</button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedSectors.length === 0
                      ? 'Todos os setores'
                      : `${selectedSectors.length} de ${companySectors.length} selecionados`
                    }
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-20 overflow-y-auto">
                  {companySectors.map(sec => {
                    const isSelected = selectedSectors.includes(sec);
                    return (
                      <button
                        key={sec}
                        onClick={() => toggleSector(sec)}
                        className={`text-[9px] text-left px-2 py-1 rounded-lg border transition cursor-pointer select-none truncate ${
                          isSelected
                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {sec}
                        {isSelected && <Check className="w-2 h-2 text-brand-primary inline ml-1" />}
                      </button>
                    );
                  })}
                  {companySectors.length === 0 && (
                    <p className="text-slate-400 italic text-[8.5px] col-span-3 py-1">Nenhum setor localizado.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3 h-3" />
                  Filtro Temporal
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] uppercase text-slate-400 font-bold mb-0.5">Data Inicial</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 text-[10px] focus:outline-none focus:border-brand-primary/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase text-slate-400 font-bold mb-0.5">Data Final</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 text-[10px] focus:outline-none focus:border-brand-primary/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Columns className="w-3 h-3" />
                  Formatos de Saída
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFormats(prev => ({ ...prev, pdf: !prev.pdf }))}
                    className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition cursor-pointer text-center ${
                      selectedFormats.pdf
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    PDF Oficial
                  </button>
                  <button
                    onClick={() => setSelectedFormats(prev => ({ ...prev, csv: !prev.csv }))}
                    className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition cursor-pointer text-center ${
                      selectedFormats.csv
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    CSV (Excel)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Relatórios
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { id: 'dashboard', label: 'Dossiê Estatísticas SST' },
                    { id: 'deliveries', label: 'Histórico NR-06' },
                    { id: 'trainings', label: 'Certificações LMS' },
                    { id: 'accidents', label: 'Sinistros & PDCA' },
                  ].map(rep => {
                    const checked = selectedReports[rep.id as keyof typeof selectedReports];
                    return (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedReports(prev => ({ ...prev, [rep.id]: !prev[rep.id as keyof typeof selectedReports] }))}
                        className={`text-left px-2.5 py-1.5 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                          checked
                            ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[7px] font-bold shrink-0 ${
                          checked ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {checked && "✓"}
                        </span>
                        <span className="text-[10px]">{rep.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
                <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-mono">
                  Colaboradores: <strong className="text-slate-800">{
                    selectedSectors.length === 0
                      ? companyEmployees.length
                      : companyEmployees.filter(e => selectedSectors.includes(e.sector)).length
                  }</strong>
                </span>
                <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-mono">
                  Fichas EPI: <strong className="text-slate-800">{
                    companyDeliveries.filter(d => {
                      const emp = companyEmployees.find(e => e.id === d.employeeId);
                      const isInSet = selectedSectors.length === 0 || (emp && selectedSectors.includes(emp.sector));
                      const isWithinDate = (!startDate || d.deliveryDate >= startDate) && (!endDate || d.deliveryDate <= endDate);
                      return isInSet && isWithinDate;
                    }).length
                  }</strong>
                </span>
                <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-mono">
                  Cursos: <strong className="text-slate-800">{
                    companyTrainings.filter(t => {
                      const emp = companyEmployees.find(e => e.id === t.employeeId);
                      const isInSet = selectedSectors.length === 0 || (emp && selectedSectors.includes(emp.sector));
                      const isWithinDate = (!startDate || t.issueDate >= startDate) && (!endDate || t.issueDate <= endDate);
                      return isInSet && isWithinDate;
                    }).length
                  }</strong>
                </span>
              </div>

              {isExporting ? (
                <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
                  <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  {exportMessage}
                </div>
              ) : (
                <button
                  onClick={handleBulkExport}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold px-5 py-2.5 rounded-xl text-[10px] flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.98] uppercase"
                >
                  <Download className="w-4 h-4" />
                  Exportar Lote ZIP
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-[10px] text-slate-600 flex items-start gap-3 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-700 mb-0.5">Responsabilidade Jurídica sobre Arquivamento Digital (Portaria SIT/MTE n.º 107)</p>
          <p className="text-slate-500">
            A Novo Horizonte Alumínios armazena e certifica todos os logs de fornecimento e treinamentos com hash único. Em casos de inquéritos, a validade jurídica das assinaturas digitais recolhidas protege a empresa de litígios operacionais comuns.
          </p>
        </div>
      </div>
    </div>
  );
}
