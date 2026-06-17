import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Company, Employee, PPE, PPEDelivery, EmployeeTraining, AccidentReport, ActionPlan } from '../types';

export interface BulkExportOptions {
  companies: Company[];
  employees: Employee[];
  ppes: PPE[];
  deliveries: PPEDelivery[];
  employeeTrainings: EmployeeTraining[];
  accidents: AccidentReport[];
  actionPlans: ActionPlan[];
  activeCompanyId: string;
  selectedSectors: string[]; // Empty means all sectors
  startDate: string; // YYYY-MM-DD, empty means no limit
  endDate: string; // YYYY-MM-DD, empty means no limit
  selectedReports: {
    dashboard: boolean;
    deliveries: boolean;
    trainings: boolean;
    accidents: boolean;
  };
  formats: {
    pdf: boolean;
    csv: boolean;
  };
}

/**
 * Filter the dataset, construct the requested PDF and CSV/XLSX assets, and wrap them in a compressed ZIP file.
 */
export async function generateBulkZip(options: BulkExportOptions): Promise<Blob> {
  const zip = new JSZip();
  const currentCompany = options.companies.find(c => c.id === options.activeCompanyId);
  const activeCompanyName = currentCompany ? currentCompany.tradingName : "Diretoria Geral";

  // 1. Filter employees in current company + selected sectors
  const companyEmployees = options.employees.filter(e => e.companyId === options.activeCompanyId);
  const filteredEmployees = companyEmployees.filter(e => {
    return options.selectedSectors.length === 0 || options.selectedSectors.includes(e.sector);
  });
  const filteredEmployeeIds = filteredEmployees.map(e => e.id);

  // 2. Filter Deliveries
  const filteredDeliveries = options.deliveries.filter(d => {
    const isOfSelectedEmployee = filteredEmployeeIds.includes(d.employeeId);
    const matchesDate = (!options.startDate || d.deliveryDate >= options.startDate) &&
                        (!options.endDate || d.deliveryDate <= options.endDate);
    return isOfSelectedEmployee && matchesDate;
  });

  // 3. Filter Trainings
  const filteredTrainings = options.employeeTrainings.filter(t => {
    const isOfSelectedEmployee = filteredEmployeeIds.includes(t.employeeId);
    const matchesDate = (!options.startDate || t.issueDate >= options.startDate) &&
                        (!options.endDate || t.issueDate <= options.endDate);
    return isOfSelectedEmployee && matchesDate;
  });

  // 4. Filter Accidents / Incidents
  const filteredAccidents = options.accidents.filter(a => {
    const matchesSector = options.selectedSectors.length === 0 || options.selectedSectors.includes(a.sector);
    const matchesDate = (!options.startDate || a.date >= options.startDate) &&
                        (!options.endDate || a.date <= options.endDate);
    return matchesSector && matchesDate;
  });

  // UTF-8 BOM so Excel opens PT-BR characters seamlessly
  const BOM = "\uFEFF";

  // --- GENERATING REPORTS ---

  // Report 1: Dashboard / Indicadores
  if (options.selectedReports.dashboard) {
    if (options.formats.pdf) {
      const doc = buildDashboardPDF(
        filteredEmployees,
        options.ppes,
        filteredDeliveries,
        filteredTrainings,
        activeCompanyName,
        options.selectedSectors,
        options.startDate,
        options.endDate
      );
      const pdfBuffer = doc.output('arraybuffer');
      zip.file("1_Relatorio_Indicadores_Desempenho_SST.pdf", pdfBuffer);
    }
    if (options.formats.csv) {
      const data = [
        { "Métrica": "Total de Colaboradores Filtrados", "Valor": filteredEmployees.length },
        { "Métrica": "EPIs Fornecidos no Período", "Valor": filteredDeliveries.length },
        { "Métrica": "Treinamentos Concluídos", "Valor": filteredTrainings.filter(t => t.status === 'Aprovado').length },
        { "Métrica": "Alertas de Cursos Vencidos", "Valor": filteredTrainings.filter(t => t.status === 'Vencido').length },
        { "Métrica": "Sinistros e Desvios Mapeados", "Valor": filteredAccidents.length },
        { "Métrica": "Selo de Escopo", "Valor": options.selectedSectors.length === 0 ? "Todos os Setores" : options.selectedSectors.join(", ") }
      ];
      const sheet = XLSX.utils.json_to_sheet(data);
      const csvString = BOM + XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
      zip.file("1_Relatorio_Indicadores_Desempenho_SST.csv", csvString);
    }
  }

  // Report 2: PPE Deliveries / NR-06
  if (options.selectedReports.deliveries) {
    if (options.formats.pdf) {
      const doc = buildDeliveriesPDF(filteredDeliveries, filteredEmployees, activeCompanyName, options.selectedSectors, options.startDate, options.endDate);
      const pdfBuffer = doc.output('arraybuffer');
      zip.file("2_Laudo_Entregas_PPE_NR06.pdf", pdfBuffer);
    }
    if (options.formats.csv) {
      const data = filteredDeliveries.map(d => {
        const emp = filteredEmployees.find(e => e.id === d.employeeId);
        return {
          "ID Lançamento": d.id,
          "Nome do Colaborador": d.employeeName,
          "Matrícula": emp ? emp.matricula : "N/A",
          "Setor": emp ? emp.sector : "N/A",
          "Cargo": emp ? emp.role : "N/A",
          "Equipamento (EPI)": d.ppeName,
          "Certificado MTE (CA)": d.caNumber,
          "Quantidade": d.quantity,
          "Data do Recebimento": d.deliveryDate,
          "Motivo": d.reason,
          "Assinatura Regulamentar": d.signingMethod === 'assinatura_digital' 
            ? 'Assinado na Tela' 
            : d.signingMethod === 'senha' 
            ? 'Código PIN' 
            : 'Ficha Tradicional',
          "Status Final": d.status
        };
      });
      const sheet = XLSX.utils.json_to_sheet(data);
      const csvString = BOM + XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
      zip.file("2_Laudo_Entregas_PPE_NR06.csv", csvString);
    }
  }

  // Report 3: NRs Trainings / Certifications
  if (options.selectedReports.trainings) {
    if (options.formats.pdf) {
      const doc = buildTrainingsPDF(filteredTrainings, filteredEmployees, activeCompanyName, options.selectedSectors, options.startDate, options.endDate);
      const pdfBuffer = doc.output('arraybuffer');
      zip.file("3_Certificacoes_Treinamentos_NRs.pdf", pdfBuffer);
    }
    if (options.formats.csv) {
      const data = filteredTrainings.map(t => {
        const emp = filteredEmployees.find(e => e.id === t.employeeId);
        return {
          "Prontuário ID": t.id,
          "Colaborador": t.employeeName,
          "Matrícula": emp ? emp.matricula : "N/A",
          "Setor": emp ? emp.sector : "N/A",
          "Treinamento Legal": t.trainingTitle,
          "Norma (MTE)": t.nr,
          "Data de Conclusão": t.issueDate,
          "Prazo Reciclagem": t.expiryDate,
          "Exame de Avaliação (%)": t.score,
          "Estado de Validade": t.status
        };
      });
      const sheet = XLSX.utils.json_to_sheet(data);
      const csvString = BOM + XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
      zip.file("3_Certificacoes_Treinamentos_NRs.csv", csvString);
    }
  }

  // Report 4: Incident Analysis / CAT
  if (options.selectedReports.accidents) {
    if (options.formats.pdf) {
      const doc = buildAccidentsPDF(filteredAccidents, options.actionPlans, activeCompanyName, options.selectedSectors, options.startDate, options.endDate);
      const pdfBuffer = doc.output('arraybuffer');
      zip.file("4_Sinistros_Investigacoes_Desvios.pdf", pdfBuffer);
    }
    if (options.formats.csv) {
      const data = filteredAccidents.map(a => {
        const actions = options.actionPlans.filter(p => p.accidentId === a.id);
        const actionStr = actions.map(ac => `[${ac.status}] ${ac.title} (Resp: ${ac.responsible})`).join(" | ");
        return {
          "Caso ID": a.id,
          "Data da Ocorrência": a.date,
          "Classificação": a.type,
          "Técnico Relator": a.reporterName,
          "Setor Ocorrido": a.sector,
          "Descrição dos Fatos": a.description,
          "Nível Severidade": a.severity,
          "Status Investigação": a.status,
          "Célula Ishikawa Método": a.ishikawa?.metodo || "N/A",
          "Célula Ishikawa Máquina": a.ishikawa?.maquina || "N/A",
          "Célula Ishikawa Mão de Obra": a.ishikawa?.maoDeObra || "N/A",
          "Planos de Ação (PDCA)": actionStr || "Nenhum plano associado"
        };
      });
      const sheet = XLSX.utils.json_to_sheet(data);
      const csvString = BOM + XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
      zip.file("4_Sinistros_Investigacoes_Desvios.csv", csvString);
    }
  }

  // Generate the actual .zip output blob
  return await zip.generateAsync({ type: "blob" });
}

