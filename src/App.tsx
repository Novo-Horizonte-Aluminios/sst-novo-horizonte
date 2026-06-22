import React, { useState, useEffect } from 'react';
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

import { Company, Employee, PPE, PPEDelivery, EmployeeTraining, AccidentReport, ActionPlan, FISPQDocument, Training } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('sst_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState('c1');

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

  const [loading, setLoading] = useState(true);

  // Fetch initial datasets
  useEffect(() => {
    async function initFetch() {
      try {
        const [
          resCos, resEmps, resPpes, resDels, resTrain, resCerts, resAccs, resPlans, resFis
        ] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/employees'),
          fetch('/api/ppes'),
          fetch('/api/deliveries'),
          fetch('/api/trainings'),
          fetch('/api/employee-trainings'),
          fetch('/api/accidents'),
          fetch('/api/action-plans'),
          fetch('/api/fispq')
        ]);

        const [
          cos, emps, ppesData, dels, train, certs, accs, plans, fisData
        ] = await Promise.all([
          resCos.json(),
          resEmps.json(),
          resPpes.json(),
          resDels.json(),
          resTrain.json(),
          resCerts.json(),
          resAccs.json(),
          resPlans.json(),
          resFis.json()
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
      } catch (err) {
        console.error('Error fetching dynamic database elements:', err);
      } finally {
        setLoading(false);
      }
    }
    initFetch();
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
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp)
      });
      const data = await res.json();
      setEmployees(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.error(e);
    }
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

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  return (
    <div className="flex h-screen bg-surface-page overflow-hidden font-sans antialiased text-slate-800">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
        userRole={userRole}
        companies={companies}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <header className="h-[72px] bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-[9px] font-bold tracking-[0.15em] text-brand-primary uppercase leading-relaxed">
                Painel de Gestão SST
              </h2>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Olá, {currentUser.name.split(' ')[0]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {currentUser.role}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 hover:text-rose-600 rounded-full text-[11px] font-bold text-slate-600 transition-all shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 border-[3px] border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">Carregando Sistema SST</p>
                <p className="text-[11px] text-slate-400 mt-1">Sincronizando módulos operacionais...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  trainings={employeeTrainings}
                  activeCompanyId={selectedCompanyId}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsTab 
                  companies={companies}
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  employeeTrainings={employeeTrainings}
                  accidents={accidents}
                  actionPlans={actionPlans}
                  fispqDocs={fispqDocs}
                  activeCompanyId={selectedCompanyId}
                />
              )}

              {activeTab === 'companies' && (
                <CompanyWorkerTab 
                  companies={companies}
                  employees={employees}
                  activeCompanyId={selectedCompanyId}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onUpdateCompany={handleUpdateCompany}
                />
              )}

              {activeTab === 'ppes' && (
                <PPETab 
                  ppes={ppes}
                  onAddPPE={handleAddPPE}
                />
              )}

              {activeTab === 'stock' && (
                <StockTab 
                  ppes={ppes}
                  onAdjustStock={handleAdjustStock}
                  onReplenishUnderstocked={handleReplenishUnderstocked}
                />
              )}

              {activeTab === 'delivery' && (
                <DeliveryTab 
                  companies={companies}
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  activeCompanyId={selectedCompanyId}
                  onAddDelivery={handleAddDelivery}
                />
              )}

              {activeTab === 'trainings' && (
                <TrainingTab 
                  employees={employees}
                  trainings={trainings}
                  employeeTrainings={employeeTrainings}
                  activeCompanyId={selectedCompanyId}
                  onAddCertification={handleAddCertification}
                />
              )}

              {activeTab === 'incidents' && (
                <IncidentTab 
                  accidents={accidents}
                  actionPlans={actionPlans}
                  onAddAccident={handleAddAccident}
                  onAddActionPlan={handleAddActionPlan}
                  onUpdateActionPlan={handleUpdateActionPlan}
                />
              )}

              {activeTab === 'inspections' && (
                <InspectionTab />
              )}

              {activeTab === 'documents' && (
                <DocumentsTab />
              )}

              {activeTab === 'fispq' && (
                <FispqTab 
                  fispqDocs={fispqDocs}
                />
              )}

              {activeTab === 'whatsapp_alerts' && (
                <WhatsAppTab 
                  employees={employees}
                  ppes={ppes}
                  deliveries={deliveries}
                  employeeTrainings={employeeTrainings}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'ai' && (
                <AIChatTab />
              )}

              {activeTab === 'risk_map' && (
                <RiskMapTab />
              )}

              {activeTab === 'backup' && (
                <BackupTab />
              )}

              {activeTab === 'users' && currentUser.role === 'Admin' && (
                <UsersTab currentUser={currentUser} />
              )}


            </>
          )}
        </main>

      </div>
    </div>
  );
}
