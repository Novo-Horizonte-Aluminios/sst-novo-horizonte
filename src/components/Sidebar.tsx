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
  MessageCircle,
  Database,
  Radar,
  ClipboardCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  RefreshCw,
  BrainCircuit
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

  const menuGroups = [
    {
      group: 'Geral',
      items: [
        { id: 'dashboard', label: 'Monitor Geral', icon: LayoutDashboard },
        { id: 'companies', label: 'Cadastro da Equipe', icon: Users }
      ]
    },
    {
      group: 'ASO',
      items: [
        { id: 'aso_certificates', label: 'Atestado de Saúde Ocupacional', icon: Heart },
        { id: 'aso_exam_types', label: 'Tipo de Exames Complementares', icon: FileCheck }
      ]
    },
    {
      group: 'CIPA-A',
      items: [
        { id: 'cipa_election', label: 'Eleição', icon: GraduationCap }
      ]
    },
    {
      group: 'EPI',
      items: [
        { id: 'epi_entry', label: "Entrada de EPI's", icon: Package },
        { id: 'delivery', label: "Entrega de EPI's", icon: FileCheck },
        { id: 'epi_return', label: "Devolução de EPI's", icon: RefreshCw },
        { id: 'ppes', label: "Cadastro de EPI's", icon: Shield }
      ]
    },
    {
      group: 'NR-01',
      items: [
        { id: 'nr01_psychosocial', label: 'NR-01: Risco Psicossocial', icon: BrainCircuit }
      ]
    },
    {
      group: 'Outros Módulos',
      items: [
        { id: 'stock', label: 'Estoque Inteligente', icon: Package },
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
      ]
    }
  ];

  return (
    <aside className={`relative ${isCollapsed ? 'w-[70px]' : 'w-[250px]'} bg-slate-50 text-slate-700 flex flex-col h-full flex-shrink-0 border-r border-slate-200/80 font-sans antialiased select-none transition-all duration-300 ease-out shadow-sm`}>
      
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600/40 shadow-sm z-50 transition-all hover:shadow-md hover:scale-105 active:scale-95"
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
              <span className="text-emerald-600 text-[10px] font-semibold block mt-0.5">Alumínios</span>
            </div>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            NH
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto overflow-x-hidden">
        {menuGroups.map((group) => {
          if (isCollapsed) {
            return group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-emerald-700'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                </button>
              );
            });
          }

          return (
            <div key={group.group} className="space-y-1">
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block px-3">
                {group.group}
              </span>
              <div className="space-y-0.5 pl-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 text-left text-[12px] font-semibold leading-none ${
                        isActive
                          ? 'bg-emerald-100/70 text-emerald-800 border-l-4 border-emerald-600 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-200/50 hover:text-emerald-700'
                      }`}
                    >
                      <span className="text-emerald-500 font-black text-sm leading-none">•</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
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
