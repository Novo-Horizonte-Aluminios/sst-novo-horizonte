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
  FileText
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

  // Helper labels for statuses
  const getStatusBadge = (status: 'Entregue' | 'Simulado' | 'Erro') => {
    switch (status) {
      case 'Entregue':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            ENTREGUE (API)
          </span>
        );
      case 'Simulado':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            <Info className="w-2.5 h-2.5 text-blue-600" />
            SIMULADO
          </span>
        );
      case 'Erro':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            <XCircle className="w-2.5 h-2.5 text-red-600" />
            ERRO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Header with Connection Stats */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 matches-tab-title">
            <MessageCircle className="w-4 h-4 text-safety-green" />
            Integração WhatsApp Business • Módulo Evolution API &amp; n8n SESMT
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            Automação de eSocial &amp; Alertas de SST via WhatsApp para prevenção de passivos trabalhistas (NR-01, NR-06 &amp; NR-35).
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1 md:mt-0 select-none">
          <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="text-[10px]">
              <span className="font-bold text-slate-600">Serviço: </span>
              <span className="text-slate-500 font-mono">Evolution (Go) + n8n Webhook</span>
            </div>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loadingLogs}
            className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded flex items-center gap-1 text-[10px] cursor-pointer"
            title="Atualizar Logs"
          >
            <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Active Integration Banner */}
      <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-start gap-2.5 text-xs">
          <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1">
              Motor n8n & Evolution API Ativos e Operacionais
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              Os disparos de WhatsApp e e-mail estão sendo gerenciados com segurança pelos fluxos do servidor <strong>n8n.novohorizonte.com</strong>.
              Você pode disparar alertas manualmente abaixo ou acompanhar os envios automáticos que acontecem em segundo plano.
            </p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 p-2 rounded text-[10px] shrink-0 font-mono space-y-1 text-slate-300 w-full sm:w-auto">
          <div className="flex justify-between gap-4">
            <span>MOTOR DE FLUXOS:</span>
            <span className="text-emerald-400 text-[9px] font-bold">n8n Online</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/5 pt-1">
            <span>EVOLUTION API:</span>
            <span className="text-emerald-400 text-[9px] font-bold">Conectado (Ti-NH)</span>
          </div>
        </div>
      </div>

      {/* Primary Tab Bar */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setSubTab('alerts')}
          className={`px-3.5 py-1.5 font-bold uppercase tracking-wider text-[10.5px] border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            subTab === 'alerts' 
              ? 'border-safety-green text-safety-green' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Alertas Pendentes ({allPendingAlerts.length})
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-3.5 py-1.5 font-bold uppercase tracking-wider text-[10.5px] border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            subTab === 'history' 
              ? 'border-safety-green text-safety-green' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-3.5 h-3.5" />
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
                                : 'bg-safety-green/10 hover:bg-safety-green hover:text-white text-safety-green border-safety-green/20'
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

