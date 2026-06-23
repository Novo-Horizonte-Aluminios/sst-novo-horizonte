import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Users, 
  CheckCircle2, 
  FileSpreadsheet,
  Edit2,
  Trash2,
  Phone,
  Mail,
  AlertTriangle,
  X,
  UserCheck,
  Download,
  UploadCloud,
  AlertCircle,
  Loader2,
  Info,
  Hand
} from 'lucide-react';
import { Company, Employee } from '../types';
import { maskCPF, maskCNPJ, maskPhone, maskRG } from '../utils/masks';
import EmployeeWizard from './EmployeeWizard';

export const getFingerLabel = (code?: string) => {
  if (!code) return 'Nenhum dedo selecionado';
  const parts = code.split('-');
  const hand = parts[0] === 'E' ? 'Mão Esquerda' : 'Mão Direita';
  const finger = parts[1] || '';
  return `${finger} (${hand})`;
};

export const getRegisteredFingers = (emp: Partial<Employee> | null): string[] => {
  if (!emp || !emp.biometricTemplate) return [];
  try {
    const parsed = JSON.parse(emp.biometricTemplate);
    if (Array.isArray(parsed)) {
      return parsed.map((p: any) => p.finger);
    }
  } catch(e) {
    if (emp.biometricFinger) return [emp.biometricFinger];
    return ['Digital Cadastrada'];
  }
  return ['Digital Cadastrada'];
};

interface CompanyWorkerTabProps {
  companies: Company[];
  employees: Employee[];
  activeCompanyId: string;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => Promise<any>;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => Promise<any>;
  onDeleteEmployee: (id: string) => Promise<any>;
  onUpdateCompany?: (id: string, updated: Partial<Company>) => Promise<any>;
}

