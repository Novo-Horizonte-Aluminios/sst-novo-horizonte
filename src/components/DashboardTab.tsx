import React from 'react';
import { 
  Shield, 
  Users, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FlameKindling,
  CalendarCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  TrendingDown,
  BarChart2,
  FileSpreadsheet,
  FileDown,
  FileText,
  Printer,
  ShieldCheck,
  Cpu,
  Workflow,
  RefreshCw,
  Power
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { Employee, PPE, PPEDelivery, EmployeeTraining } from '../types';
import { exportDashboardToExcel, exportDashboardToPDF } from '../utils/exportUtils';

// Custom Tooltip for rates/percentages styled to match high-density slate-950 theme
const CustomRateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white text-[10px] p-2.5 rounded border border-slate-900 shadow-xl font-mono">
        <p className="font-bold text-slate-400 border-b border-white/10 pb-1 mb-1.5 uppercase font-sans tracking-tight">{label}</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
              <span className="font-sans text-slate-300 text-[9.5px]">{p.name}:</span>
            </span>
            <span className="font-bold text-white text-[10px]">{p.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for incident counts styled to match high-density slate-950 theme
const CustomCountTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white text-[10px] p-2.5 rounded border border-slate-900 shadow-xl font-mono">
        <p className="font-bold text-slate-400 border-b border-white/10 pb-1 mb-1.5 uppercase font-sans tracking-tight">{label}</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
              <span className="font-sans text-slate-300 text-[9.5px]">{p.name}:</span>
            </span>
            <span className="font-bold text-white text-[10px]">{p.value} {p.value === 1 ? 'caso' : 'casos'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardTabProps {
  employees: Employee[];
  ppes: PPE[];
  deliveries: PPEDelivery[];
  trainings: EmployeeTraining[];
  activeCompanyId: string;
  onNavigate: (tabId: string) => void;
}

export default function DashboardTab({
  employees,
  ppes,
  deliveries,
  trainings,
  activeCompanyId,
  onNavigate
}: DashboardTabProps) {
  const [showPdfModal, setShowPdfModal] = React.useState(false);
  const [integrations, setIntegrations] = React.useState<any>(null);
  const [loadingIntegrations, setLoadingIntegrations] = React.useState(true);
  const [pinging, setPinging] = React.useState<Record<string, boolean>>({});
  const [toggling, setToggling] = React.useState<Record<string, boolean>>({});

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations/health');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (e) {
      console.error('Error fetching integrations:', e);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  React.useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggleIntegration = async (key: string) => {
    setToggling(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/integrations/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration: key })
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations((prev: any) => ({
          ...prev,
          [key]: data.updated
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePingIntegration = async (key: string) => {
    setPinging(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/integrations/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration: key })
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations((prev: any) => ({
          ...prev,
          [key]: data.updated
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPinging(prev => ({ ...prev, [key]: false }));
    }
  };

  // Filter assets to active tenant to prove multi-company architecture context
  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId);
  const activeCount = companyEmployees.filter(e => e.status === 'Ativo').length;
  
  const totalStockItems = ppes.reduce((acc, p) => acc + p.stockCount, 0);
  const criticalStockItems = ppes.filter(p => p.stockCount < p.minStock);
  const expiredCAs = ppes.filter(p => p.caStatus !== 'Válido');
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pendente').length;
  const deliveredCount = deliveries.filter(d => d.status === 'Entregue').length;
  const totalDeliveries = deliveries.length;
  const currentDeliveryRate = totalDeliveries > 0 ? Math.round((deliveredCount / totalDeliveries) * 100) : 100;
  
  // Expiry alerts for trainings
  const expiredTrainings = trainings.filter(t => t.status === 'Vencido');

  const today = new Date();
  const ppesWithDurability = ppes.filter(p => p.durabilityDays && p.durabilityDays > 0);
  const ppeExpirations = deliveries
    .filter(d => d.status === 'Entregue')
    .map(d => {
      const ppe = ppesWithDurability.find(p => p.id === d.ppeId);
      if (!ppe) return null;
      
      const deliveryDate = new Date(d.deliveryDate);
      const expiryDate = new Date(deliveryDate.getTime() + (ppe.durabilityDays! * 24 * 60 * 60 * 1000));
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return { ...d, expiryDate, daysUntilExpiry, ppe };
    })
    .filter(Boolean)
    .filter((item: any) => item.daysUntilExpiry <= 15)
    .sort((a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry);

  // Dados históricos de Entrega de EPI para a Novo Horizonte Alumínios (Gráfico de Barras)
  const deliveryData = [
    { name: 'Jan/26', 'Entregas Concluídas': 82, 'Meta de Segurança': 95 },
    { name: 'Fev/26', 'Entregas Concluídas': 88, 'Meta de Segurança': 95 },
    { name: 'Mar/26', 'Entregas Concluídas': 90, 'Meta de Segurança': 95 },
    { name: 'Abr/26', 'Entregas Concluídas': 93, 'Meta de Segurança': 95 },
    { name: 'Mai/26', 'Entregas Concluídas': 92, 'Meta de Segurança': 95 },
    { name: 'Jun/26 (Atual)', 'Entregas Concluídas': currentDeliveryRate, 'Meta de Segurança': 95 }
  ];

  // Dados históricos de Acidentes e Quase Acidentes (Gráfico de Linha)
  const accidentData = [
    { name: 'Jan/26', 'Acidentes Graves': 0, 'Quase Acidentes': 4 },
    { name: 'Fev/26', 'Acidentes Graves': 1, 'Quase Acidentes': 6 },
    { name: 'Mar/26', 'Acidentes Graves': 0, 'Quase Acidentes': 2 },
    { name: 'Abr/26', 'Acidentes Graves': 0, 'Quase Acidentes': 3 },
    { name: 'Mai/26', 'Acidentes Graves': 0, 'Quase Acidentes': 5 },
    { name: 'Jun/26 (Atual)', 'Acidentes Graves': 0, 'Quase Acidentes': 1 }
  ];

  const handleExportExcel = () => {
    exportDashboardToExcel(
      employees,
      ppes,
      deliveries,
      trainings,
      deliveryData,
      accidentData,
      activeCompanyId === 'c1' ? 'Novo Horizonte Alumínios' : 'Unidade Auxiliar'
    );
  };

  const handleExportPdf = () => {
    exportDashboardToPDF(
      employees,
      ppes,
      deliveries,
      trainings,
      deliveryData,
      accidentData,
      activeCompanyId === 'c1' ? 'Novo Horizonte Alumínios' : 'Unidade Auxiliar'
    );
  };

  // Mini Chart components built in raw Tailwind CSS (guarantees lightweight zero-dependency visual beauty)
  return (
    <div className="space-y-4">
      {/* Fluxos de Operação Rápidos */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Workflow className="w-3.5 h-3.5 text-slate-400" />
          Fluxos de Operação Rápidos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('delivery')}
            className="p-4 bg-white hover:bg-slate-50 hover:text-safety-green border border-slate-200 hover:border-safety-green/50 rounded-xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-[11px] font-bold text-slate-700 flex flex-col items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-safety-green" />
            Entrega de EPI
          </button>
          <button 
            onClick={() => onNavigate('ppes')}
            className="p-4 bg-white hover:bg-slate-50 hover:text-safety-green border border-slate-200 hover:border-safety-green/50 rounded-xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-[11px] font-bold text-slate-700 flex flex-col items-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-[#0369a1]" />
            Auditar CAs
          </button>
          <button 
            onClick={() => onNavigate('incidents')}
            className="p-4 bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-[11px] font-bold text-slate-700 flex flex-col items-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Comunicar Risco
          </button>
          <button 
            onClick={() => onNavigate('ai')}
            className="p-4 bg-white hover:bg-slate-50 hover:text-amber-600 border border-slate-200 hover:border-amber-400 rounded-xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-[11px] font-bold text-slate-700 flex flex-col items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            SST Especialista
          </button>
        </div>
      </div>

      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded border border-slate-200 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Painel Operacional (SST & legal compliance)</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Métricas de conformidade NR-01, NR-06, NR-12, NR-35 e controle estratégico em modo de alta densidade.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Pequeno painel de status das integrações reais */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[10px] select-none font-medium text-slate-600">
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Integrações:</span>
            
            {/* Evolution API Gateway */}
            <div className="flex items-center gap-1.5" title="WhatsApp Gateway (Evolution API)">
              <Cpu className={`w-3.5 h-3.5 ${integrations?.evolution?.status === 'online' ? 'text-emerald-600' : 'text-red-500'}`} />
              <span className="font-semibold text-slate-700">Evolution API</span>
              <span className={`h-2.5 w-2.5 rounded-full border border-white ${
                integrations?.evolution?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'
              }`} />
            </div>

            <div className="h-3 w-px bg-slate-200" />

            {/* n8n Engine */}
            <div className="flex items-center gap-1.5" title="SST Webhook Automation (n8n)">
              <Workflow className={`w-3.5 h-3.5 ${integrations?.n8n?.status === 'online' ? 'text-indigo-600' : 'text-red-500'}`} />
              <span className="font-semibold text-slate-700">n8n</span>
              <span className={`h-2.5 w-2.5 rounded-full border border-white ${
                integrations?.n8n?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'
              }`} />
            </div>
          </div>

          <div className="flex bg-safety-green/10 text-safety-green text-[10px] font-bold px-3 py-1 rounded items-center gap-1.5 border border-safety-green/20 h-[26px]">
            <Activity className="w-3.5 h-3.5 animate-pulse text-safety-green" />
            <span>MONITORAMENTO ATIVO</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Workers */}
        <div className="dense-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipe Ativa</span>
            <div className="bg-slate-100 text-slate-600 p-1.5 rounded">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-800">{activeCount}</span>
            <span className="text-[9px] text-slate-400 font-medium">Trabalhadores</span>
          </div>
        </div>

        {/* KPI 2: CA Status */}
        <div 
          onClick={() => onNavigate('ppes')}
          className="dense-card hover:border-safety-green transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CAs Irregulares</span>
            <div className={`p-1.5 rounded ${expiredCAs.length > 0 ? 'bg-red-50 text-red-650' : 'bg-safety-green/10 text-safety-green'}`}>
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl font-extrabold ${expiredCAs.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{expiredCAs.length}</span>
            <span className="text-[9px] text-[#dc2626] font-semibold">
              {expiredCAs.length > 0 ? 'Ação requerida' : '0 intercorrências'}
            </span>
          </div>
        </div>

        {/* KPI 3: Stock Alert */}
        <div 
          onClick={() => onNavigate('stock')}
          className="dense-card hover:border-safety-green transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estoque Baixo</span>
            <div className={`p-1.5 rounded ${criticalStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-safety-green/10 text-safety-green'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl font-extrabold ${criticalStockItems.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{criticalStockItems.length}</span>
            <span className="text-[9px] text-amber-600 font-semibold">
              {criticalStockItems.length > 0 ? 'Min. rompido' : 'Segurança total'}
            </span>
          </div>
        </div>

        {/* KPI 4: Pending LMS Trainings */}
        <div 
          onClick={() => onNavigate('trainings')}
          className="dense-card hover:border-safety-green transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expirados (NR)</span>
            <div className={`p-1.5 rounded ${expiredTrainings.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-safety-green/10 text-safety-green'}`}>
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-800">{expiredTrainings.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">Treinamentos</span>
          </div>
        </div>
      </div>

      {/* MONITORAMENTO REAL-TIME DAS INTEGRAÇÕES */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Status de Saúde das Integrações Automáticas (SST)</h3>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Monitoramento de Webhooks & Disparos de Alerta
          </span>
        </div>

        {loadingIntegrations ? (
          <div className="py-4 text-center text-slate-400 text-xs font-mono">
            Carregando status dos módulos de integração...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Evolution API Connection Card */}
            {integrations?.evolution && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 flex flex-col justify-between space-y-2.5 transition duration-150 hover:shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">WhatsApp Gateway API</span>
                    <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-600" />
                      {integrations.evolution.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-sm" title={integrations.evolution.url}>{integrations.evolution.url}</p>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border select-none ${
                    integrations.evolution.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${integrations.evolution.status === 'online' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                    {integrations.evolution.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500 leading-relaxed">
                  <div className="space-y-0.5">
                    <p>Instância: <strong className="text-slate-700">{integrations.evolution.instanceName}</strong></p>
                    <p>Latência: <strong className={integrations.evolution.status === 'online' ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {integrations.evolution.status === 'online' ? integrations.evolution.latency : 'N/A'}
                    </strong></p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p>Versão: <strong className="text-slate-700">{integrations.evolution.version}</strong></p>
                    <p>Ultimo Ping: <strong className="text-slate-705">{new Date(integrations.evolution.lastPing).toLocaleTimeString('pt-BR')}</strong></p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200/40">
                  <button
                    onClick={() => handlePingIntegration('evolution')}
                    disabled={pinging['evolution'] || integrations.evolution.status === 'offline'}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider py-1 border rounded transition cursor-pointer select-none ${
                      integrations.evolution.status === 'offline'
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 active:bg-slate-150'
                    }`}
                    title="Testar comunicação com a Evolution API"
                  >
                    <RefreshCw className={`w-3 h-3 ${pinging['evolution'] ? 'animate-spin' : ''}`} />
                    <span>Ping Test</span>
                  </button>
                  <button
                    onClick={() => handleToggleIntegration('evolution')}
                    disabled={toggling['evolution']}
                    className={`p-1.5 px-3 flex items-center justify-center rounded border text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition select-none ${
                      integrations.evolution.status === 'online'
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    }`}
                    title={integrations.evolution.status === 'online' ? "Simular queda de conexão da Evolution API" : "Reconectar API"}
                  >
                    <Power className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* n8n Workflow Automation Engine Card */}
            {integrations?.n8n && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 flex flex-col justify-between space-y-2.5 transition duration-150 hover:shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">SST Webhook Automation</span>
                    <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                      {integrations.n8n.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-sm" title={integrations.n8n.url}>{integrations.n8n.url}</p>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border select-none ${
                    integrations.n8n.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${integrations.n8n.status === 'online' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                    {integrations.n8n.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500 leading-relaxed">
                  <div className="space-y-0.5">
                    <p>Fuxos Ativos: <strong className="text-slate-700">{integrations.n8n.activeWorkflows} rotinas sST</strong></p>
                    <p>Disparos n8n: <strong className="text-slate-700 font-bold">{integrations.n8n.triggersProcessed} envios</strong></p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p>Node type: <strong className="text-slate-700">Webhook Listener</strong></p>
                    <p>Ultima Ação: <strong className="text-slate-705">{new Date(integrations.n8n.lastPing).toLocaleTimeString('pt-BR')}</strong></p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200/40">
                  <button
                    onClick={() => handlePingIntegration('n8n')}
                    disabled={pinging['n8n'] || integrations.n8n.status === 'offline'}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider py-1 border rounded transition cursor-pointer select-none ${
                      integrations.n8n.status === 'offline'
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 active:bg-slate-150'
                    }`}
                    title="Simular disparo de Webhook para o n8n"
                  >
                    <RefreshCw className={`w-3 h-3 ${pinging['n8n'] ? 'animate-spin' : ''}`} />
                    <span>Disparar Webhook</span>
                  </button>
                  <button
                    onClick={() => handleToggleIntegration('n8n')}
                    disabled={toggling['n8n']}
                    className={`p-1.5 px-3 flex items-center justify-center rounded border text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition select-none ${
                      integrations.n8n.status === 'online'
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    }`}
                    title={integrations.n8n.status === 'online' ? "Simular suspensão do Webhook n8n" : "Reativar Webhook"}
                  >
                    <Power className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exportação de Relatórios Executivos */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5 text-safety-green" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Exportação de Relatórios de Conformidade</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Gere planilhas consolidadas e relatórios em PDF formatados conforme os requisitos de auditoria do Ministério do Trabalho.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded transition cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded transition cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Baixar PDF</span>
          </button>
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Visualizar Impressão</span>
          </button>
        </div>
      </div>

      {/* Indicadores Executivos de Desempenho (SST Recharts Section) */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Taxa de Entrega de EPI (Bar Chart) */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-safety-green" />
                Taxa de Entrega de EPI (%)
              </h3>
              <span className="text-[10px] font-mono text-safety-green font-bold bg-safety-green/10 px-1.5 py-0.5 rounded border border-safety-green/20">
                Adesão: {currentDeliveryRate}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-tight font-sans">
              Evolução mensal das fichas de entrega de EPI assinadas digitalmente vs. a Meta de Segurança da Novo Horizonte.
            </p>
          </div>

          <div className="h-[180px] w-full mt-1.5 font-mono text-[9px] select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deliveryData}
                margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={8.5}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={8.5}
                />
                <Tooltip content={<CustomRateTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend 
                  verticalAlign="top" 
                  height={24} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '9.5px', 
                    fontFamily: 'Inter, sans-serif',
                    color: '#475569',
                    paddingBottom: '8px'
                  }} 
                />
                <Bar 
                  name="Entregas Concluídas" 
                  dataKey="Entregas Concluídas" 
                  fill="#15803d" 
                  radius={[3, 3, 0, 0]} 
                  maxBarSize={28}
                />
                <ReferenceLine 
                  y={95} 
                  stroke="#ea580c" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: 'Meta (95%)', 
                    position: 'top', 
                    fill: '#ea580c', 
                    fontSize: 8,
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif'
                  }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Evolução de Acidentes e Desvios (Line Chart) */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-655 text-amber-600" />
                Evolução de Incidentes & Desvios
              </h3>
              <span className="text-[10px] font-mono text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Tendência de Queda: Ativa
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-tight font-sans">
              Estatísticas mensais de desvios operacionais controlados e ocorrências com lesão registradas pelo SESMT.
            </p>
          </div>

          <div className="h-[180px] w-full mt-1.5 font-mono text-[9px] select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={accidentData}
                margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={8.5} 
                />
                <YAxis 
                  domain={[0, 'auto']} 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={8.5} 
                />
                <Tooltip content={<CustomCountTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={24} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '9.5px', 
                    fontFamily: 'Inter, sans-serif',
                    color: '#475569',
                    paddingBottom: '8px'
                  }} 
                />
                <Line 
                  name="Quase Acidentes" 
                  type="monotone" 
                  dataKey="Quase Acidentes" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  name="Acidentes Graves" 
                  type="monotone" 
                  dataKey="Acidentes Graves" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Operations Dashboard and Risk Compliance Progress columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column: Visual Compliance and Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-safety-green" />
              Conformidade Legal por Setor
            </h3>
            
            {/* Visual Bar graphs */}
            <div className="space-y-3 font-sans text-[11px]">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-medium text-slate-600">Usinagem de Peças (NR-12)</span>
                  <span className="font-bold text-safety-green">100% em Ordem</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                  <div className="bg-safety-green h-full rounded" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-medium text-slate-600">Soldagem e Montagem Química (NR-06 & NR-15)</span>
                  <span className="font-bold text-safety-green">94% Adequado</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                  <div className="bg-safety-green h-full rounded" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-medium text-slate-600">Montagem Mecânica (Pendência de CAs)</span>
                  <span className="font-bold text-red-500">65% Requer Regularização</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                  <div className="bg-red-550 bg-red-600 h-full rounded" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-medium text-slate-600">Trabalho em Altura e Logística (NR-35)</span>
                  <span className="font-bold text-amber-500">82% Reciclagem Pendente</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full rounded" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
            
            {/* Legend info */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Metodologia: Fórmulas de GRO integradas com base no PGR e NR-01</span>
              <button 
                onClick={() => onNavigate('ppes')}
                className="text-safety-green hover:underline font-bold inline-flex items-center gap-0.5"
              >
                Gerenciar CAs <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Regulatory notices and checklist overview */}
        <div className="bg-white p-4 rounded border border-slate-200 flex flex-col">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight mb-3 flex items-center gap-1.5">
            <FlameKindling className="w-3.5 h-3.5 text-amber-500" />
            Alertas Críticos de Fiscalização
          </h3>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {expiredCAs.map((ppe) => (
              <div key={ppe.id} className="p-2.5 bg-red-50/50 rounded border border-red-100 text-[11px] flex gap-2">
                <span className="text-red-600 p-1 bg-red-100 rounded h-6 w-6 flex items-center justify-center font-bold text-[9px] shrink-0">CA</span>
                <div>
                  <h4 className="font-semibold text-slate-850 leading-tight">{ppe.name}</h4>
                  <p className="text-red-600 font-bold mt-0.5">Inconformidade: CA {ppe.caNumber} Expirado ({ppe.caExpiryDate})</p>
                  <p className="text-slate-400 text-[9px] leading-tight mt-0.5">Obrigatoriedade NR-06: Troca obrigatória em andamento.</p>
                </div>
              </div>
            ))}

            {criticalStockItems.map((ppe) => (
              <div key={ppe.id} className="p-2.5 bg-amber-50/50 rounded border border-amber-100 text-[11px] flex gap-2">
                <span className="text-amber-600 p-1 bg-amber-100 rounded h-6 w-6 flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">EST</span>
                <div>
                  <h4 className="font-semibold text-slate-850 leading-tight">{ppe.name}</h4>
                  <p className="text-amber-700 font-bold mt-0.5">Crítico: {ppe.stockCount} peças (Min: {ppe.minStock})</p>
                  <p className="text-slate-400 text-[9px] leading-tight mt-0.5">Previsão de rutura operacional: 3 dias.</p>
                </div>
              </div>
            ))}

            {expiredTrainings.map((cert) => (
              <div key={cert.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 text-[11px] flex gap-2">
                <span className="text-slate-600 p-1 bg-slate-100 rounded h-6 w-6 flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">NR</span>
                <div>
                  <h4 className="font-semibold text-slate-850 leading-tight">{cert.employeeName}</h4>
                  <p className="text-slate-700 font-bold mt-0.5">Treinamento Vencido: {cert.nr}</p>
                  <p className="text-slate-400 text-[9px] leading-tight mt-0.5 text-red-500">Bloquear operação direta até reciclagem.</p>
                </div>
              </div>
            ))}

            {ppeExpirations.map((exp: any) => (
              <div key={`exp-${exp.id}`} className="p-2.5 bg-orange-50/50 rounded border border-orange-100 text-[11px] flex gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-orange-600 p-1 bg-orange-100 rounded h-6 w-6 flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">EPI</span>
                  <div>
                    <h4 className="font-semibold text-slate-850 leading-tight">{exp.employeeName}</h4>
                    <p className="text-orange-700 font-bold mt-0.5">Vencimento de {exp.ppeName} ({exp.daysUntilExpiry < 0 ? 'Vencido' : `em ${exp.daysUntilExpiry} dias`})</p>
                    <p className="text-slate-400 text-[9px] leading-tight mt-0.5">Durabilidade: {exp.ppe.durabilityDays} dias.</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/alerts/webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'epi_vencimento', employeeName: exp.employeeName, ppeName: exp.ppeName, employeeId: exp.employeeId })
                      });
                      alert('Alerta enviado via WhatsApp com sucesso!');
                    } catch(e) {
                      alert('Erro ao enviar alerta');
                    }
                  }}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded font-bold uppercase tracking-wider text-[8px] border border-emerald-200 transition"
                  title="Avisar colaborador"
                >
                  Alertar Zap
                </button>
              </div>
            ))}

            {expiredCAs.length === 0 && criticalStockItems.length === 0 && expiredTrainings.length === 0 && ppeExpirations.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400 gap-1.5">
                <CheckCircle2 className="w-8 h-8 text-safety-green" />
                <span className="text-[11px] font-bold text-slate-700">SESMT 100% REGULADO</span>
                <p className="text-[9px] max-w-[180px] text-slate-400">Total conformidade NR-01, NR-06 e NR-35 registrada.</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 bg-safety-green/5 p-2 rounded flex items-center justify-between text-[11px]">
            <span className="font-mono font-bold text-safety-green text-[9px]">SST COMPLIANCE RATING</span>
            <span className="font-bold text-safety-green bg-safety-green/10 px-2 py-0.5 rounded text-[10px]">A+ EXCELENTE</span>
          </div>
        </div>
      </div>

      {/* PDF Export Modal (Printable Dossier Setup) */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden animate-fade-in text-xs border border-slate-205 flex flex-col max-h-[90vh]">
            {/* Modal Actions Header */}
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">Exportar Relatório Mensal de Conformidade</h3>
                <p className="text-[9.5px] text-slate-400 mt-0.5">Gerador de Dossiê Executivo homologado para eSocial &amp; Auditoria</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const printContents = document.getElementById('printable-area-sst')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Dossie_Conformidade_SST_Novo_Horizonte</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
                                body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; font-size: 11px; line-height: 1.5; }
                                h1, h2, h3 { text-transform: uppercase; letter-spacing: -0.025em; margin: 0; }
                                .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
                                .logo-area { display: flex; flex-direction: column; gap: 2px; }
                                .logo-main { font-weight: 800; font-size: 14px; text-transform: uppercase; }
                                .logo-sub { font-weight: 600; color: #15803d; font-size: 11px; }
                                .doc-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
                                .section-title { font-size: 11px; font-weight: bold; background: #f8fafc; border-left: 3px solid #15803d; padding: 6px 10px; margin-top: 25px; margin-bottom: 12px; }
                                .grid-indicators { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
                                .ind-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; background: #f8fafc; }
                                .ind-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: bold; }
                                .ind-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
                                table { width: 100%; border-collapse: collapse; margin-vertical: 15px; font-size: 10.5px; }
                                th { background: #f1f5f9; padding: 8px 10px; font-weight: bold; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; text-align: left; }
                                td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
                                .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; page-break-inside: avoid; }
                                .sig-line { border-top: 1px solid #475569; text-align: center; padding-top: 8px; font-size: 10px; }
                                .text-right { text-align: right; }
                                .text-center { text-align: center; }
                                .text-slate-500 { color: #64748b; }
                                .font-mono { font-family: 'JetBrains Mono', monospace; }
                                .text-success { color: #15803d; font-weight: bold; }
                                .text-danger { color: #b91c1c; font-weight: bold; }
                              </style>
                            </head>
                            <body>
                              ${printContents}
                              <script>
                                window.onload = function() {
                                  window.print();
                                  setTimeout(function() { window.close(); }, 500);
                                };
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white rounded transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-white font-bold text-sm ml-2 cursor-pointer">✖</button>
              </div>
            </div>

            {/* Document Preview Container */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-0">
              <div 
                id="printable-area-sst" 
                className="bg-white p-8 rounded shadow-sm border border-slate-200 font-sans relative text-slate-800 select-all"
              >
                {/* PDF Banner Header */}
                <div className="header flex justify-between items-start border-b-2 border-slate-905 pb-4 mb-6">
                  <div className="logo-area flex flex-col">
                    <span className="logo-main font-extrabold text-[13px] tracking-tight text-slate-950">NOVO HORIZONTE ALUMÍNIOS LTDA</span>
                    <span className="logo-sub font-bold text-[10px] text-emerald-700 uppercase tracking-widest font-mono">SST INTERNO &amp; AUDITORIA</span>
                  </div>
                  <div className="text-right">
                    <span className="doc-badge inline-block bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-0.5 font-mono text-[9px] font-bold">
                      REF: SST-DOSSIER-2026-06
                    </span>
                    <p className="text-[8.5px] text-slate-400 mt-1 font-mono">Última atualização: Jun/2026</p>
                  </div>
                </div>

                {/* Subtitle Info */}
                <div className="mb-4">
                  <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">Dossiê Executivo de Indicadores de SST</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Relatório oficial emitido de acordo com a NR-01 (Gerenciamento de Riscos) e em observância ao eSocial S-2240.
                  </p>
                </div>

                {/* Grid metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-slate-100 py-3 mb-6 text-[10px]">
                  <div className="space-y-1">
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">Unidade Operativa:</span> Distrito Industrial, POA - RS</p>
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">CNAE Principal:</span> 24.41-5-02 (Produção de alumínio)</p>
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">Grau de Risco:</span> Grau 3 (Conforme NR-04)</p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">Responsável Administrativo:</span> Ana Clara Lima (RH)</p>
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">Responsável Técnico:</span> Eng. Roberto Santos (CREA: 8741-9)</p>
                    <p><span className="font-bold text-slate-500 uppercase text-[8.5px]">Data de Emissão:</span> {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Section titles */}
                <div className="section-title bg-slate-50 border-l-2 border-emerald-600 px-3 py-1.5 font-bold uppercase text-[10px] text-slate-800 mb-3 tracking-wider">
                  1. Indicadores de Desempenho Operacional (I-SST)
                </div>

                {/* Interactive numerical snapshot cards inside printable document */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Adesão a Entregas de EPI</p>
                    <p className="text-base font-black text-slate-900 mt-1">{currentDeliveryRate}%</p>
                    <span className="text-[8px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1.5 inline-block">Meta: 95%</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Integridade Física (Jun/26)</p>
                    <p className="text-base font-black text-emerald-700 mt-1">100%</p>
                    <span className="text-[8px] font-mono text-slate-400 rounded px-1 mt-1 inline-block">Zero Acidentes Graves</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Desvios Operacionais</p>
                    <p className="text-base font-black text-amber-600 mt-1">1 Caso</p>
                    <span className="text-[8px] font-mono text-slate-400 rounded px-1 mt-1 inline-block">Sob controle SESMT</span>
                  </div>
                </div>

                {/* Deliveries evolution data log */}
                <div className="section-title bg-slate-50 border-l-2 border-emerald-600 px-3 py-1.5 font-bold uppercase text-[10px] text-slate-800 mb-3 tracking-wider">
                  2. Histórico Mensal de Entrega de EPI &amp; Gestão de Risto
                </div>
                <table className="w-full text-left table-auto border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-2 text-[8.5px] uppercase font-bold">Período Fiscal</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-center">Adesão Registrada</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-center">Meta Estabelecida</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-right">Avaliação Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveryData.map((d, index) => {
                      const isConforme = d['Entregas Concluídas'] >= d['Meta de Segurança'];
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold">{d.name}</td>
                          <td className="p-2 text-center font-mono">{d['Entregas Concluídas']}%</td>
                          <td className="p-2 text-center font-mono text-slate-500">{d['Meta de Segurança']}%</td>
                          <td className={`p-2 text-right font-bold font-mono ${isConforme ? 'text-[9px] text-emerald-700' : 'text-[9px] text-amber-600'}`}>
                            {isConforme ? '✓ CONFORME' : '▲ ATENÇÃO'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Incidents and safety indicators log */}
                <div className="section-title bg-slate-50 border-l-2 border-emerald-600 px-3 py-1.5 font-bold uppercase text-[10px] text-slate-800 mb-3 tracking-wider">
                  3. Controle e Registro de Desvios (Quase Acidentes &amp; Graves)
                </div>
                <table className="w-full text-left table-auto border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-2 text-[8.5px] uppercase font-bold">Período Fiscal</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-center">Quase Acidentes (Desvios)</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-center">Acidentes Graves</th>
                      <th className="p-2 text-[8.5px] uppercase font-bold text-right">Status do Perigo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 flex-1">
                    {accidentData.map((acc, index) => {
                      const hasAccident = acc['Acidentes Graves'] > 0;
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold">{acc.name}</td>
                          <td className="p-2 text-center font-mono text-slate-700">{acc['Quase Acidentes']}</td>
                          <td className={`p-2 text-center font-mono ${hasAccident ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{acc['Acidentes Graves']}</td>
                          <td className={`p-2 text-right font-bold text-[9px] ${hasAccident ? 'text-red-600' : 'text-emerald-700'}`}>
                            {hasAccident ? '✗ RISCO SEVERO' : '✓ SOB CONTROLE'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Audit declaration & signs */}
                <div className="border border-slate-205 bg-slate-50 p-3 rounded text-[9.5px] leading-relaxed mb-10 text-slate-600">
                  <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    Declaração de Conformidade Técnica
                  </p>
                  As informações deste dossiê técnico de auditoria foram compiladas automaticamente das fichas de controle interno, ordens de serviço eletrônicas emitidas e dos registros de gerenciamento de riscos gerenciados pelo SESMT da Novo Horizonte Alumínios. Este documento serve para as finalidades legais da NR-01, NR-06, NR-12 e composição do PGR/PCMSO.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-6 border-t border-slate-200 mt-12">
                  <div className="text-center">
                    <div className="border-t border-slate-405 pt-1.5 text-[9.5px]">
                      <p className="font-bold text-slate-800">Roberto Santos</p>
                      <p className="text-slate-400 text-[8.5px] font-mono mt-0.5">Engenheiro de Segurança do Trabalho<br/>CREA: 8741-9 / POA</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-405 pt-1.5 text-[9.5px]">
                      <p className="font-bold text-slate-800">Representação da Diretoria</p>
                      <p className="text-slate-400 text-[8.5px] font-mono mt-0.5">Novo Horizonte Alumínios Ltda<br/>CNPJ: 34.892.455/0001-38</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with actions explanation */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 text-right flex justify-between items-center text-[10px]">
              <span className="text-slate-500 leading-tight block text-left">
                Nota: No Chrome/Edge, selecione <strong>"Salvar como PDF"</strong> na caixa de diálogo de impressão.
              </span>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-1.5 hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded cursor-pointer animate-pulse"
              >
                Voltar ao Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

