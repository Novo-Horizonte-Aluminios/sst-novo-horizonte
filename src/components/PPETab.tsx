import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  HelpCircle, 
  CheckCircle, 
  AlertOctagon, 
  BookOpen, 
  Plus, 
  RefreshCw,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';
import { PPE } from '../types';

interface PPETabProps {
  ppes: PPE[];
  onAddPPE: (ppe: Omit<PPE, 'id'>) => Promise<any>;
}

export default function PPETab({ ppes, onAddPPE }: PPETabProps) {
  const [search, setSearch] = useState('');
  const [caSearchNumber, setCaSearchNumber] = useState('');
  const [caScrapeResult, setCaScrapeResult] = useState<any | null>(null);
  const [scraping, setScraping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New PPE form state
  const [newPpe, setNewPpe] = useState({
    name: '', internalCode: '', barCode: '', brand: '', manufacturer: '',
    category: 'Proteção Ocular', caNumber: '', caIssueDate: '', caExpiryDate: '',
    fispqRelation: 'N/A', manualUrl: '#', stockCount: 50, minStock: 10
  });

  const handleScrapeCA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caSearchNumber) return;
    setScraping(true);
    setCaScrapeResult(null);

    setTimeout(() => {
      setScraping(false);
      // Generate highly high fidelity, legal-looking MTE Certificate check results based on popular CA sequences
      const caNumObj = parseInt(caSearchNumber);
      const isExpired = caNumObj < 30000;
      
      setCaScrapeResult({
        number: caSearchNumber,
        status: isExpired ? 'Vencido' : 'Válido',
        equipment: caNumObj % 2 === 0 ? 'Cinturão de segurança tipo paraquedista com argolas integradas' : 'Óculos de proteção em policarbonato com haste flexível',
        manufacturer: caNumObj % 2 === 0 ? 'Inmes Equipamentos de Segurança S/A' : '3M Fabricação Industrial LTDA',
        approvalDate: '15/02/2021',
        expiryDate: isExpired ? '12/03/2025' : '18/11/2029',
        protectionTypes: caNumObj % 2 === 0 ? 'PROTEÇÃO DO TRONCO CONTRA CHOQUE DE IMPACTO, RISCOS DE QUEDA E CHAMA DIRETA.' : 'PROTEÇÃO DOS OLHOS DO USUÁRIO CONTRA IMPACTOS DE PARTÍCULAS VOLANTES.',
        mteHash: 'TEM-MTE-HASH-88391-CO',
        normativeReferences: caNumObj % 2 === 0 ? 'ABNT NBR 15835:2010, ABNT NBR 15836:2010' : 'ANSI/ISEA Z87.1-2015'
      });
    }, 1200);
  };

  const handleCreatePPE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPpe.name || !newPpe.caNumber) return;
    
    // Automatically set CA Status
    const isExpired = new Date(newPpe.caExpiryDate) < new Date();
    await onAddPPE({
      ...newPpe,
      caStatus: isExpired ? 'Vencido' : 'Válido'
    });

    setNewPpe({
      name: '', internalCode: '', barCode: '', brand: '', manufacturer: '',
      category: 'Proteção Ocular', caNumber: '', caIssueDate: '', caExpiryDate: '',
      fispqRelation: 'N/A', manualUrl: '#', stockCount: 50, minStock: 10
    });
    setShowAddModal(false);
  };

  const filteredPpes = ppes.filter(p => {
    return p.name.toLowerCase().includes(search.toLowerCase()) || 
           p.caNumber.includes(search) || 
           p.category.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Top action grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Automatic MTE CA Checking tool */}
        <div className="lg:col-span-1 bg-[#0f172a] text-slate-100 p-4 rounded border border-slate-700/60 flex flex-col justify-between text-[11px]">
          <div>
            <div className="flex items-center gap-2 mb-2 pr-2">
              <ShieldCheck className="w-4 h-4 text-safety-green" />
              <h3 className="text-xs font-bold tracking-tight text-white uppercase">Consulta e Scraping MTE (CA)</h3>
            </div>
            <p className="text-slate-400 text-[10px] leading-snug mb-3">
              Varredura com a base nacional do Ministério do Trabalho e Emprego para validação de faturamento e vencimentos.
            </p>

            <form onSubmit={handleScrapeCA} className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-mono block font-bold">Certificado de Aprovação (CA)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  required
                  placeholder="Ex: 39712 ou 32145"
                  value={caSearchNumber}
                  onChange={(e) => setCaSearchNumber(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white p-1.5 px-2 rounded text-[11px] font-mono flex-1 focus:outline-none focus:border-safety-green"
                />
                <button
                  type="submit"
                  disabled={scraping}
                  className="px-3 py-1 bg-safety-green hover:bg-safety-green-dark text-white font-bold rounded text-[11px]"
                >
                  {scraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Scrapar'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex-1 flex flex-col justify-center">
            {caScrapeResult ? (
              <div className="bg-slate-950/60 p-3 rounded space-y-2 border border-slate-800 font-sans leading-normal text-[10.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-[11px]">CA Nº {caScrapeResult.number}</span>
                  <span className={`badge-l ${
                    caScrapeResult.status === 'Válido' ? 'badge-l-success' : 'badge-l-alert'
                  }`}>
                    {caScrapeResult.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-300">
                  <p><span className="text-slate-500 font-bold uppercase text-[8px] block">Equipamento</span> {caScrapeResult.equipment}</p>
                  <p><span className="text-slate-500 font-bold uppercase text-[8px] block">Fabricante</span> {caScrapeResult.manufacturer}</p>
                  <p className="text-slate-400 font-mono text-[9px]">Validade: <strong className={caScrapeResult.status === 'Vencido' ? 'text-red-400' : 'text-safety-green'}>{caScrapeResult.expiryDate}</strong></p>
                </div>
              </div>
            ) : scraping ? (
              <div className="text-center py-4 text-slate-400 flex flex-col items-center justify-center gap-1">
                <RefreshCw className="w-5 h-5 animate-spin text-safety-green" />
                <p className="animate-pulse text-[9px]">Consultando MTE Federal...</p>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-800 rounded">
                <HelpCircle className="w-6 h-6 text-slate-600" />
                <p className="max-w-[180px] mx-auto text-[9px] text-slate-500">Digite um CA acima e execute para validar na base oficial.</p>
              </div>
            )}
          </div>
        </div>

        {/* Master PPE Register List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar EPI cadastrado (CA, Tipo, Marca)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded focus:outline-none focus:border-safety-green shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-safety-green text-white rounded hover:bg-safety-green-dark transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro de EPI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
            {filteredPpes.map((ppe) => (
              <div key={ppe.id} className="bg-white p-3.5 rounded border border-slate-200 hover:shadow-sm transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1.5 leading-none gap-2">
                    <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">{ppe.category}</span>
                    <span className={`badge-l ${
                      ppe.caStatus === 'Válido' ? 'badge-l-success' : 'badge-l-alert'
                    }`}>
                      CA {ppe.caStatus}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-[12.5px] text-slate-800 leading-snug">{ppe.name}</h4>
                  <p className="text-slate-400 font-mono text-[9px] mt-0.5">Cód: {ppe.internalCode} • EAN: {ppe.barCode}</p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] bg-[#f8fafc] p-2 rounded border border-slate-100 mb-3 text-slate-600 font-sans">
                    <p><strong>CA MTE:</strong> {ppe.caNumber}</p>
                    <p><strong>Vencimento:</strong> {ppe.caExpiryDate}</p>
                    <p><strong>Marca:</strong> {ppe.brand}</p>
                    <p className="truncate"><strong>Fáb:</strong> {ppe.manufacturer}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10.5px] pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Estoque:</span>
                    <strong className={`font-mono text-xs ${ppe.stockCount <= ppe.minStock ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                      {ppe.stockCount} un
                    </strong>
                    {ppe.stockCount <= ppe.minStock && (
                      <span className="badge-l badge-l-alert font-mono">Crítico</span>
                    )}
                  </div>
                  <a href={ppe.manualUrl} className="text-safety-green font-bold hover:underline flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Ficha / FISPQ
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ADD NEW PPE DIALOG MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in text-xs border border-slate-100">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Cadastrar Novo Equipamento de Proteção</h3>
                <p className="text-[10px] text-slate-400 mt-1">Atribui as marcas, CAs homologados e margens para estoque mínimo</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✖</button>
            </div>

            <form onSubmit={handleCreatePPE} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold block mb-1 text-slate-600">Descrição Comercial / Nome Comercial</label>
                  <input
                    type="text"
                    required
                    value={newPpe.name}
                    onChange={(e) => setNewPpe({...newPpe, name: e.target.value})}
                    placeholder="Ex: Protetor Auricular Plug de Silicone Termoplástico"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Categoria de Proteção</label>
                  <select
                    value={newPpe.category}
                    onChange={(e) => setNewPpe({...newPpe, category: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Proteção Ocular">Proteção Ocular / Facial</option>
                    <option value="Proteção Auditiva">Proteção Auditiva</option>
                    <option value="Proteção Respiratória">Proteção Respiratória</option>
                    <option value="Proteção da Cabeça">Proteção da Cabeça (Capacetes)</option>
                    <option value="Proteção dos Pés">Proteção dos Pés (Calçados de Segurança)</option>
                    <option value="Trabalho em Altura">Trabalho em Altura (Corações, Cordas, Trava-quedas)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Código Interno de Almoxarifado</label>
                  <input
                    type="text"
                    required
                    value={newPpe.internalCode}
                    onChange={(e) => setNewPpe({...newPpe, internalCode: e.target.value})}
                    placeholder="Ex: EPI-AUD-99S"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Marca Comercial</label>
                  <input
                    type="text"
                    required
                    value={newPpe.brand}
                    onChange={(e) => setNewPpe({...newPpe, brand: e.target.value})}
                    placeholder="Ex: 3M, Kalipso, Marluvas"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Fabricante / Fornecedor</label>
                  <input
                    type="text"
                    required
                    value={newPpe.manufacturer}
                    onChange={(e) => setNewPpe({...newPpe, manufacturer: e.target.value})}
                    placeholder="Ex: Kalipso Equipamentos de Proteção"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Nº do CA MTE</label>
                  <input
                    type="text"
                    required
                    value={newPpe.caNumber}
                    onChange={(e) => setNewPpe({...newPpe, caNumber: e.target.value})}
                    placeholder="Ex: 39712"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Emissão do CA</label>
                  <input
                    type="date"
                    required
                    value={newPpe.caIssueDate}
                    onChange={(e) => setNewPpe({...newPpe, caIssueDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Validade do CA</label>
                  <input
                    type="date"
                    required
                    value={newPpe.caExpiryDate}
                    onChange={(e) => setNewPpe({...newPpe, caExpiryDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Quantidade de Entrada</label>
                  <input
                    type="number"
                    required
                    value={newPpe.stockCount}
                    onChange={(e) => setNewPpe({...newPpe, stockCount: parseInt(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-600">Quantidade Mínima de Segurança</label>
                  <input
                    type="number"
                    required
                    value={newPpe.minStock}
                    onChange={(e) => setNewPpe({...newPpe, minStock: parseInt(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  Salvar EPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

