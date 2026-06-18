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
  companies: any[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedCompanyId,
  setSelectedCompanyId,
  userRole,
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
    { id: 'backup', label: 'Backup & Segurança', icon: Database },
    ...(userRole === 'Admin' ? [{ id: 'users', label: 'Usuários do Sistema', icon: Users }] : [])
  ];

  return (
    <aside className="w-[220px] bg-[#0f172a] text-[#94a3b8] flex flex-col h-full flex-shrink-0 border-r border-[#1e293b] font-sans antialiased select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1e293b] flex flex-col items-center">
        <div className="w-full flex justify-center py-1">
          <img 
            src="/logo_horizontal.png" 
            alt="Novo Horizonte Alumínios" 
            className="h-10 w-auto object-contain filter brightness-0 invert"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const textLogo = document.getElementById('sidebar-text-logo');
              if (textLogo) textLogo.style.display = 'block';
            }}
          />
        </div>
        <div id="sidebar-text-logo" className="hidden text-white font-extrabold text-xs tracking-tight leading-none text-center uppercase">
          <span>Novo Horizonte</span>
          <span className="text-safety-green text-[10px] font-semibold block">Alumínios</span>
        </div>
        <div className="text-[8px] uppercase tracking-widest text-[#94a3b8]/40 mt-2 font-mono font-black text-center w-full">
          SST Interno
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
