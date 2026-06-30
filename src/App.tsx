import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import DashboardTab from './components/DashboardTab.tsx';
import CompanyWorkerTab from './components/CompanyWorkerTab.tsx';
import PPETab from './components/PPETab.tsx';
import StockTab from './components/StockTab.tsx';
import DeliveryTab from './components/DeliveryTab.tsx';
import TrainingTab from './components/TrainingTab.tsx';
import IncidentTab from './components/IncidentTab.tsx';
import InspectionTab from './components/InspectionTab.tsx';
import DocumentsTab from './components/DocumentsTab.tsx';
import FispqTab from './components/FispqTab.tsx';
import WhatsAppTab from './components/WhatsAppTab.tsx';
import AIChatTab from './components/AIChatTab.tsx';
import ReportsTab from './components/ReportsTab.tsx';
import BackupTab from './components/BackupTab.tsx';
import RiskMapTab from './components/RiskMapTab.tsx';
import Login from './components/Login.tsx';
import UsersTab from './components/UsersTab.tsx';
import AsoCertificatesTab from './components/AsoCertificatesTab.tsx';
import AsoExamTypesTab from './components/AsoExamTypesTab.tsx';
import CipaElectionTab from './components/CipaElectionTab.tsx';
import EpiEntryTab from './components/EpiEntryTab.tsx';
import EpiReturnTab from './components/EpiReturnTab.tsx';
import PsychosocialTab from './components/PsychosocialTab.tsx';
import CipaPublicVote from './components/CipaPublicVote.tsx';
import EpiPublicConfirm from './components/EpiPublicConfirm.tsx';

