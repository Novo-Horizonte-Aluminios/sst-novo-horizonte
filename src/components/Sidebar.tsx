import React, { useState } from 'react';
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
  Radar,
  ClipboardCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Geral', icon: LayoutDashboard },
    { id: 'companies', label: 'Cadastro da Equipe', icon: Users },
    { id: 'delivery', label: 'Entrega (Ficha NR-06)', icon: FileCheck },
    { id: 'stock', label: 'Estoque Inteligente', icon: Package },
    { id: 'ppes', label: 'Garantia de EPI (CAs)', icon: Shield },
    { id: 'trainings', label: 'Treinamentos LMS', icon: GraduationCap },
    { id: 'incidents', label: 'Análise de Acidentes', icon: ShieldAlert },
    { id: 'inspections', label: 'Inspeções e Checklists', icon: ClipboardCheck },
    { id: 'documents', label: 'Gestão Documental', icon: BookOpen },
    { id: 'reports', label: 'Central de Relatórios', icon: ScrollText },
    { id: 'ai', label: 'Especialista IA SST', icon: Sparkles },
    { id: 'fispq', label: 'SDS / FISPQ Químicos', icon: Flame },
    { id: 'whatsapp_alerts', label: 'Alertas WhatsApp', icon: MessageCircle },
    { id: 'risk_map', label: 'Mapa de Riscos por Imagem', icon: Radar },
    { id: 'backup', label: 'Backup & Segurança', icon: Database },
    ...(userRole === 'Admin' ? [{ id: 'users', label: 'Usuários do Sistema', icon: Users }] : [])
  ];

  return (
    <aside className={`relative ${isCollapsed ? 'w-[70px]' : 'w-[240px]'} bg-[#f0f4f8] text-slate-600 flex flex-col h-full flex-shrink-0 border-r border-slate-200 font-sans antialiased select-none transition-all duration-300 shadow-sm`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-safety-green hover:border-safety-green shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className={`p-4 border-b border-slate-200 flex flex-col items-center ${isCollapsed ? 'h-[72px] justify-center' : ''} transition-all`}>
        {!isCollapsed ? (
          <>
            <div className="w-full flex justify-center py-1">
              <img 
                src="/logo_horizontal.png" 
                alt="Novo Horizonte Alumínios" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const textLogo = document.getElementById('sidebar-text-logo');
                  if (textLogo) textLogo.style.display = 'block';
                }}
              />
            </div>
            <div id="sidebar-text-logo" className="hidden text-slate-800 font-extrabold text-xs tracking-tight leading-none text-center uppercase">
              <span>Novo Horizonte</span>
              <span className="text-safety-green text-[10px] font-semibold block mt-0.5">Alumínios</span>
            </div>
          </>
        ) : (
          <div className="w-8 h-8 rounded bg-safety-green flex items-center justify-center text-white font-black text-xs">
            NH
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">
            Módulos Principais
          </span>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-lg transition-all text-left text-[12px] font-semibold leading-none ${
                isActive
                  ? 'bg-safety-green text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-safety-green-dark'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200 bg-white/50 text-[10px] text-slate-500">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-slate-600">Sistema Seguro</span>
            <span className="inline-block w-2 h-2 rounded-full bg-safety-green animate-pulse shadow-[0_0_5px_rgba(37,99,235,0.5)]"></span>
          </div>
          <p className="tracking-tight text-[9px] opacity-80">MTE & compliance legal v2.4</p>
        </div>
      )}
    </aside>
  );
}