// --- HELPER PDF GRAPHICS IMPLEMENTATIONS WITH DESKTOP-CLASS HIGH CONTRAST MATTE PRESETS ---

function drawCommonHeader(doc: jsPDF, title: string, activeCompanyName: string, sectors: string[], start: string, end: string) {
  const primaryColor = "#0F172A"; 
  const accentColor = "#15803D"; 
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text("NOVO HORIZONTE ALUMÍNIOS LTDA", 14, 18);
  
  doc.setFontSize(8);
  doc.setTextColor(accentColor);
  doc.text("CENTRAL DE MONITORAMENTO INTEGRADO DE COMPLIANCE SST (NR-01, NR-06 & NR-35)", 14, 23);
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 25, 196, 25);

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#1E293B");
  doc.setFontSize(8.5);
  doc.text(`Unidade Principal: ${activeCompanyName}`, 14, 31);
  
  const sectorStr = sectors.length === 0 ? "Todos os Setores" : sectors.join(", ");
  doc.text(`Escopo/Setores: ${sectorStr}`, 14, 35);
  
  const dateStr = (start || end) 
    ? `Período: ${start ? new Date(start + "T12:00:00").toLocaleDateString('pt-BR') : 'Início'} até ${end ? new Date(end + "T12:00:00").toLocaleDateString('pt-BR') : 'Fim'}`
    : "Período: Todo o histórico disponível";
  doc.text(dateStr, 14, 39);

  doc.text(`Data Impressão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 130, 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor);
  doc.text(title.toUpperCase(), 14, 47);

  doc.line(14, 50, 196, 50);
}

function buildDashboardPDF(
  employees: Employee[],
  ppes: PPE[],
  deliveries: PPEDelivery[],
  trainings: EmployeeTraining[],
  activeCompanyName: string,
  sectors: string[],
  start: string,
  end: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCommonHeader(doc, "Dossiê Compactado de Indicadores de Conformidade", activeCompanyName, sectors, start, end);

  let currentY = 56;

  // Overview info text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#334155");
  doc.text("Resumo gerencial contendo o nível de conformidade, estoque regulatório básico e as exigências cumpridas para os parâmetros de sst filtrados:", 14, currentY);
  
  currentY += 6;

  // KPI boxes (Bento grids)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, currentY, 56, 22, "FD");
  doc.rect(74, currentY, 56, 22, "FD");
  doc.rect(134, currentY, 56, 22, "FD");

  // Box 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor("#64748B");
  doc.text("EMPREGADOS FILTRADOS", 16, currentY + 5);
  doc.setFontSize(13);
  doc.setTextColor("#0F172A");
  doc.text(`${employees.length} Ativos`, 16, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor("#475569");
  doc.text("Controle fiscal regular", 16, currentY + 18);

  // Box 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor("#64748B");
  doc.text("ENTREGAS DE EPI REGULARES", 76, currentY + 5);
  doc.setFontSize(13);
  doc.setTextColor("#15803D");
  doc.text(`${deliveries.length} Registros`, 76, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor("#475569");
  doc.text("Fichas válidas no eSocial", 76, currentY + 18);

  // Box 3
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor("#64748B");
  doc.text("TREINAMENTOS E CERTIFICADOS", 136, currentY + 5);
  const okTrainings = trainings.filter(t => t.status === 'Aprovado').length;
  doc.setFontSize(13);
  doc.setTextColor("#1D4ED8");
  doc.text(`${okTrainings}/${trainings.length} Válidos`, 136, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor("#475569");
  doc.text("Conformidade NR-35 e NR-10", 136, currentY + 18);

  currentY += 28;

  // Let's print out the list of employees scope
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor("#0F172A");
  doc.text("1. Relatório Nominal de Colaboradores Vinculados", 14, currentY);

  currentY += 4;
  
  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 6.5, "FD");
  doc.setFontSize(7.5);
  doc.text("Matrícula", 16, currentY + 4.5);
  doc.text("Nome do Trabalhador", 38, currentY + 4.5);
  doc.text("CPF", 90, currentY + 4.5);
  doc.text("Setor", 124, currentY + 4.5);
  doc.text("Cargo do Trabalhador", 158, currentY + 4.5);

  currentY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor("#1E293B");

  employees.slice(0, 25).forEach(e => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(e.matricula || "N/A", 16, currentY + 4.5);
    const shortName = e.name.length > 28 ? e.name.slice(0, 26) + "..." : e.name;
    doc.text(shortName, 38, currentY + 4.5);
    doc.text(e.cpf || "N/A", 90, currentY + 4.5);
    doc.text(e.sector || "N/A", 124, currentY + 4.5);
    const shortRole = e.role.length > 20 ? e.role.slice(0, 18) + "..." : e.role;
    doc.text(shortRole, 158, currentY + 4.5);
    
    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 6.2, 196, currentY + 6.2);
    currentY += 6.2;
  });

  if (employees.length > 25) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(`... e mais ${employees.length - 25} colaboradores listados no arquivo CSV correspondente.`, 14, currentY + 4.5);
  }

  return doc;
}

function buildDeliveriesPDF(
  deliveries: PPEDelivery[],
  employees: Employee[],
  activeCompanyName: string,
  sectors: string[],
  start: string,
  end: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCommonHeader(doc, "Dossiê com Histórico de Entregas de EPI (NR-06)", activeCompanyName, sectors, start, end);

  let currentY = 56;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 6.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#0F172A");
  doc.text("ID Prontuário", 16, currentY + 4.5);
  doc.text("Trabalhador", 38, currentY + 4.5);
  doc.text("EPI", 82, currentY + 4.5);
  doc.text("CA MTE", 128, currentY + 4.5);
  doc.text("Data Entrega", 148, currentY + 4.5);
  doc.text("Assinatura", 172, currentY + 4.5);

  currentY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#1E293B");

  deliveries.forEach(d => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;

      // Header row
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 6.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.text("ID Prontuário", 16, currentY + 4.5);
      doc.text("Trabalhador", 38, currentY + 4.5);
      doc.text("EPI", 82, currentY + 4.5);
      doc.text("CA MTE", 128, currentY + 4.5);
      doc.text("Data Entrega", 148, currentY + 4.5);
      doc.text("Assinatura", 172, currentY + 4.5);
      currentY += 6.5;
      doc.setFont("helvetica", "normal");
    }

    doc.text(d.id, 16, currentY + 4.5);
    const shortName = d.employeeName.length > 21 ? d.employeeName.slice(0, 19) + "..." : d.employeeName;
    doc.text(shortName, 38, currentY + 4.5);
    const shortPpe = d.ppeName.length > 23 ? d.ppeName.slice(0, 21) + "..." : d.ppeName;
    doc.text(shortPpe, 82, currentY + 4.5);
    doc.text(d.caNumber || "Isento", 128, currentY + 4.5);
    doc.text(d.deliveryDate, 148, currentY + 4.5);
    doc.text(d.signingMethod === 'senha' ? "PIN" : d.signingMethod === 'assinatura_digital' ? "Digital" : "Biometria", 172, currentY + 4.5);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 6, 196, currentY + 6);
    currentY += 6;
  });

  return doc;
}

function buildTrainingsPDF(
  trainings: EmployeeTraining[],
  employees: Employee[],
  activeCompanyName: string,
  sectors: string[],
  start: string,
  end: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCommonHeader(doc, "Registro de Treinamentos Regulamentares (NRs)", activeCompanyName, sectors, start, end);

  let currentY = 56;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 6.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#0F172A");
  doc.text("Trabalhador", 16, currentY + 4.5);
  doc.text("Curso Operacional", 66, currentY + 4.5);
  doc.text("NR", 116, currentY + 4.5);
  doc.text("Data Realização", 128, currentY + 4.5);
  doc.text("Próxima Reciclagem", 154, currentY + 4.5);
  doc.text("Validade", 182, currentY + 4.5);

  currentY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#1E293B");

  trainings.forEach(t => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 6.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.text("Trabalhador", 16, currentY + 4.5);
      doc.text("Curso Operacional", 66, currentY + 4.5);
      doc.text("NR", 116, currentY + 4.5);
      doc.text("Data Realização", 128, currentY + 4.5);
      doc.text("Próxima Reciclagem", 154, currentY + 4.5);
      doc.text("Validade", 182, currentY + 4.5);
      currentY += 6.5;
      doc.setFont("helvetica", "normal");
    }

    const shortName = t.employeeName.length > 25 ? t.employeeName.slice(0, 23) + "..." : t.employeeName;
    doc.text(shortName, 16, currentY + 4.5);
    const shortTitle = t.trainingTitle.length > 25 ? t.trainingTitle.slice(0, 23) + "..." : t.trainingTitle;
    doc.text(shortTitle, 66, currentY + 4.5);
    doc.text(t.nr || "N/A", 116, currentY + 4.5);
    doc.text(t.issueDate, 128, currentY + 4.5);
    doc.text(t.expiryDate, 154, currentY + 4.5);
    
    doc.setFont("helvetica", "bold");
    if (t.status === 'Vencido') {
      doc.setTextColor("#EF4444");
    } else {
      doc.setTextColor("#15803D");
    }
    doc.text(t.status === 'Aprovado' ? "VÁLIDO" : "EXPIRADO", 182, currentY + 4.5);
    doc.setTextColor("#1E293B");
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 6, 196, currentY + 6);
    currentY += 6;
  });

  return doc;
}

function buildAccidentsPDF(
  accidents: AccidentReport[],
  actionPlans: ActionPlan[],
  activeCompanyName: string,
  sectors: string[],
  start: string,
  end: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCommonHeader(doc, "Registro de Sinistros, Desvios e Planos de Ação", activeCompanyName, sectors, start, end);

  let currentY = 56;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 6.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor("#0F172A");
  doc.text("ID Caso", 16, currentY + 4.5);
  doc.text("Data", 30, currentY + 4.5);
  doc.text("Tipo", 48, currentY + 4.5);
  doc.text("Setor", 74, currentY + 4.5);
  doc.text("Descrição Ocorrência", 102, currentY + 4.5);
  doc.text("Severidade", 152, currentY + 4.5);
  doc.text("Investigação", 172, currentY + 4.5);

  currentY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#1E293B");

  accidents.forEach(a => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 6.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.text("ID Caso", 16, currentY + 4.5);
      doc.text("Data", 30, currentY + 4.5);
      doc.text("Tipo", 48, currentY + 4.5);
      doc.text("Setor", 74, currentY + 4.5);
      doc.text("Descrição Ocorrência", 102, currentY + 4.5);
      doc.text("Severidade", 152, currentY + 4.5);
      doc.text("Investigação", 172, currentY + 4.5);
      currentY += 6.5;
      doc.setFont("helvetica", "normal");
    }

    doc.text(a.id, 16, currentY + 4.5);
    doc.text(a.date, 30, currentY + 4.5);
    doc.text(a.type, 48, currentY + 4.5);
    doc.text(a.sector, 74, currentY + 4.5);
    const shortDesc = a.description.length > 32 ? a.description.slice(0, 30) + "..." : a.description;
    doc.text(shortDesc, 102, currentY + 4.5);
    doc.text(a.severity, 152, currentY + 4.5);
    doc.text(a.status, 172, currentY + 4.5);

    // List any related PDCA corrective actions underneath the incident
    const relatedPlans = actionPlans.filter(p => p.accidentId === a.id);
    if (relatedPlans.length > 0) {
      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor("#1D4ED8");
      
      let pStr = "Planos PDCA Ativados: ";
      relatedPlans.forEach((p, pIdx) => {
        pStr += `[${p.status}] ${p.title} (Resp: ${p.responsible})` + (pIdx < relatedPlans.length - 1 ? " | " : "");
      });
      
      const wrappedText = doc.splitTextToSize(pStr, 170);
      doc.text(wrappedText, 20, currentY + 3);
      currentY += (wrappedText.length * 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor("#1E293B");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 5.5, 196, currentY + 5.5);
    currentY += 5.5;
  });

  return doc;
}