export default function CompanyWorkerTab({
  companies,
  employees,
  activeCompanyId,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onUpdateCompany
}: CompanyWorkerTabProps) {
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmpModal, setShowEmpModal] = useState(false);
  
  // Edit Employee State
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  
  // Edit Company State
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);

  // Delete Employee Confirmation State
  const [deletingEmp, setDeletingEmp] = useState<Employee | null>(null);

  // (Removido handSelector interno pois agora vive no EmployeeWizard)

  // Real Bulk CSV Import States
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeHeader = (h: string) => {
    return h.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .trim();
  };

  const normalizeDate = (dStr: string): string => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const cleaned = dStr.trim();
    const matchDmy = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (matchDmy) {
      const day = matchDmy[1].padStart(2, '0');
      const month = matchDmy[2].padStart(2, '0');
      const year = matchDmy[3];
      return `${year}-${month}-${day}`;
    }
    // Handle ISO strings or YYYY-MM-DD HH:mm:ss
    if (cleaned.length >= 10 && cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
      return cleaned.substring(0, 10);
    }
    return cleaned;
  };

  const handleDownloadTemplate = () => {
    const headers = ['Nome', 'CPF', 'RG', 'Data Nascimento (AAAA-MM-DD)', 'Matricula', 'Setor', 'Cargo', 'Gestor Direto', 'Data Admissao (AAAA-MM-DD)', 'WhatsApp', 'Email'];
    const sampleRow = ['Fabricio Antunes Souza', '987.654.321-00', '98.765.432-1', '1995-08-14', 'NHA-4592', 'Logistica', 'Op. Empilhadeira', 'Luiz Gonzaga', '2024-05-12', '5551999998888', 'fabricio.souza@novohorizonte.com.br'];
    
    const csvContent = "\uFEFF" + [headers.join(';'), sampleRow.join(';')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_colaboradores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVFile = (file: File) => {
    setParseError(null);
    setParsedRows([]);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Por favor, selecione apenas arquivos com a extensão .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setParseError('Arquivo vazio ou ilegível.');
          return;
        }

        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) {
          setParseError('O arquivo de importação deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
          return;
        }

        // Detect delimiter ( Brazilian CSVs generated by Excel usually use semicolon ';' )
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semiCount = (headerLine.match(/;/g) || []).length;
        const delimiter = semiCount > commaCount ? ';' : ',';

        const parseLine = (lineStr: string) => {
          const result: string[] = [];
          let currentStr = '';
          let inQuotes = false;
          for (let i = 0; i < lineStr.length; i++) {
            const char = lineStr[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(currentStr.trim().replace(/^["']|["']$/g, ''));
              currentStr = '';
            } else {
              currentStr += char;
            }
          }
          result.push(currentStr.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const headers = parseLine(headerLine);
        const listTemp: any[] = [];

        for (let idx = 1; idx < lines.length; idx++) {
          const cols = parseLine(lines[idx]);
          if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;

          // Map values
          const item: any = {
            companyId: activeCompanyId,
            status: 'Ativo'
          };

          headers.forEach((hdr, colIdx) => {
            const normalized = normalizeHeader(hdr);
            const rawVal = cols[colIdx] || '';

            if (normalized === 'nome') {
              item.name = rawVal;
            } else if (normalized === 'cpf') {
              item.cpf = rawVal;
            } else if (normalized === 'rg') {
              item.rg = rawVal;
            } else if (normalized.includes('nascimento')) {
              item.birthDate = normalizeDate(rawVal);
            } else if (normalized.includes('matricula') || normalized === 'registro' || normalized === 'cod' || normalized === 'codigo') {
              item.matricula = rawVal;
            } else if (normalized === 'setor') {
              item.sector = rawVal || 'Usinagem';
            } else if (normalized === 'cargo' || normalized === 'funcao') {
              item.role = rawVal || 'Operador de Máquinas';
            } else if (normalized.includes('gestor') || normalized.includes('supervisor')) {
              item.manager = rawVal || 'Luiz Gonzaga';
            } else if (normalized.includes('admissao')) {
              item.admissionDate = normalizeDate(rawVal);
            } else if (normalized === 'whatsapp' || normalized === 'telefone' || normalized === 'celular' || normalized === 'phone') {
              item.phone = rawVal;
            } else if (normalized === 'email' || normalized === 'e-mail') {
              item.email = rawVal;
            }
          });

          // Fill defaults if absent
          if (!item.name) item.name = '';
          if (!item.cpf) item.cpf = '';
          if (!item.matricula) item.matricula = `NHA-LOTE-${Math.floor(1000 + Math.random() * 9000)}`;
          if (!item.birthDate) item.birthDate = '1990-01-01';
          if (!item.admissionDate) item.admissionDate = new Date().toISOString().split('T')[0];
          if (!item.sector) item.sector = 'Usinagem';
          if (!item.role) item.role = 'Operador I';
          if (!item.manager) item.manager = 'Luiz Gonzaga';

          // Validate
          const rowErrors = [];
          if (!item.name.trim()) rowErrors.push('Nome Completo é obrigatório');
          if (!item.cpf.trim()) rowErrors.push('CPF é obrigatório');

          listTemp.push({
            data: item,
            isValid: rowErrors.length === 0,
            errors: rowErrors
          });
        }

        setParsedRows(listTemp);
      } catch (err: any) {
        setParseError(`Erro ao ler o arquivo: ${err.message || err}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVFile(e.target.files[0]);
    }
  };

  const handleBulkImportSubmit = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: validRows.length });

    for (let i = 0; i < validRows.length; i++) {
      try {
        await onAddEmployee(validRows[i].data);
      } catch (e) {
        console.error('Falha ao adicionar ', validRows[i].data.name, e);
      }
      setImportProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setImporting(false);
    setParsedRows([]);
    setShowBulkImport(false);
    setImportStatus(`Importação concluída com sucesso! ${validRows.length} novos colaboradores integrados ao eSocial.`);
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Mock template importing
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCreateEmployee = async (empData: Partial<Employee>) => {
    if (!empData.name || !empData.cpf) return;
    await onAddEmployee({
      ...(empData as Omit<Employee, 'id'>),
      status: 'Ativo'
    });
    setShowEmpModal(false);
  };

  const handleUpdateEmployeeSubmit = async (empData: Partial<Employee>) => {
    if (!editingEmp || !empData.name || !empData.cpf) return;
    await onUpdateEmployee(editingEmp.id, empData);
    setEditingEmp(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmp) return;
    await onDeleteEmployee(deletingEmp.id);
    setDeletingEmp(null);
  };

  const handleSimulateCSVImport = async () => {
    setImportStatus('Lendo arquivo de planilha de pessoal...');
    setTimeout(async () => {
      // Add multiple mock workers instantly under Novo Horizonte
      const batch = [
        { name: 'Ricardo Dias Santos', cpf: '456.789.012-33', rg: '45.678.901-2', birthDate: '1985-07-22', matricula: 'NHA-2254', companyId: activeCompanyId, sector: 'Usinagem', role: 'Fresador Mecânico', manager: 'Luiz Gonzaga', admissionDate: '2026-03-10', status: 'Ativo' as const, phone: '5551988112233', email: 'ricardo.santos@novo-horizonte.com.br' },
        { name: 'Beatriz Vasconcelos', cpf: '567.890.123-44', rg: '56.789.012-3', birthDate: '1990-12-01', matricula: 'NHA-2260', companyId: activeCompanyId, sector: 'Soldagem', role: 'Esmerilhadora Sênior', manager: 'Luiz Gonzaga', admissionDate: '2026-04-18', status: 'Ativo' as const, phone: '5551988223344', email: 'beatriz.v@novo-horizonte.com.br' }
      ];
      for (const worker of batch) {
        await onAddEmployee(worker);
      }
      setImportStatus('Importação Concluída! 2 novos colaboradores carregados.');
      setTimeout(() => setImportStatus(null), 3500);
    }, 1500);
  };

  const filteredEmployees = employees.filter(e => {
    const isCompany = e.companyId === activeCompanyId;
    const matchesSearch = e.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          e.cpf.includes(employeeSearch) || 
                          e.matricula.toLowerCase().includes(employeeSearch.toLowerCase());
    return isCompany && matchesSearch;
  });

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  const handleUpdateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !onUpdateCompany) return;
    setIsUpdatingCompany(true);
    try {
      await onUpdateCompany(editingCompany.id, editingCompany);
      setShowCompanyModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <h2 className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            Controle de Colaboradores — {activeCompany?.tradingName || 'Novo Horizonte Alumínios'}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Diretório oficial de colaboradores da empresa. Alinhado com as diretrizes da NR-01 (GRO) e NR-06 (EPI).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[10px] font-bold">
            CNPJ: {activeCompany?.cnpj || '34.892.455/0001-38'}
          </div>
          {onUpdateCompany && (
            <button
              onClick={() => {
                setEditingCompany({ ...activeCompany });
                setShowCompanyModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer flex items-center gap-1.5"
              title="Editar dados cadastrais da empresa"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              Editar Empresa
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nome, CPF ou Matrícula..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-[12px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all hover:border-slate-300 dark:border-slate-600 shadow-sm font-bold text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* CTA action buttons */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setShowBulkImport(!showBulkImport);
                setParsedRows([]);
                setParseError(null);
              }}
              className={`flex items-center gap-2 text-[11px] font-bold px-4 py-2.5 border-2 rounded-xl transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                showBulkImport 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-slate-400'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${showBulkImport ? 'text-amber-400' : 'text-emerald-600'}`} />
              <span>Importar Lote (CSV)</span>
            </button>

            <button
              onClick={handleSimulateCSVImport}
              disabled={importStatus !== null}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-200 rounded-xl transition-all hover:border-slate-400 cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5"
              title="Simular uma importação rápida com dados de demonstração"
            >
              <span>Demo Import</span>
            </button>

            <button
              onClick={() => setShowEmpModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-black px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Colaborador</span>
            </button>
          </div>
        </div>

        {/* Bulk CSV Import Panel */}
        {showBulkImport && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-4 text-xs space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Importação de Colaboradores em Lote (CSV)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Baixe o modelo, preencha os dados e envie a planilha. O sistema irá ler o formato automaticamente e carregar os colaboradores no eSocial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBulkImport(false);
                  setParsedRows([]);
                  setParseError(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 p-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded transition cursor-pointer font-bold"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column: Template download instruction */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-500 font-bold shrink-0" />
                    1. Baixe o Modelo
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    Use o modelo padrão pré-configurado contendo as colunas corretas (Nome, CPF, RG, Data Nascimento, Matricula, Setor, Cargo, Gestor Direto, Data Admissao, WhatsApp e Email).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white dark:text-white rounded transition shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Baixar Modelo CSV</span>
                </button>
              </div>

              {/* Middle/Right Column: File drop zone */}
              <div className="col-span-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition m-3 ${
                    dragActive 
                      ? 'border-safety-green bg-safety-green/5' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-safety-green bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <UploadCloud className={`w-8 h-8 mb-2 ${dragActive ? 'text-safety-green animate-bounce' : 'text-slate-400'}`} />
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-center mb-1 text-[11.5px]">
                    Arraste o arquivo CSV aqui ou clique para selecionar
                  </p>
                  <p className="text-[10px] text-slate-450 text-center">
                    Suporta arquivos com delimitadores comuns (vírgula ou ponto-e-vírgula)
                  </p>
                </div>
              </div>
            </div>

            {/* Parse result error warning */}
            {parseError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded text-[11px] text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parse result list preview */}
            {parsedRows.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800/80 p-2 text-slate-700 dark:text-slate-200 flex justify-between items-center font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <span>Visualização dos dados ({parsedRows.length} registros encontrados)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    parsedRows.filter(r => r.isValid).length === parsedRows.length
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {parsedRows.filter(r => r.isValid).length} de {parsedRows.length} válidos
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {parsedRows.map((row, index) => (
                    <div key={index} className="p-2.5 flex justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition text-[11px]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{row.data.name || <em className="text-rose-600 font-semibold">Falta o Nome</em>}</span>
                          <span className="text-slate-450 text-[9px] font-mono shrink-0">Matrícula: {row.data.matricula}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-450 mt-0.5">
                          <span>CPF: {row.data.cpf || <em className="text-rose-600 font-semibold">Sem CPF</em>}</span>
                          <span>•</span>
                          <span>Setor: {row.data.sector}</span>
                          <span>•</span>
                          <span>Cargo: {row.data.role}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {row.data.phone && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {row.data.phone}
                          </span>
                        )}
                        {row.data.email && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5">
                            <Mail className="w-2.5 h-2.5" />
                            {row.data.email}
                          </span>
                        )}

                        {row.isValid ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Válido
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5" title={row.errors.join(', ')}>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            Inválido
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setParsedRows([])}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold rounded transition cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    disabled={importing || parsedRows.filter(r => r.isValid).length === 0}
                    onClick={handleBulkImportSubmit}
                    className="px-4 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white font-bold rounded transition uppercase tracking-wider text-[10px] flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processando ({importProgress.current}/{importProgress.total})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Importar {parsedRows.filter(r => r.isValid).length} registros válidos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {importStatus && (
          <div className="p-2 bg-safety-green/10 text-safety-green rounded flex items-center gap-2 border border-safety-green/20 text-[11px] font-medium animate-fade-in mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-safety-green animate-bounce" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Directory Listings Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-[12px]">
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="compact-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4 pl-6">Colaborador</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">CPF / RG</th>
                    <th className="p-4">Setor / Cargo</th>
                    <th className="p-4 font-semibold">Contato (SST/Mensageria)</th>
                    <th className="p-4">Responsável Direto</th>
                    <th className="p-4">Admissão</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <img 
                          src={emp.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} 
                          alt={emp.name}
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`;
                          }}
                          className="w-8 h-8 rounded-full border-2 border-slate-150 block shadow-sm" 
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-[13px] leading-tight">{emp.name}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">D.N: {emp.birthDate}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-200">{emp.matricula}</td>
                      <td className="p-4">
                        <p className="font-mono font-medium text-slate-800 dark:text-slate-100">{emp.cpf}</p>
                        <p className="text-slate-400 text-[10px] font-mono mt-0.5">{emp.rg}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-850">{emp.sector}</p>
                        <p className="text-slate-555 text-[10.5px] mt-0.5">{emp.role}</p>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200 font-bold">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{emp.phone || <em className="text-slate-450 text-[10px] font-normal">Não Cadastrado</em>}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{emp.email || <em className="text-slate-450 text-[10px]">Não Cadastrado</em>}</span>
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{emp.manager}</td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{emp.admissionDate}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          emp.status === 'Ativo' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' 
                            : emp.status === 'Inativo'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingEmp({
                              ...emp,
                              birthDate: normalizeDate(emp.birthDate),
                              admissionDate: normalizeDate(emp.admissionDate)
                            })}
                            title="Editar dados do colaborador"
                            className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 p-2 rounded-xl text-slate-700 dark:text-slate-200 transition cursor-pointer hover:scale-105 shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-650 font-black" />
                          </button>
                          
                          <button
                            onClick={() => setDeletingEmp(emp)}
                            title="Excluir colaborador"
                            className="bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 border-2 border-slate-300 dark:border-slate-600 hover:border-rose-300 p-2 rounded-xl text-slate-700 dark:text-slate-200 transition cursor-pointer hover:scale-105 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 font-black" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
              <p className="font-black text-slate-650 text-sm">Nenhum colaborador encontrado</p>
              <p className="text-[11px] text-slate-450 max-w-sm mx-auto mt-1">Insira um novo registro acima ou use a importação de planilha de pessoal.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD EMPLOYEE WIZARD --- */}
      {showEmpModal && (
        <EmployeeWizard
          isEdit={false}
          initialData={{
            companyId: activeCompanyId, sector: 'Usinagem', role: 'Operador de Máquinas',
            manager: 'Luiz Gonzaga', admissionDate: new Date().toISOString().split('T')[0]
          }}
          onSave={handleCreateEmployee}
          onCancel={() => setShowEmpModal(false)}
        />
      )}

      {/* --- EDIT EMPLOYEE WIZARD --- */}
      {editingEmp && (
        <EmployeeWizard
          isEdit={true}
          initialData={editingEmp}
          onSave={handleUpdateEmployeeSubmit}
          onCancel={() => setEditingEmp(null)}
        />
      )}

      {/* --- CONFIRM DELETE MODAL DIALOG --- */}
      {deletingEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-205">
            <div className="bg-rose-950 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-450" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Confirmar Exclusão</h3>
              </div>
              <button onClick={() => setDeletingEmp(null)} className="text-rose-300 hover:text-white font-bold text-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                Você está prestes a excluir permanentemente o cadastro do colaborador 
                <strong className="text-slate-900 dark:text-white"> {deletingEmp.name}</strong> (Matrícula: {deletingEmp.matricula}).
              </p>
              <p className="p-2.5 bg-rose-50 border border-rose-100 rounded text-[10.5px] text-rose-700 leading-normal">
                <strong>Aviso Legal de SST:</strong> Excluir um colaborador ativo ou inativo remove o registro imediato dele no diretório. Certifique-se de que não existem fichas de entrega pendentes para este trabalhador no histórico regulatório.
              </p>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDeletingEmp(null)}
                  className="px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4.5 py-1.5 bg-rose-600 hover:bg-rose-750 text-white font-bold rounded transition uppercase text-[10px] tracking-wider cursor-pointer"
                >
                  Excluir permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- EDIT COMPANY MODAL DIALOG --- */}
      {showCompanyModal && editingCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-200 dark:border-slate-700 font-sans">
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-safety-green" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Editar Cadastro da Empresa</h3>
              </div>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompanySubmit} className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Razão Social</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.tradingName || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, tradingName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.cnpj}
                    onChange={(e) => setEditingCompany({ ...editingCompany, cnpj: maskCNPJ(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">CNAE</label>
                  <input
                    type="text"
                    value={editingCompany.cnae || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, cnae: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Grau de Risco (NR-04)</label>
                  <select
                    value={editingCompany.riskDegree || 1}
                    onChange={(e) => setEditingCompany({ ...editingCompany, riskDegree: parseInt(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  >
                    <option value={1}>Grau 1 (Leve)</option>
                    <option value={2}>Grau 2 (Moderado)</option>
                    <option value={3}>Grau 3 (Médio)</option>
                    <option value={4}>Grau 4 (Grave)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Responsável SST</label>
                  <input
                    type="text"
                    value={editingCompany.sstResponsible || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, sstResponsible: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Responsável RH</label>
                  <input
                    type="text"
                    value={editingCompany.rhResponsible || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, rhResponsible: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Endereço Completo</label>
                <input
                  type="text"
                  value={editingCompany.address || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-safety-green"
                />
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCompany}
                  className="px-4.5 py-1.5 bg-slate-900 text-white font-bold rounded hover:bg-slate-950 transition uppercase text-[10px] tracking-wider cursor-pointer font-semibold disabled:opacity-50"
                >
                  {isUpdatingCompany ? 'Salvando...' : 'Salvar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


