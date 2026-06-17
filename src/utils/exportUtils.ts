import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Employee, PPE, PPEDelivery, Company } from '../types';

/**
 * Exports a detailed log of PPE Deliveries to a PT-BR configured Excel spreadsheet (.xlsx)
 */
export function exportDeliveriesToExcel(deliveries: PPEDelivery[], employees: Employee[], activeCompanyName: string) {
  const formatted = deliveries.map((d, index) => {
    const emp = employees.find(e => e.id === d.employeeId);
    return {
      "Ref. SST": d.id,
      "Funcionário": d.employeeName || (emp ? emp.name : "N/A"),
      "CPF do Trabalhador": emp ? emp.cpf : "N/A",
      "Matrícula": emp ? emp.matricula : "N/A",
      "Cargo": emp ? emp.role : "N/A",
      "Setor": emp ? emp.sector : "N/A",
      "Equipamento (EPI)": d.ppeName,
      "Número do CA": d.caNumber,
      "Quantidade": d.quantity,
      "Data da Entrega": d.deliveryDate,
      "Motivo do Fornecimento": d.reason,
      "Autenticação Regulamentar": d.signingMethod === 'assinatura_digital' 
        ? 'Assinatura Digital em Tela' 
        : d.signingMethod === 'biometria' 
        ? 'Scanner Biométrico' 
        : d.signingMethod === 'senha' 
        ? 'PIN Criptografado' 
        : 'Selfie Anexa (Reconhecimento)',
      "Status legal": d.status
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fichas_de_Entrega_EPI");

  // Adjust column widths visually
  const maxProps = ["Ref. SST", "Funcionário", "CPF do Trabalhador", "Matrícula", "Cargo", "Setor", "Equipamento (EPI)", "Número do CA", "Quantidade", "Data da Entrega", "Motivo do Fornecimento", "Autenticação Regulamentar", "Status legal"];
  const wscols = maxProps.map(p => ({ wch: p.length + 8 }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Relatorio_Entrega_EPI_${activeCompanyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Creates and downloads a detailed, auditable PDF booklet of PPE hand-outs matching Portaria MTE standards.
 */
export function exportDeliveriesToPDF(deliveries: PPEDelivery[], employees: Employee[], activeCompanyName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = "#0F172A"; // Slate-900
  const secondaryColor = "#15803D"; // Green-700
  const darkTextColor = "#1E293B"; // Slate-800
  const softThemeBackground = [248, 250, 252]; // Slate-50

  // 1. Page Header Frame
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text("NOVO HORIZONTE ALUMÍNIOS LTDA", 14, 18);
  
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor);
  doc.text("SISTEMA DE CONTROLE DE COMPLIANCE SST (NR-06 e eSocial S-2240)", 14, 23);
  
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 26, 196, 26);

  // Metadata information block
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkTextColor);
  doc.setFontSize(9.5);
  doc.text(`Unidade Operacional: ${activeCompanyName}`, 14, 33);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 38);
  doc.text(`Total de registros: ${deliveries.length} entregas de EPI conferidas`, 14, 43);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text("LAUDO GERAL DE ENTREGAS FILTRADO POR UNIDADE FISCAL", 14, 52);

  // Table Headers
  let currentY = 58;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.3);
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 7.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor);
  doc.text("Fis. Prontuário", 16, currentY + 5);
  doc.text("Trabalhador", 38, currentY + 5);
  doc.text("Equipamento (EPI)", 85, currentY + 5);
  doc.text("CA MTE", 132, currentY + 5);
  doc.text("Data", 152, currentY + 5);
  doc.text("Método", 172, currentY + 5);

  currentY += 7.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkTextColor);

  deliveries.forEach((d, i) => {
    // Multi-page automatic wrap helper
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;

      // Repeat condensed headers
      doc.setFont("helvetica", "bold");
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 7.5, "FD");
      doc.setTextColor(primaryColor);
      doc.text("Fis. Prontuário", 16, currentY + 5);
      doc.text("Trabalhador", 38, currentY + 5);
      doc.text("Equipamento (EPI)", 85, currentY + 5);
      doc.text("CA MTE", 132, currentY + 5);
      doc.text("Data", 152, currentY + 5);
      doc.text("Método", 172, currentY + 5);
      currentY += 7.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkTextColor);
    }

    const emp = employees.find(e => e.id === d.employeeId);
    const workerName = d.employeeName || (emp ? emp.name : "N/A");
    const docId = d.id;

    // Slice names if too long
    const shortName = workerName.length > 24 ? workerName.slice(0, 22) + "..." : workerName;
    const shortPpe = d.ppeName.length > 25 ? d.ppeName.slice(0, 23) + "..." : d.ppeName;

    doc.setFontSize(7.5);
    doc.text(docId, 16, currentY + 5);
    doc.text(shortName, 38, currentY + 5);
    doc.text(shortPpe, 85, currentY + 5);
    doc.text(d.caNumber || "N/A", 132, currentY + 5);
    doc.text(d.deliveryDate || "", 152, currentY + 5);
    doc.text(d.signingMethod === 'senha' ? "PIN" : d.signingMethod === 'biometria' ? "Biometria" : d.signingMethod === 'selfie' ? "Selfie" : "Digital", 172, currentY + 5);

    // Light line division
    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 7, 196, currentY + 7);
    currentY += 7.5;
  });

  // Stamp and signatures area
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor);
  doc.text("AUTENTICIDADE E RESPONSABILIDADE CIVIL CORPORATIVA (NR-01)", 14, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor);
  doc.text("As coletas de assinaturas demonstradas acima estão amparadas juridicamente pela Portaria SIT/MTE n.º 107 para fins de auditoria do trabalho.", 14, currentY + 4);
  doc.text("O fornecimento correto do EPI resguarda a empresa de sinistros civis, previdenciários e multas fiscais imediatas no eSocial.", 14, currentY + 7.5);

  currentY += 28;
  doc.setLineWidth(0.25);
  doc.setDrawColor(primaryColor);
  doc.line(14, currentY, 90, currentY);
  doc.line(110, currentY, 186, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SESMT Novo Horizonte Alumínios", 14, currentY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Dr. Marcos Patrício - Coordenador-Geral", 14, currentY + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Gerenciamento de Riscos Empresariais", 110, currentY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text("Ana Clara Lima - Gestora de RH e Ativos", 110, currentY + 8);

  doc.save(`Central_SST_Laudo_Entrega_EPI_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exports complete Dashboard state indicators into a high-quality multi-tab Excel spreadsheet.
 */
export function exportDashboardToExcel(
  employees: Employee[],
  ppes: PPE[],
  deliveries: PPEDelivery[],
  trainings: any[],
  deliveryHistory: any[],
  accidentHistory: any[],
  activeCompanyName: string
) {
  const workbook = XLSX.utils.book_new();

  // Tab 1: Resumo Executivo Geral (KPIs)
  const activeEmps = employees.filter(e => e.status === 'Ativo');
  const expiredCAsCount = ppes.filter(p => p.caStatus !== 'Válido').length;
  const criticalStockCount = ppes.filter(p => p.stockCount <= p.minStock).length;
  const expiredTrainingsCount = trainings.filter(t => t.status === 'Vencido').length;

  const summaryData = [
    { "Indicador": "Unidade Selecionada", "Valor": activeCompanyName, "Unidade / Referência": "Cadastro Geral Novo Horizonte" },
    { "Indicador": "Colaboradores Ativos com Registro", "Valor": activeEmps.length, "Unidade / Referência": "Pessoas físicas logadas" },
    { "Indicador": "Equipamentos Registrados (Tipos)", "Valor": ppes.length, "Unidade / Referência": "Itens de Estoque" },
    { "Indicador": "CAs com Prazo de MTE Vencido", "Valor": expiredCAsCount, "Unidade / Referência": "Risco de Multa eSocial S-2240" },
    { "Indicador": "EPIs no Limiar Crítico de Estoque", "Valor": criticalStockCount, "Unidade / Referência": "Sinalizadores de Compra Urgentes" },
    { "Indicador": "Certificações de Treinamento Expiradas", "Valor": expiredTrainingsCount, "Unidade / Referência": "Análise NR-12/NR-35 Ativa" },
    { "Indicador": "Histórico Fiscal Processado", "Valor": deliveries.length, "Unidade / Referência": "Fichas emitidas e assinadas" },
    { "Indicador": "Classificação Geral de Riscos MTE", "Valor": "Grau 3 (Produção de Alumínio)", "Unidade / Referência": "Conforme CNAE 24.41-5-02" }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Resumo_Executivo");

  // Tab 2: Histórico de Entregas Mensais (Evolução Mês a Mês)
  const deliveryFormatted = deliveryHistory.map(h => ({
    "Mês": h.name,
    "Taxa de Adesão Registrada (%)": h['Entregas Concluídas'],
    "Meta de Segurança eSocial (%)": h['Meta de Segurança'],
    "Status de Conformidade": h['Entregas Concluídas'] >= h['Meta de Segurança'] ? "CONFORME" : "ALERTA SESMT"
  }));

  const wsDeliveryHistory = XLSX.utils.json_to_sheet(deliveryFormatted);
  XLSX.utils.book_append_sheet(workbook, wsDeliveryHistory, "Ecolucao_Entregas");

  // Tab 3: Registro de Desvios (Quase Acidentes e Graves)
  const accidentFormatted = accidentHistory.map(a => ({
    "Mês": a.name,
    "Quase Acidentes registrados": a['Quase Acidentes'],
    "Acidentes Graves sob CAT": a['Acidentes Graves'],
    "Severidade Geral das Infrações": a['Acidentes Graves'] > 0 ? "SEVERO" : "NENHUM DANO SEVERO"
  }));

  const wsAccidentHistory = XLSX.utils.json_to_sheet(accidentFormatted);
  XLSX.utils.book_append_sheet(workbook, wsAccidentHistory, "Registro_de_Desvios");

  // Output file
  XLSX.writeFile(workbook, `SST_Indicadores_Completos_${activeCompanyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Creates and downloads a concise summary PDF of the system indicators (Executive Dossier).
 */
export function exportDashboardToPDF(
  employees: Employee[],
  ppes: PPE[],
  deliveries: PPEDelivery[],
  trainings: any[],
  deliveryHistory: any[],
  accidentHistory: any[],
  activeCompanyName: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primary = "#0F172A";
  const greenHighlight = "#15803D";
  const textDark = "#1E293B";

  // PDF Banner Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primary);
  doc.text("NOVO HORIZONTE ALUMÍNIOS LTDA", 14, 18);
  
  doc.setFontSize(8.5);
  doc.setTextColor(greenHighlight);
  doc.text("CENTRAL DO MONITOR DE SEGURANÇA E HIGIENE DO TRABALHO", 14, 23);
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 26, 196, 26);

  // General KPIs and unit metrics
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark);
  doc.setFontSize(9);
  doc.text(`Unidade: ${activeCompanyName}`, 14, 33);
  doc.text(`CNAE: 24.41-5-02 (Produção de alumínio) | Grau de Risco: G3 (Grau 3 - NR-04)`, 14, 38);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 43);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primary);
  doc.text("DOSSIÊ EXECUTIVO DE INDICADORES DE CONFORMIDADE SST", 14, 53);

  // Visual Bento layout of indices
  doc.setFontSize(10);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 57, 56, 25, "FD");
  doc.rect(74, 57, 56, 25, "FD");
  doc.rect(134, 57, 56, 25, "FD");

  // KPI Inside Card 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#64748B");
  doc.text("SST COMPLIANCE RATE", 16, 62);
  doc.setFontSize(14);
  doc.setTextColor(greenHighlight);
  doc.text("97.2%", 16, 72);
  doc.setFontSize(7);
  doc.setTextColor(textDark);
  doc.text("Adesão NR-06 auditada", 16, 78);

  // KPI Inside Card 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#64748B");
  doc.text("ALERTA DE CA VENCIDO", 76, 62);
  const overdueCAs = ppes.filter(p => p.caStatus !== 'Válido').length;
  doc.setFontSize(14);
  doc.setTextColor(overdueCAs > 0 ? "#EF4444" : greenHighlight);
  doc.text(String(overdueCAs), 76, 72);
  doc.setFontSize(7);
  doc.setTextColor(textDark);
  doc.text("EPI com CA vencido no MTE", 76, 78);

  // KPI Inside Card 3
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#64748B");
  doc.text("TREINAMENTOS EXPIRADOS", 136, 62);
  const overdueTrainings = trainings.filter(t => t.status === 'Vencido').length;
  doc.setFontSize(14);
  doc.setTextColor(overdueTrainings > 0 ? "#F59E0B" : greenHighlight);
  doc.text(String(overdueTrainings), 136, 72);
  doc.setFontSize(7);
  doc.setTextColor(textDark);
  doc.text("Inscrição de reciclagem pendente", 136, 78);

  // Chronology charts summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primary);
  doc.text("1. EVOLUÇÃO DAS REVISÕES E FISCALIZAÇÃO MENSAL (ENTREGAS)", 14, 93);

  // Small table 1
  let y = 97;
  doc.setLineWidth(0.2);
  doc.setDrawColor(primary);
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 176, 6.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("MÊS DE APURAÇÃO", 16, y + 4.5);
  doc.text("TAXA DE ADESÃO INDIVIDUAL (%)", 65, y + 4.5);
  doc.text("META MANDATÓRIA (%)", 125, y + 4.5);
  doc.text("AVALIAÇÃO GERAL", 165, y + 4.5);

  y += 6.5;
  doc.setFont("helvetica", "normal");
  deliveryHistory.forEach((item, idx) => {
    doc.text(item.name || "", 16, y + 4.5);
    doc.text(`${item['Entregas Concluídas']}%`, 65, y + 4.5);
    doc.text(`${item['Meta de Segurança']}%`, 125, y + 4.5);
    doc.setFont("helvetica", "bold");
    const safe = item['Entregas Concluídas'] >= item['Meta de Segurança'];
    doc.setTextColor(safe ? greenHighlight : "#EF4444");
    doc.text(safe ? "CONFORME" : "ALERTA", 165, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textDark);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6.5, 190, y + 6.5);
    y += 6.5;
  });

  // Accidents summary
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primary);
  doc.text("2. REGISTRO DE INFRAÇÕES, FALHAS E DESVIOS OPERACIONAIS (RISCO)", 14, y);

  // Table 2
  y += 4;
  doc.setDrawColor(primary);
  doc.rect(14, y, 176, 6.5, "FD");
  doc.text("MÊS DE INFORME", 16, y + 4.5);
  doc.text("DESVIOS E QUASE ACIDENTES", 65, y + 4.5);
  doc.text("ACIDENTES CRÍTICOS (CAT)", 125, y + 4.5);
  doc.text("CLASSIFICAÇÃO DO MEIO", 165, y + 4.5);

  y += 6.5;
  doc.setFont("helvetica", "normal");
  accidentHistory.forEach((item, idx) => {
    doc.text(item.name || "", 16, y + 4.5);
    doc.text(String(item['Quase Acidentes'] || 0), 65, y + 4.5);
    doc.text(String(item['Acidentes Graves'] || 0), 125, y + 4.5);
    
    doc.setFont("helvetica", "bold");
    const warning = (item['Acidentes Graves'] || 0) > 0;
    doc.setTextColor(warning ? "#EF4444" : greenHighlight);
    doc.text(warning ? "PREOCUPANTE" : "MÍNIMO", 165, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textDark);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6.5, 190, y + 6.5);
    y += 6.5;
  });

  // Stamp and legal disclaimer
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(greenHighlight);
  doc.text("NÍVEL DE AUDITORIA INTERNA GARANTIDO", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Este dossiê serve como prova administrativa de zelo ambiental-patronal para afastar responsabilidade objetiva em inquéritos civis.", 14, y + 4);
  doc.text("Os dados integrados são processados eletronicamente e refletem em tempo real as coletas biométricas e de PIN no almoxarifado.", 14, y + 7.5);

  y += 25;
  doc.setDrawColor(primary);
  doc.line(14, y, 90, y);
  doc.line(110, y, 186, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SESMT Gestão de Engenharia", 14, y + 4);
  doc.text("Dr. Marcos Patrício", 14, y + 7.5);

  doc.text("Fiscalização Jurídica Interna", 110, y + 4);
  doc.text("Drª Roberta Martins (Auditora)", 110, y + 7.5);

  doc.save(`Central_SST_Indicadores_Completos_{${new Date().toISOString().slice(0, 10)}.pdf`);
}