import { Company, Employee, PPE, PPEDelivery, EmployeeTraining, AccidentReport, ActionPlan, FISPQDocument, Training } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('sst_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState('c1');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sst_dark_mode');
    return saved === 'true';
  });

  // Efeito para sincronizar a classe .dark no HTML para suporte global a CSS dark variables
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sst_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const userRole = currentUser?.role || 'SST';

  const handleLoginSuccess = (user: { id: string; username: string; name: string; role: string }) => {
    setCurrentUser(user);
    localStorage.setItem('sst_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sst_current_user');
    setActiveTab('dashboard');
  };

  // Unified global data state synchronizing with server REST API
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [ppes, setPpes] = useState<PPE[]>([]);
  const [deliveries, setDeliveries] = useState<PPEDelivery[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTraining[]>([]);
  const [accidents, setAccidents] = useState<AccidentReport[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [fispqDocs, setFispqDocs] = useState<FISPQDocument[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch initial datasets
  useEffect(() => {
    async function initFetch() {
      try {
        const [
          resCos, resEmps, resPpes, resDels, resTrain, resCerts, resAccs, resPlans, resFis, resNotifs
        ] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/employees'),
          fetch('/api/ppes'),
          fetch('/api/deliveries'),
          fetch('/api/trainings'),
          fetch('/api/employee-trainings'),
          fetch('/api/accidents'),
          fetch('/api/action-plans'),
          fetch('/api/fispq'),
          fetch('/api/notifications')
        ]);

        const [
          cos, emps, ppesData, dels, train, certs, accs, plans, fisData, notifs
        ] = await Promise.all([
          resCos.json(),
          resEmps.json(),
          resPpes.json(),
          resDels.json(),
          resTrain.json(),
          resCerts.json(),
          resAccs.json(),
          resPlans.json(),
          resFis.json(),
          resNotifs.json()
        ]);

        setCompanies(cos);
        setEmployees(emps);
        setPpes(ppesData);
        setDeliveries(dels);
        setTrainings(train);
        setEmployeeTrainings(certs);
        setAccidents(accs);
        setActionPlans(plans);
        setFispqDocs(fisData);
        setSystemNotifications(notifs);
      } catch (err) {
        console.error('Error fetching dynamic database elements:', err);
      } finally {
        setLoading(false);
      }
    }
    initFetch();

    // Poll notifications every 10 seconds to detect real-time confirmations
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setSystemNotifications(data);
        }
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Creation callback handlers writing to Express backend
  const handleAddCompany = async (newCo: Omit<Company, 'id'>) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCo)
      });
      const data = await res.json();
      setCompanies(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCompany = async (id: string, updatedCo: Partial<Company>) => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCo)
      });
      const data = await res.json();
      setCompanies(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao cadastrar colaborador.');
    }
    setEmployees(prev => [...prev, data]);
    return data;
  };


  const handleUpdateEmployee = async (id: string, updatedEmp: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEmp)
      });
      const data = await res.json();
      setEmployees(prev => prev.map(e => e.id === id ? data : e));
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPPE = async (newPpe: Omit<PPE, 'id'>) => {
    try {
      const res = await fetch('/api/ppes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPpe)
      });
      const data = await res.json();
      setPpes(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePPE = async (id: string, updatedPpe: Partial<PPE>) => {
    try {
      const res = await fetch(`/api/ppes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPpe)
      });
      const data = await res.json();
      setPpes(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePPE = async (id: string) => {
    try {
      const res = await fetch(`/api/ppes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPpes(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDelivery = async (newDel: Omit<PPEDelivery, 'id' | 'deliveryDate' | 'status'>) => {
    try {
      const payloadWithTechnician = {
        ...newDel,
        technicianName: currentUser?.name || 'SESMT'
      };
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithTechnician)
      });
      const data = await res.json();
      setDeliveries(prev => [...prev, data]);
      
      // Sync local stock counts as well after delivery decrementer
      const resPpes = await fetch('/api/ppes');
      const updatedPpes = await resPpes.json();
      setPpes(updatedPpes);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCertification = async (newCert: Omit<EmployeeTraining, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/employee-trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCert)
      });
      const data = await res.json();
      setEmployeeTrainings(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAccident = async (newAcc: Omit<AccidentReport, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/accidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      });
      const data = await res.json();
      setAccidents(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddActionPlan = async (newPlan: Omit<ActionPlan, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      const data = await res.json();
      setActionPlans(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateActionPlan = async (id: string, updatedFields: Partial<ActionPlan>) => {
    try {
      const res = await fetch(`/api/action-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      setActionPlans(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjustStock = async (ppeId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/ppes/${ppeId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockCount: quantity })
      });
      if (res.ok) {
        const data = await res.json();
        setPpes(prev => prev.map(p => p.id === ppeId ? data : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplenishUnderstocked = async () => {
    try {
      const res = await fetch('/api/ppes/replenish-understocked', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setPpes(data.allPpes);
        return data;
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Intercept Public Links before login check
  const params = new URLSearchParams(window.location.search);
  const isCipaTab = params.get('tab') === 'cipa';
  const cipaToken = params.get('token');
  const isEpiConfirmTab = params.get('tab') === 'epi-confirm';
  const epiConfirmToken = params.get('token');

  if (isCipaTab && cipaToken) {
    return <CipaPublicVote token={cipaToken} />;
  }

  if (isEpiConfirmTab && epiConfirmToken) {
    return <EpiPublicConfirm token={epiConfirmToken} />;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Component rendering mapping
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  trainings={employeeTrainings}
                  activeCompanyId={selectedCompanyId}
                  onNavigate={(tab) => setActiveTab(tab)}
                />;
      case 'reports':
        return <ReportsTab 
                  companies={companies}
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  employeeTrainings={employeeTrainings}
                  accidents={accidents}
                  actionPlans={actionPlans}
                  fispqDocs={fispqDocs}
                  activeCompanyId={selectedCompanyId}
                />;
      case 'companies':
        return <CompanyWorkerTab 
                  companies={companies}
                  employees={employees}
                  activeCompanyId={selectedCompanyId}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onUpdateCompany={handleUpdateCompany}
                />;
      case 'ppes':
        return <PPETab 
                  ppes={ppes}
                  onAddPPE={handleAddPPE}
                  onUpdatePPE={handleUpdatePPE}
                  onDeletePPE={handleDeletePPE}
                />;
      case 'stock':
        return <StockTab 
                  ppes={ppes}
                  onAdjustStock={handleAdjustStock}
                  onReplenishUnderstocked={handleReplenishUnderstocked}
                />;
      case 'delivery':
        return <DeliveryTab 
                  companies={companies}
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  activeCompanyId={selectedCompanyId}
                  onAddDelivery={handleAddDelivery}
                />;
      case 'trainings':
        return <TrainingTab 
                  employees={employees}
                  trainings={trainings}
                  employeeTrainings={employeeTrainings}
                  activeCompanyId={selectedCompanyId}
                  onAddCertification={handleAddCertification}
                />;
      case 'incidents':
        return <IncidentTab 
                  accidents={accidents}
                  actionPlans={actionPlans}
                  onAddAccident={handleAddAccident}
                  onAddActionPlan={handleAddActionPlan}
                  onUpdateActionPlan={handleUpdateActionPlan}
                />;
      case 'inspections':
        return <InspectionTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'fispq':
        return <FispqTab fispqDocs={fispqDocs} />;
      case 'whatsapp_alerts':
        return <WhatsAppTab 
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  employeeTrainings={employeeTrainings}
                  onNavigate={(tab) => setActiveTab(tab)}
                  userRole={userRole}
                />;
      case 'ai':
        return <AIChatTab />;
      case 'risk_map':
        return <RiskMapTab />;
      case 'backup':
        return <BackupTab />;
      case 'aso_certificates':
        return <AsoCertificatesTab />;
      case 'aso_exam_types':
        return <AsoExamTypesTab />;
      case 'cipa_election':
        return <CipaElectionTab />;
      case 'epi_entry':
        return <EpiEntryTab />;
      case 'epi_return':
        return <EpiReturnTab />;
      case 'nr01_psychosocial':
        return <PsychosocialTab />;
      case 'users':
        return currentUser.role === 'Admin' ? <UsersTab currentUser={currentUser} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-surface-page overflow-hidden font-sans antialiased text-slate-800 dark:text-slate-100 dark:text-slate-100 selection:bg-brand-primary selection:text-white">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
        userRole={userRole}
        companies={companies}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <header className="h-[72px] bg-white dark:bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 dark:border-slate-800 px-8 flex justify-between items-center shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-[9px] font-black tracking-[0.18em] text-brand-primary dark:text-brand-primary uppercase leading-relaxed">
                Painel de Gestão SST
              </h2>
              <h1 className="text-[1.35rem] font-black text-slate-900 dark:text-white dark:text-white tracking-tight leading-tight">
                Olá, {currentUser.name.split(' ')[0]}
              </h1>
            </div>

          </div>

          <div className="flex items-center gap-4">
            
            {/* Global Notifications Bell */}
            <div className="relative">
              <button 
                onClick={async () => {
                  const nextShow = !showNotifications;
                  setShowNotifications(nextShow);
                  if (nextShow) {
                    // Mark as read when opening dropdown
                    try {
                      await fetch('/api/notifications/mark-read', { method: 'POST' });
                      setSystemNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    } catch (e) {}
                  }
                }}
                className="relative p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-primary/10 text-slate-500 dark:text-slate-400 hover:text-brand-primary rounded-xl transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
              >
                <Bell className="w-5 h-5" />
                {systemNotifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                      <h3 className="font-black text-[13px] text-slate-800 dark:text-slate-100 uppercase tracking-tight">Notificações</h3>
                      {systemNotifications.filter(n => !n.isRead).length > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {systemNotifications.filter(n => !n.isRead).length} Nova(s)
                        </span>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {systemNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-mono italic text-[11px]">
                          Nenhuma notificação registrada.
                        </div>
                      ) : (
                        systemNotifications.map((notif) => {
                          const dateObj = new Date(notif.createdAt);
                          const timeString = isNaN(dateObj.getTime()) ? "agora" : dateObj.toLocaleDateString("pt-BR") + " " + dateObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={notif.id} className={"p-4 border-b border-slate-50 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors cursor-pointer group " + (!notif.isRead ? "bg-amber-500/5 dark:bg-amber-500/5" : "")}>
                              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-primary transition-colors flex items-center gap-1.5">
                                {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0"></span>}
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.description}</p>
                              <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 block">{timeString}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
              title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 hover:border-rose-200 hover:text-rose-600 rounded-xl text-[12px] font-black text-slate-600 dark:text-slate-300 transition-all shadow-sm cursor-pointer hover:shadow-md active:scale-95 uppercase tracking-wide"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 min-h-0 relative z-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 bg-brand-primary/5 blur-xl rounded-full"></div>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-black text-slate-700 dark:text-slate-200">Carregando Sistema SST</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Sincronizando módulos e banco de dados...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

      </div>
    </div>
  );
}
