export interface Company {
  id: string;
  name: string;
  tradingName: string;
  cnpj: string;
  cnae: string;
  riskDegree: number;
  address: string;
  sstResponsible: string;
  rhResponsible: string;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  matricula: string;
  companyId: string;
  sector: string;
  role: string;
  manager: string;
  admissionDate: string;
  status: 'Ativo' | 'Inativo' | 'Afastado';
  signature?: string; // Base64 signature
  photoUrl?: string;
  phone?: string;
  email?: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  requiredPPEs: string[]; // List of PPE IDs or Category IDs
  risks: string[]; // e.g. ["Ruído", "Queda de altura"]
}

export interface SectorConfig {
  id: string;
  name: string;
  processes: string[];
  risks: string[];
}

export interface PPE {
  id: string;
  name: string;
  internalCode: string;
  barCode: string;
  brand: string;
  manufacturer: string;
  category: string;
  caNumber: string;
  caIssueDate: string;
  caExpiryDate: string;
  caStatus: 'Válido' | 'Vencido' | 'Suspenso' | 'Cancelado';
  fispqRelation?: string;
  manualUrl?: string;
  stockCount: number;
  minStock: number;
}

export interface PPEDelivery {
  id: string;
  employeeId: string;
  employeeName: string;
  ppeId: string;
  ppeName: string;
  caNumber: string;
  quantity: number;
  deliveryDate: string;
  reason: 'Entrega Inicial' | 'Substituição' | 'Extravio' | 'Danificado';
  signingMethod: 'assinatura_digital' | 'biometria' | 'senha' | 'selfie';
  signatureData?: string; // base64 or PIN
  selfieUrl?: string;
  status: 'Entregue' | 'Pendente' | 'Devolvido';
}

export interface Training {
  id: string;
  title: string; // e.g. "Treinamento NR-35 Trabalho em Altura"
  nr: string; // e.g. "NR-35"
  category: string;
  durationHours: number;
  expiryMonths: number;
}

export interface EmployeeTraining {
  id: string;
  employeeId: string;
  employeeName: string;
  trainingId: string;
  trainingTitle: string;
  nr: string;
  issueDate: string;
  expiryDate: string;
  score: number;
  status: 'Aprovado' | 'Vencido' | 'Pendente';
}

export interface AccidentReport {
  id: string;
  date: string;
  type: 'Acidente' | 'Quase Acidente' | 'Desvio';
  reporterName: string;
  sector: string;
  description: string;
  rootCauses5Whys: string[]; // 5 steps
  ishikawa: {
    metodo: string;
    maquina: string;
    medida: string;
    meioAmbiente: string;
    maoDeObra: string;
    material: string;
  };
  severity: 'Leve' | 'Moderado' | 'Grave' | 'Fatal';
  status: 'Registrado' | 'Em Investigação' | 'Concluído';
}

export interface ActionPlan {
  id: string;
  accidentId?: string;
  title: string;
  responsible: string;
  deadline: string;
  status: 'Pendente' | 'Em Andamento' | 'Verificando' | 'Concluído';
  evidence?: string;
}

export interface FISPQDocument {
  id: string;
  chemicalName: string;
  manufacturer: string;
  revisionDate: string;
  version: string;
  ghsClassification: string;
}
