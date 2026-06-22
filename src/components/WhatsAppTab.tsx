import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Phone, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  Info,
  ExternalLink,
  RefreshCw,
  Bell,
  HelpCircle,
  FileText,
  CheckCircle,
  Activity,
  Package,
  Users,
  GraduationCap,
  ClipboardCheck,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Employee, PPE, PPEDelivery, EmployeeTraining } from '../types';

interface WhatsAppTabProps {
  employees: Employee[];
  ppes: PPE[];
  deliveries: PPEDelivery[];
  employeeTrainings: EmployeeTraining[];
  onNavigate: (tab: string) => void;
}

interface WhatsAppLog {
  id: string;
  employeeId: string;
  employeeName: string;
  alertType: string;
  detail: string;
  phone: string;
  sentAt: string;
  status: 'Entregue' | 'Simulado' | 'Erro';
  message: string;
  errorDetail?: string;
}

export default function WhatsAppTab({
  employees,
  ppes,
  deliveries,
  employeeTrainings,
  onNavigate
}: WhatsAppTabProps) {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsSearch, setLogsSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  
  // Interactive testing: enable phone number overrides
  const [phoneOverrides, setPhoneOverrides] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsResult, setSaveSettingsResult] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    employeeName: string;
    alertType: string;
    phone: string;
    status: 'success' | 'error';
    simulated: boolean;
    messageText: string;
    detailText?: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setN8nWebhookUrl(data.n8n_webhook_url || '');
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSaveSettingsResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n8n_webhook_url: n8nWebhookUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSettingsResult('✅ Configurações salvas!');
      } else {
        setSaveSettingsResult(`❌ Erro: ${data.error}`);
      }
    } catch (e: any) {
      setSaveSettingsResult(`❌ Falha de rede: ${e.message}`);
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSaveSettingsResult(null), 5000);
    }
  };

  const handleTestN8n = async (webhookName: string, payload: any) => {
    setIsTesting(true);
    setTestResult('Enviando teste...');
    try {
      const res = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookName, payload })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`✅ Sucesso! O webhook ${webhookName} recebeu o teste.`);
      } else {
        setTestResult(`❌ Erro n8n: ${data.error}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Falha de rede: ${e.message}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  // Tab selections inside this module: 'dashboard' or 'history'
  const [subTab, setSubTab] = useState<'alerts' | 'history'>('alerts');

  // Load logs from server
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Error fetching WhatsApp logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Map employee ID to phone numbers
  const getEmployeePhone = (empId: string) => {
    if (phoneOverrides[empId]) {
      return phoneOverrides[empId];
    }
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.phone) {
      return emp.phone;
    }
    const phoneMap: Record<string, string> = {
      'e1': '5551988887755', // Carlos Henrique
      'e2': '5551977775544', // Juliana Montenegro
      'e3': '5551966663322', // Amanda Martins
    };
    return phoneMap[empId] || '5551999990000';
  };

  const handlePhoneChange = (empId: string, value: string) => {
    setPhoneOverrides(prev => ({
      ...prev,
      [empId]: value
    }));
  };

  // Process data to identify Pending WhatsApp triggers
  // 1. Training Alerts (Vencidos or Pendentes)
  const pendingTrainings = employeeTrainings
    .filter(t => t.status === 'Vencido')
    .map(t => {
      const emp = employees.find(e => e.id === t.employeeId);
      return {
        id: `t_${t.id}`,
        dbId: t.id,
        employeeId: t.employeeId,
        employeeName: t.employeeName,
        alertType: 'treinamento_vencimento',
        label: 'Certificação Vencida',
        detail: t.trainingTitle,
        codeOrDate: t.expiryDate,
        nr: t.nr,
        phone: getEmployeePhone(t.employeeId),
        riskLevel: 'Médiocritica'
      };
    });

  // 2. PPE CA Alerts (Deliveries of PPE where its CA is Expired / Vencido)
  // Let's analyze deliveries that are currently 'Entregue' (delivered) but where the PPE has an expired CA
  const pendingCAs = deliveries
    .filter(d => d.status === 'Entregue')
    .reduce((acc: any[], delivery) => {
      const ppe = ppes.find(p => p.id === delivery.ppeId);
      if (ppe && ppe.caStatus !== 'Válido') {
        // Prevent duplicate employee-ppe pairs for simplicity
        const exists = acc.some(item => item.employeeId === delivery.employeeId && item.detail === ppe.name);
        if (!exists) {
          acc.push({
            id: `ca_${delivery.id}`,
            dbId: delivery.id,
            employeeId: delivery.employeeId,
            employeeName: delivery.employeeName,
            alertType: 'ca_vencimento',
            label: `CA Vencido [CA ${ppe.caNumber}]`,
            detail: ppe.name,
            codeOrDate: ppe.caNumber,
            nr: 'NR-06',
            phone: getEmployeePhone(delivery.employeeId),
            riskLevel: 'Legal/NR'
          });
        }
      }
      return acc;
    }, []);

  const allPendingAlerts = [...pendingTrainings, ...pendingCAs];
  
  // Filter pending alerts based on search query
  const filteredPending = allPendingAlerts.filter(alert => 
    alert.employeeName.toLowerCase().includes(pendingSearch.toLowerCase()) ||
    alert.detail.toLowerCase().includes(pendingSearch.toLowerCase()) ||
    alert.label.toLowerCase().includes(pendingSearch.toLowerCase())
  );

  // Filter sent logs based on search query
  const filteredLogs = logs.filter(log =>
    log.employeeName.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.detail.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.alertType.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.phone.includes(logsSearch)
  );

  // Execute actual WhatsApp Trigger API request
  const handleTriggerAlert = async (alert: typeof allPendingAlerts[0]) => {
    const activePhone = getEmployeePhone(alert.employeeId);
    setSendingId(alert.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/whatsapp/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: alert.employeeId,
          employeeName: alert.employeeName,
          alertType: alert.alertType,
          detail: alert.detail,
          codeOrDate: alert.codeOrDate,
          phone: activePhone,
          nr: alert.nr
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro desconhecido no servidor.');
      }

      const result = await res.json();
      
      setFeedback({
        show: true,
        employeeName: alert.employeeName,
        alertType: alert.alertType === 'ca_vencimento' ? 'Substituição de EPI (CA Vencido)' : 'Reciclagem de Treinamento NRs',
        phone: activePhone,
        status: 'success',
        simulated: result.simulated,
        messageText: result.simulated ? result.messageSent : result.log.message,
        detailText: result.warning || `Disparado via ${result.channel || 'Evolution API (Go) & n8n'}.`
      });

      // Reload sent logs
      await fetchLogs();

    } catch (e: any) {
      console.error(e);
      setFeedback({
        show: true,
        employeeName: alert.employeeName,
        alertType: alert.alertType === 'ca_vencimento' ? 'Substituição de EPI (CA Vencido)' : 'Reciclagem de Treinamento NRs',
        phone: activePhone,
        status: 'error',
        simulated: false,
        messageText: `Erro ao enviar o alerta. Verifique a Evolution API e n8n no Painel de Segredos.`,
        detailText: e.message
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Connection Stats */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 matches-tab-title">
            <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            Integração WhatsApp Business • Módulo Evolution API &amp; n8n SESMT
          </h2>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Automação de eSocial &amp; Alertas de SST via WhatsApp para prevenção de passivos trabalhistas (NR-01, NR-06 &amp; NR-35).
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1 md:mt-0 select-none">
          <div className="bg-slate-50 border-2 border-slate-250/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="text-[10.5px] font-bold text-slate-700">
              <span>Status: </span>
              <span className="text-slate-500 font-mono">Evolution (Go) + n8n Webhook</span>
            </div>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loadingLogs}
            className="p-2 px-3.5 border-2 border-slate-300 hover:bg-slate-200 text-slate-700 hover:text-slate-800 rounded-xl flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all hover:border-slate-400 bg-slate-100"
            title="Atualizar Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Active Integration Banner */}
      <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-900 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans transition-all hover:shadow-lg">
        <div className="flex items-start gap-3 text-xs">
          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-white text-[12px] uppercase tracking-wider flex items-center gap-1">
              Motor n8n & Evolution API Ativos e Operacionais
            </p>
            <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed">
              Os disparos de WhatsApp e e-mail estão sendo gerenciados com segurança pelos fluxos do servidor <strong>n8n.novohorizonte.com</strong>.
              Você pode disparar alertas manualmente abaixo ou acompanhar os envios automáticos que acontecem em segundo plano.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-[10.5px] shrink-0 font-mono space-y-1.5 text-slate-300 w-full sm:w-auto font-bold">
          <div className="flex justify-between gap-6">
            <span>MOTOR DE FLUXOS:</span>
            <span className="text-emerald-400 text-[10px] font-black">n8n Online</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-white/5 pt-1.5">
            <span>EVOLUTION API:</span>
            <span className="text-emerald-400 text-[10px] font-black">Conectado (Ti-NH)</span>
          </div>
        </div>
      </div>

      {/* CONFIGURAÇÃO DE INTEGRAÇÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-4 transition-all hover:shadow-md">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Settings className="w-4 h-4 text-slate-500" />
          Configurações de Integração (n8n)
        </h3>
        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
          Defina o endereço base do seu servidor n8n. Por padrão, o sistema utiliza a URL de ambiente configurada no servidor.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1">
            <input
              type="text"
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
              placeholder="https://n8n.novohorizonte.com"
              className="w-full text-[13px] p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-safety-green focus:ring-4 focus:ring-safety-green/10 bg-white font-mono text-slate-700 transition-all hover:border-slate-300"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSavingSettings ? 'Salvando...' : 'Salvar URL'}
          </button>
        </div>
        {saveSettingsResult && (
          <div className="mt-2 text-[10px] font-bold text-slate-600">
            {saveSettingsResult}
          </div>
        )}
      </div>

      {/* FERRAMENTAS DE TESTE (N8N) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6 transition-all hover:shadow-md">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          FERRAMENTAS DE TESTE (N8N)
        </h3>
        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
          Utilize estes botões para disparar eventos de teste diretamente para os Webhooks do n8n (modo <strong>Listen for test event</strong>).
          Você não precisa cadastrar nada real no sistema para validar a conexão.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => handleTestN8n('sst-epi-delivery', { delivery: { employeeName: 'Colaborador Teste', ppeName: 'Capacete de Segurança (Via Teste)', caNumber: '12345', deliveryDate: new Date().toISOString() } })}
            disabled={isTesting}
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-safety-green/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-slate-50/50"
          >
            <Package className="w-6 h-6 text-emerald-600 mb-2" />
            <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter">Recibo EPI</span>
          </button>

          <button
            onClick={() => handleTestN8n('sst-welcome', { employee: { name: 'Novo Colaborador', cpf: '000.000.000-00', sector: 'Produção', role: 'Operador (Teste)' } })}
            disabled={isTesting}
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-safety-green/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-slate-50/50"
          >
            <Users className="w-6 h-6 text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter">Boas Vindas</span>
          </button>

          <button
            onClick={() => handleTestN8n('sst-training-new', { training: { employeeName: 'Colaborador Teste', trainingTitle: 'NR-35 Trabalho em Altura', issueDate: new Date().toISOString(), score: 10 } })}
            disabled={isTesting}
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-safety-green/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-slate-50/50"
          >
            <GraduationCap className="w-6 h-6 text-amber-600 mb-2" />
            <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter">Treinamento</span>
          </button>

          <button
            onClick={() => handleTestN8n('sst-inspection-new', { inspection: { title: 'Inspeção de Rotina (Teste)', type: 'Rotina', scheduledDate: new Date().toISOString(), responsible: 'Técnico Teste' } })}
            disabled={isTesting}
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-safety-green/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-slate-50/50"
          >
            <ClipboardCheck className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter">Inspeção</span>
          </button>

          <button
            onClick={() => handleTestN8n('sst-accident', { accident: { type: 'Incidente sem lesão (Teste)', description: 'Teste de disparo de alerta', severity: 'Baixa', date: new Date().toISOString() } })}
            disabled={isTesting}
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-safety-green/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-slate-50/50"
          >
            <AlertTriangle className="w-6 h-6 text-rose-600 mb-2" />
            <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-tighter">Acidente</span>
          </button>
        </div>
        
        {testResult && (
          <div className={"mt-3 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 " + (testResult.includes('Erro') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
            {testResult.includes('Erro') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {testResult}
          </div>
        )}
      </div>

      {/* Primary Tab Bar */}
      <div className="border-b border-slate-200/80 flex gap-3 pb-px">
        <button
          onClick={() => setSubTab('alerts')}
          className={`px-4 py-2 font-black uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'alerts' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell className="w-4 h-4" />
          Alertas Pendentes ({allPendingAlerts.length})
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 font-black uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'history' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Envios ({logs.length})
        </button>
      </div>

      {/* FEEDBACK BANNER (MODAL-LIKE CARD AT TOP WHEN TRIGGERS HAPPEN) */}
      {feedback && feedback.show && (
        <div className={`p-4 rounded border shadow-md animate-fade-in text-xs ${
          feedback.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2.5">
              {feedback.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 leading-relaxed">
                <h4 className="font-bold text-[11px] uppercase tracking-wide">
                  {feedback.status === 'success' ? 'Notificação Processada com Sucesso!' : 'Falha no Disparo WhatsApp'}
                </h4>
                <p>
                  Destinatário: <strong>{feedback.employeeName}</strong> • Telefone: <strong className="font-mono">{feedback.phone}</strong>
                </p>
                <p className="text-[10.5px] italic text-slate-600 border-l-2 border-slate-300 pl-2 py-1 bg-white/60 rounded">
                  Status de Execução: {feedback.detailText}
                </p>

                <div className="mt-2.5">
                  <span className="block font-bold text-[9px] uppercase text-slate-500 mb-1">Visualização do Template Enviado no WhatsApp:</span>
                  <pre className="bg-[#e7f3eb] font-mono text-[10.5px] p-3 rounded text-emerald-950 whitespace-pre-wrap leading-relaxed border border-emerald-250 select-all shadow-inner">
                    {feedback.messageText}
                  </pre>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              className="text-slate-400 hover:text-slate-900 font-bold ml-4 cursor-pointer text-sm"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {/* AREA 1: PENDING ALERTS QUEUE */}
      {subTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row justify-between gap-2.5 items-center">
            <div className="relative w-full sm:max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={pendingSearch}
                onChange={e => setPendingSearch(e.target.value)}
                placeholder="Filtrar por trabalhador, EPI ou treinamento..."
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-8 pr-3 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-safety-green transition text-slate-700"
              />
            </div>
            <p className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider text-right w-full sm:w-auto shrink-0 font-bold">
              Total Fila Pendente: {filteredPending.length} itens de SST detector
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left table-auto border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Colaborador / Setor</th>
                  <th className="p-3">Alerta de Inconformidade</th>
                  <th className="p-3">Ref / Detalhe Técnico</th>
                  <th className="p-3">WhatsApp de Teste</th>
                  <th className="p-3 text-center">Risco Associado</th>
                  <th className="p-3 text-right">Ações de Prevenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
                      <p className="font-bold text-[11px] text-slate-700 uppercase">Perfeito! Nenhum alerta crítico de conformidade ativo.</p>
                      <p className="text-[10px] mt-0.5">Todos os treinamentos estão atualizados e nenhuma entrega de EPI possui CA vencido.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((alert) => {
                    const activePhone = getEmployeePhone(alert.employeeId);
                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/40 select-none">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{alert.employeeName}</p>
                          <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">ID: {alert.employeeId.toUpperCase()}</p>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                            alert.alertType === 'ca_vencimento'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {alert.label}
                          </span>
                        </td>
                        <td className="p-3 leading-tight">
                          <p className="font-semibold text-slate-700">{alert.detail}</p>
                          <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">
                            {alert.alertType === 'ca_vencimento' ? 'CA do Fornecedor' : 'Expira em'}: {alert.codeOrDate}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={activePhone}
                              onChange={e => handlePhoneChange(alert.employeeId, e.target.value)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-safety-green transition w-28"
                              title="Altere o celular para disparar e receber no seu próprio celular"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                            {alert.riskLevel}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleTriggerAlert(alert)}
                            disabled={sendingId === alert.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase tracking-wider text-[9.5px] rounded border transition shadow-sm cursor-pointer ${
                              sendingId === alert.id
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary border-brand-primary/20'
                            }`}
                          >
                            <Send className="w-3 h-3 shrink-0" />
                            <span>{sendingId === alert.id ? 'Disparando...' : 'Fuzilar Alerta'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AREA 2: PAST SEND LOGS (WHATSAPP AUDIT TRACE) */}
      {subTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row justify-between gap-2.5 items-center">
            <div className="relative w-full sm:max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={logsSearch}
                onChange={e => setLogsSearch(e.target.value)}
                placeholder="Buscar no histórico de auditoria..."
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-8 pr-3 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-safety-green transition text-slate-700"
              />
            </div>
            <p className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider text-right w-full sm:w-auto shrink-0 font-bold">
              Total logs guardados: {filteredLogs.length} envios
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left table-auto border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3 w-[20%]">Destinatário / Celular</th>
                  <th className="p-3 w-[15%]">Finalidade</th>
                  <th className="p-3 w-[20%]">Referência de Monitor</th>
                  <th className="p-3 w-[15%] text-center">Canal Status</th>
                  <th className="p-3 w-[15%] text-center">Data / Hora de Envio</th>
                  <th className="p-3 w-[15%] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <HelpCircle className="w-7 h-7 text-slate-350 mx-auto mb-1" />
                      <p className="font-bold text-[10px] text-slate-700 uppercase">Nenhum log encontrado para a busca atual</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/20 leading-relaxed">
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{log.employeeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.phone}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.alertType.includes('EPI') 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {log.alertType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-semibold truncate max-w-xs" title={log.detail}>
                        {log.detail}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="p-3 text-center text-slate-400 font-mono text-[10px]">
                        {new Date(log.sentAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setFeedback({
                              show: true,
                              employeeName: log.employeeName,
                              alertType: log.alertType,
                              phone: log.phone,
                              status: log.status === 'Erro' ? 'error' : 'success',
                              simulated: log.status === 'Simulado',
                              messageText: log.message,
                              detailText: log.status === 'Erro' ? log.errorDetail : 'Consultado no histórico de auditoria local S-2240.'
                            });
                          }}
                          className="p-1 px-2 border border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-wider text-[9px] rounded text-slate-650 cursor-pointer"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTEGRATION DEVELOPMENT FOOTER (eSocial NR-01 GRO context notes) */}
      <div className="bg-slate-100 p-3.5 rounded border border-slate-200 text-[10px] text-slate-500 flex items-start gap-2 max-w-4xl leading-relaxed mt-4">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">
            Gestão Centralizada de Automação (eSocial S-2240 Compliance via WhatsApp)
          </p>
          <p>
            1. As credenciais de envio (Evolution API) e e-mail (SMTP) não precisam ser informadas no painel web.
            <br />
            2. Toda a orquestração e gerenciamento de chaves é feita diretamente dentro da interface gráfica do <a href="https://n8n.novohorizonte.com" target="_blank" className="text-safety-green font-bold underline">n8n Workflow Engine</a>.
            <br />
            3. Caso você perca a conexão do WhatsApp, basta abrir o painel da Evolution e ler o QR Code da instância <strong>Ti-NH</strong> novamente.
          </p>
          <p className="mt-2 text-slate-400 border-t border-slate-200 pt-2">
            A conformidade automatizada garante que cada trabalhador seja intimado sobre vencimentos críticos e exames, reduzindo passivos PGR (NR-01) e PCMSO (NR-07).
          </p>
        </div>
      </div>

    </div>
  );
}

