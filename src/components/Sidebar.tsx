import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Package, 
  FileCheck, 
  GraduationCap, 
  Flame, 
  Sparkles, 
  ScrollText, 
  ShieldAlert,
  CodeXml,
  Compass,
  MessageCircle,
  Database,
  Radar
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  companies: any[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedCompanyId,
  setSelectedCompanyId,
  userRole,
  setUserRole,
  companies
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Monitor Geral', icon: LayoutDashboard },
    { id: 'companies', label: 'Cadastro da Equipe', icon: Users },
    { id: 'delivery', label: 'Entrega (Ficha NR-06)', icon: FileCheck },
    { id: 'stock', label: 'Estoque Inteligente', icon: Package },
    { id: 'ppes', label: 'Garantia de EPI (CAs)', icon: Shield },
    { id: 'trainings', label: 'Treinamentos LMS', icon: GraduationCap },
    { id: 'incidents', label: 'Análise de Acidentes', icon: ShieldAlert },
    { id: 'reports', label: 'Central de Relatórios', icon: ScrollText },
    { id: 'ai', label: 'Especialista IA SST', icon: Sparkles },
    { id: 'fispq', label: 'SDS / FISPQ Químicos', icon: Flame },
    { id: 'whatsapp_alerts', label: 'Alertas WhatsApp', icon: MessageCircle },
    { id: 'risk_map', label: 'Mapa de Riscos por Imagem', icon: Radar },
    { id: 'backup', label: 'Backup & Segurança', icon: Database }
  ];

  return (
    <aside className="w-[220px] bg-[#0f172a] text-[#94a3b8] flex flex-col h-full flex-shrink-0 border-r border-[#1e293b] font-sans antialiased select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e293b]">
        <div className="text-white font-extrabold text-sm tracking-tight leading-none flex flex-col gap-1 uppercase">
          <span>Novo Horizonte</span>
          <span className="text-safety-green text-xs font-semibold">Alumínios</span>
        </div>
        <div className="text-[9px] uppercase tracking-widest opacity-55 mt-1.5 font-mono font-bold">
          SST Interno
        </div>
      </div>

      {/* User Role (Multi-Tenant Selector Removed, Single Company System) */}
      <div className="p-3.5 border-b border-[#1e293b] bg-[#0f172a]/40 space-y-2 text-[10px]">
        <div>
          <label className="text-[9px] font-mono text-[#64748b] uppercase tracking-wider block mb-1 font-bold">
            Perfil de Acesso
          </label>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="w-full bg-[#1e293b] border border-[#334155] text-[11px] text-white rounded px-2 py-1 focus:outline-none focus:border-safety-green font-mono"
          >
            <option value="SST">Dr. Marcos (SST)</option>
            <option value="Almoxarife">Luiz G. (Almoxarife)</option>
            <option value="Gestor">Gestor Geral</option>
            <option value="Colaborador">Trabalhador</option>
          </select>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-extrabold block mb-1 px-1.5">
          Módulos
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-all text-left text-[11.5px] font-medium leading-none ${
                isActive
                  ? 'bg-safety-green text-white font-semibold'
                  : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#94a3b8]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1e293b] bg-[#0f172a]/20 text-[9px] text-slate-500">
        <div className="flex justify-between items-center mb-0.5">
          <span>Sistema Interno</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-safety-green animate-pulse"></span>
        </div>
        <p className="font-mono tracking-tight text-[8px] opacity-70">MTE & legal compliance</p>
      </div>
    </aside>
  );
}
