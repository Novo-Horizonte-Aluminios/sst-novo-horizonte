import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  HardDrive, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Settings2, 
  Calendar, 
  Lock, 
  EyeOff, 
  FileCode,
  Shield,
  Loader2,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function BackupTab() {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'config' | 'logs'>('status');
  
  // Backup configurations
  const [config, setConfig] = useState({
    s3Endpoint: 'https://s3.us-east-1.amazonaws.com',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Bucket: '',
    s3Region: 'us-east-1',
    frequency: 'weekly',
    maskSensitiveData: true,
    lastBackupAt: ''
  });

  const [secretInput, setSecretInput] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch configurations and logs on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resConfig, resLogs] = await Promise.all([
        fetch('/api/backup/config'),
        fetch('/api/backup/logs')
      ]);
      
      if (resConfig.ok) {
        const data = await resConfig.json();
        setConfig(data);
        setSecretInput(data.s3SecretKey || '');
      }
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Falha ao contatar API de Backup", e);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('save');
    try {
      const res = await fetch('/api/backup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          s3SecretKey: secretInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        showMsg("Configurações do S3 e LGPD atualizadas com sucesso!");
      } else {
        showMsg("Falha ao salvar configurações do banco de dados.", "error");
      }
    } catch (err: any) {
      showMsg("Erro de rede: " + err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerBackup = async (target: 's3' | 'local') => {
    setActionLoading(target);
    try {
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          mask: config.maskSensitiveData,
          executor: 'Dr. Marcos (SST)' // Conforms to default profile selected
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        showMsg(data.message);
        fetchData(); // reload logs and timestamps
      } else {
        showMsg(data.error || "Erro ao processar backup.", "error");
        fetchData();
      }
    } catch (err: any) {
      showMsg("Erro de processamento: " + err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadSQL = () => {
    // Standard direct browser download of dynamic PostgreSQL DUMP
    window.open(`/api/backup/download-sql?mask=${config.maskSensitiveData}`, '_blank');
    showMsg("Iniciando download do script PostgreSQL DUMP...");
    
    // Simular log local após um curto período para fins de sincronismo
    setTimeout(() => {
      fetchData();
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm font-sans divide-y divide-slate-100 flex-1 flex flex-col min-w-0" id="data-backup-module">
      {/* Tab Header & Title */}
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Database className="w-4 h-4 text-safety-green" />
            Backup de Dados e Segurança LGPD
          </h2>
          <p className="text-[11px] text-[#64748b] mt-0.5 max-w-2xl leading-relaxed">
            Módulo avançado de salvaguarda. Exporte toda a estrutura PostgreSQL (Tabelas de Colaboradores, Histórico de Entregas, Treinamentos LMS e EPIs) com mascaramento preventivo de dados sensíveis para conformidade jurídica.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-200/70 p-0.5 rounded border border-slate-200 gap-1 shrink-0 text-[10.5px]">
          <button
            onClick={() => setActiveSubTab('status')}
            className={`px-3 py-1 font-bold rounded uppercase tracking-wider transition ${
              activeSubTab === 'status' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Terminal Geral
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1 font-bold rounded uppercase tracking-wider transition ${
              activeSubTab === 'config' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Configurar S3
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1 font-bold rounded uppercase tracking-wider transition ${
              activeSubTab === 'logs' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registro de Auditoria ({logs.length})
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      {message && (
        <div className={`p-3 text-[11px] flex items-center gap-2.5 transition animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-b border-emerald-150 text-emerald-850' 
            : 'bg-rose-50 border-b border-rose-150 text-rose-850'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Loading overlay */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2 animate-pulse">
          <RefreshCw className="w-7 h-7 text-safety-green animate-spin" />
          <span className="text-xs font-bold text-slate-700">Carregando dados de segurança de TI corporativos...</span>
        </div>
      ) : (
        <div className="p-4 flex-1 overflow-y-auto">
          
          {/* SubTab 1: Status Dashboard */}
          {activeSubTab === 'status' && (
            <div className="space-y-4">
              
              {/* LGPD Compliance Metric Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Safe State Card */}
                <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-950 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Status da Base</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        Ativa / Segura
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight mt-1">PostgreSQL</h3>
                    <p className="text-[10px] text-slate-300 leading-snug mt-1">
                      Banco de dados de medicina e segurança do trabalho operacional com persistência integral.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Versão compatível</span>
                    <span className="text-slate-200">v14.5 / cloud-ready</span>
                  </div>
                </div>

                {/* S3 Configuration Status */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Upload Automatizado S3</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                        config.s3Bucket 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {config.s3Bucket ? 'Configurado' : 'Pendente'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight mt-1 shrink-0 truncate">
                      {config.s3Bucket || "Não Conectado"}
                    </h3>
                    <p className="text-[10px] text-slate-450 leading-snug mt-1">
                      {config.s3Bucket 
                        ? `Backup periódico habilitado para o bucket '${config.s3Bucket}' com criptografia de ponta a ponta.`
                        : 'Configure as credenciais e bucket S3 compatível (Standard AWS, Cloudflare R2 ou MinIO) na aba de configurações.'
                      }
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Frequência Cron</span>
                    <span className="font-bold uppercase text-slate-700">
                      {config.frequency === 'daily' ? 'Diário' : config.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                    </span>
                  </div>
                </div>

                {/* LGPD Compliance Anonymizer Status */}
                <div className={`p-3.5 rounded border flex flex-col justify-between transition-colors ${
                  config.maskSensitiveData 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' 
                    : 'bg-rose-50/30 border-rose-200 text-slate-850'
                }`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Conformidade LGPD</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                        config.maskSensitiveData 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {config.maskSensitiveData ? 'Mascaramento Ativo' : 'Risco de Vazamento'}
                      </span>
                    </div>
                    <h3 className="text-base font-black tracking-tight mt-1 flex items-center gap-1.5 text-slate-800">
                      {config.maskSensitiveData ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Dados Anonimizados
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Privacidade Baixa
                        </>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-450 leading-snug mt-1">
                      {config.maskSensitiveData 
                        ? "CPFs, RGs, e-mails e telefones dos colaboradores são mascarados automaticamente em dumps externos."
                        : "Por segurança legal, configure a anonimização de dados pessoais de funcionários para evitar multas regulatórias."
                      }
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-250 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Último backup salvo</span>
                    <span className="font-bold text-slate-700">
                      {config.lastBackupAt ? new Date(config.lastBackupAt).toLocaleString('pt-BR') : 'Nenhum salvo'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Center console */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <h3 className="text-[11px] font-bold text-slate-750 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500 font-bold" />
                  Ações Rápidas de Salvamento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Option 1: Direct SQL browser extraction */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-indigo-500" />
                        DUMP Postgres SQL Local
                      </h4>
                      <p className="text-[10.5px] text-slate-500 leading-snug mt-1">
                        Gere e baixe diretamente no seu dispositivo um script completo de DDL e DML `.sql` contendo todos os dados do sistema devidamente estruturados para reinstalação instantânea no banco de dados PostgreSQL.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSQL}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 text-[10px] px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider rounded transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Extrair SQL PostgreSQL
                    </button>
                  </div>

                  {/* Option 2: Dispatch immediately to configured S3 storage */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-emerald-500 animate-pulse" />
                        Transmitir para S3 Corporativo
                      </h4>
                      <p className="text-[10.5px] text-slate-500 leading-snug mt-1">
                        Dispare o processo automatizado de backup e compile as tabelas em um dump. Conecte de ponta a ponta com endpoints S3 configurados para armazenamento secundário inviolável e de auditoria facilitada.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading !== null || !config.s3Bucket}
                      onClick={() => handleTriggerBackup('s3')}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 text-[10px] px-3 py-2 bg-safety-green hover:bg-safety-green-dark text-white font-bold uppercase tracking-wider rounded transition shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {actionLoading === 's3' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Transmitindo...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Enviar ao S3 Agora</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 3: LGPD & Security checklist handbook */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-500" />
                        Princípios LGPD SST Ativos
                      </h4>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1">
                        Conforme a Circular do Ministério do Trabalho e as diretrizes da ANPD para medicina ocupacional:
                      </p>
                      <ul className="text-[9.5px] text-slate-450 list-disc pl-4 mt-1 space-y-1">
                        <li><strong>Minimização:</strong> Apenas dados eSocial inclusos;</li>
                        <li><strong>Segurança:</strong> Mascaramento ativo nos outputs externos;</li>
                        <li><strong>Transparência:</strong> Auditoria registrando quem gerou e quando.</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('config')}
                      className="mt-3.5 w-full text-center text-[9.5px] text-slate-650 font-bold hover:text-slate-800 transition py-1 bg-slate-100 hover:bg-slate-200 border border-slate-205 rounded cursor-pointer"
                    >
                      Alterar Privacidade de Dados →
                    </button>
                  </div>

                </div>
              </div>

              {/* Informative Handbook */}
              <div className="p-3 bg-blue-50 border border-blue-150 rounded flex gap-3 text-[11px] text-blue-800 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-0.5">Segurança Jurídica na Medicina do Trabalho (PostgreSQL SQL Dump)</h4>
                  <p>
                    A ficha eletrônica de EPIs (NR-06), os certificados e os prontuários de treinamentos dos funcionários constituem documentos de auditoria civil e trabalhista por até 20 anos. Realizar backups periódicos criptografados em S3 compatível previne passivos milionários gerados em caso de indisponibilidade tecnológica do eSocial ou acidentes operacionais com perda física de infraestrutura.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* SubTab 2: Configuration form */}
          {activeSubTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4 max-w-2xl bg-slate-50/50 p-4 rounded border border-slate-250">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Settings2 className="w-4 h-4 text-safety-green font-bold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Parâmetros do Armazenamento S3 Compatível</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                
                {/* Endpoint URL field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Endpoint S3 (URL do Provedor)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://s3.us-east-1.amazonaws.com"
                    value={config.s3Endpoint}
                    onChange={(e) => setConfig({ ...config, s3Endpoint: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Use AWS S3 ou seu endpoint customizado (MinIO, Cloudflare R2, Backblaze).
                  </span>
                </div>

                {/* S3 Region field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Região AWS S3 (Region)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="us-east-1"
                    value={config.s3Region}
                    onChange={(e) => setConfig({ ...config, s3Region: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px]"
                  />
                </div>

                {/* S3 Access Key ID field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    S3 Access Key ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={config.s3AccessKey}
                    onChange={(e) => setConfig({ ...config, s3AccessKey: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px] font-mono"
                  />
                </div>

                {/* S3 Secret Access Key field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    S3 Secret Access Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder={secretInput.includes('****') ? "Segredo salvo" : "Insira a chave secreta de gravação S3"}
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px] font-mono leading-none"
                    />
                    <span className="absolute right-2 top-2 text-slate-400">
                      <EyeOff className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Bucket name field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Nome do Bucket S3
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="novo-horizonte-sst-backups"
                    value={config.s3Bucket}
                    onChange={(e) => setConfig({ ...config, s3Bucket: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px]"
                  />
                </div>

                {/* Backup Frequency field */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Frequência do Cron Periódico
                  </label>
                  <select
                    value={config.frequency}
                    onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-safety-green text-[11px]"
                  >
                    <option value="manual">Manual / Sob Demanda</option>
                    <option value="daily">Diário (Meia-noite UTC)</option>
                    <option value="weekly">Semanal (Todo Domingo)</option>
                    <option value="monthly">Mensal (Dia 1 de cada mês)</option>
                  </select>
                </div>

              </div>

              {/* LGPD Compliance settings toggle */}
              <div className="bg-white p-3 border border-slate-200 rounded mt-4">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="lgpd-mask-checkbox"
                    checked={config.maskSensitiveData}
                    onChange={(e) => setConfig({ ...config, maskSensitiveData: e.target.checked })}
                    className="mt-1 cursor-pointer w-4 h-4 rounded text-safety-green border-slate-300 focus:ring-safety-green"
                  />
                  <div className="text-xs">
                    <label htmlFor="lgpd-mask-checkbox" className="font-extrabold text-slate-800 cursor-pointer block select-none uppercase text-[11px]">
                      Ativar Anonimização Preventiva de Colaboradores (LGPD & GDPR)
                    </label>
                    <p className="text-slate-500 mt-0.5 text-[10.5px] leading-relaxed">
                      Ao habilitar essa opção, todas as extrações DUMP (seja download local ou upload automático para o S3) mascararão CPFs, RGs, e-mails e telefones dos colaboradores. Isso garante a proteção de dados em ambientes secundários de testes e auditorias técnicas sem expor a identidade dos trabalhadores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded font-bold text-[11px] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save'}
                  className="px-4 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white rounded font-bold text-[11px] transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'save' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* SubTab 3: Backup Logs audit */}
          {activeSubTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-205 rounded">
                <div className="text-xs">
                  <span className="font-extrabold text-slate-750 uppercase text-[10.5px]">Histórico Geral de Backups de Segurança</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">As ações contendo exportações de dados geram registros imutáveis com tamanho de arquivo para prevenção de fraudes e auditoria interna de TI.</p>
                </div>
                <button
                  onClick={fetchData}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-sm transition shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  Atualizar logs
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <table className="w-full border-collapse text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="p-3">Execução / Carimbo</th>
                      <th className="p-3">Executor</th>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Tamanho</th>
                      <th className="p-3">LGPD</th>
                      <th className="p-3">Destino</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-mono text-[11px]">
                          Nenhum backup executado sob o sistema.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-800 shrink-0">
                            {new Date(log.sentAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 text-[11px] font-medium text-slate-700">
                            {log.executor}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-200 text-slate-650">
                              {log.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-705">
                            {log.size}
                          </td>
                          <td className="p-3 text-[11px]">
                            {log.masked === 'Sim' ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-1 rounded text-[9.5px] font-bold">
                                Anonimizado
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 border border-amber-150 px-1 rounded text-[9.5px] font-bold">
                                Integral
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={log.destination}>
                            {log.destination}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              log.status === 'Sucesso' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-800 border border-rose-250'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

