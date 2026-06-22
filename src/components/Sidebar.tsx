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
    { id: 'delivery', label: 'Entrega de EPI', icon: FileCheck },
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
    <aside className={`relative ${isCollapsed ? 'w-[70px]' : 'w-[240px]'} bg-surface-sidebar text-slate-600 flex flex-col h-full flex-shrink-0 border-r border-slate-200/80 font-sans antialiased select-none transition-all duration-300 ease-out shadow-sm`}>
      
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary/40 shadow-sm z-50 transition-all hover:shadow-md hover:scale-105 active:scale-95"
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`px-4 border-b border-slate-200/80 flex flex-col items-center ${isCollapsed ? 'h-[68px] justify-center' : 'py-4'} transition-all`}>
        {!isCollapsed ? (
          <>
            <div className="w-full flex justify-center">
              <img 
                src="/logo_horizontal.png" 
                alt="Novo Horizonte Alumínios" 
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const textLogo = document.getElementById('sidebar-text-logo');
                  if (textLogo) textLogo.style.display = 'block';
                }}
              />
            </div>
            <div id="sidebar-text-logo" className="hidden text-slate-800 font-extrabold text-xs tracking-tight leading-none text-center uppercase mt-1">
              <span>Novo Horizonte</span>
              <span className="text-brand-primary text-[10px] font-semibold block mt-0.5">Alumínios</span>
            </div>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-black text-sm shadow-sm">
            NH
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-2 px-3 pt-1">
            Módulos
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-150 text-left text-[12px] font-semibold leading-none ${
                isActive
                  ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-brand-primary-dark active:bg-slate-200'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-slate-200/80 bg-white/40">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-semibold text-slate-500">Sistema Seguro</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]"></span>
          </div>
          <p className="text-[8px] text-slate-400 tracking-tight">MTE & compliance legal v2.4</p>
        </div>
      )}
    </aside>
  );
}

