import { Company, Employee, PPE, PPEDelivery, Training, EmployeeTraining, AccidentReport, ActionPlan, FISPQDocument } from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Novo Horizonte Alumínios Ltda',
    tradingName: 'Novo Horizonte Alumínios',
    cnpj: '34.892.455/0001-38',
    cnae: '24.41-5-02 (Produção de alumínio e suas ligas)',
    riskDegree: 3,
    address: 'Av. das Indústrias, 4500 - Distrito Industrial, Porto Alegre - RS',
    sstResponsible: 'Eng. Roberto Santos (CREA: 8741-9)',
    rhResponsible: 'Ana Clara Lima'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: 'Carlos Henrique Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    birthDate: '1988-04-12',
    matricula: 'NHA-0982',
    companyId: 'c1',
    sector: 'Usinagem',
    role: 'Torneiro Mecânico',
    manager: 'Luiz Gonzaga',
    admissionDate: '2021-02-15',
    status: 'Ativo',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '5551988887755',
    email: 'carlos.silva@novo-horizonte.com.br'
  },
  {
    id: 'e2',
    name: 'Juliana Montenegro',
    cpf: '234.567.890-11',
    rg: '23.456.789-0',
    birthDate: '1992-09-24',
    matricula: 'NHA-1205',
    companyId: 'c1',
    sector: 'Soldagem',
    role: 'Soldadora Industrial',
    manager: 'Luiz Gonzaga',
    admissionDate: '2022-06-10',
    status: 'Ativo',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    phone: '5551977775544',
    email: 'juliana.m@novo-horizonte.com.br'
  },
  {
    id: 'e3',
    name: 'Amanda Martins Souza',
    cpf: '345.678.901-22',
    rg: '34.567.890-1',
    birthDate: '1995-11-05',
    matricula: 'NHA-4432',
    companyId: 'c1',
    sector: 'Extrusão',
    role: 'Operadora de Extrusão',
    manager: 'Eng. Gilberto Rocha',
    admissionDate: '2023-01-20',
    status: 'Ativo',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    phone: '5551966663322',
    email: 'amanda.martins@novo-horizonte.com.br'
  }
];

export const INITIAL_PPES: PPE[] = [
  {
    id: 'p1',
    name: 'Óculos de Proteção Antiembaçante Cinza',
    internalCode: 'EPI-OCT-09',
    barCode: '7891234560012',
    brand: '3M BR',
    manufacturer: '3M do Brasil Ltda',
    category: 'Proteção Ocular / Visual',
    caNumber: '39712',
    caIssueDate: '2022-10-14',
    caExpiryDate: '2027-10-14',
    caStatus: 'Válido',
    fispqRelation: 'N/A',
    manualUrl: '#',
    stockCount: 120,
    minStock: 25
  },
  {
    id: 'p2',
    name: 'Protetor Auditivo tipo Plug Copoly',
    internalCode: 'EPI-AUD-35',
    barCode: '7891234560032',
    brand: 'Kalipso',
    manufacturer: 'Kalipso Equipamentos de Proteção',
    category: 'Proteção Auditiva (Atenuação 15dB)',
    caNumber: '11512',
    caIssueDate: '2021-04-05',
    caExpiryDate: '2026-04-05',
    caStatus: 'Válido',
    fispqRelation: 'N/A',
    manualUrl: '#',
    stockCount: 300,
    minStock: 50
  },
  {
    id: 'p3',
    name: 'Calçado de Segurança com Biqueira de Aço',
    internalCode: 'EPI-CAL-02',
    barCode: '7891234560111',
    brand: 'Marluvas',
    manufacturer: 'Marluvas Equipamentos Profissionais',
    category: 'Proteção dos Pés',
    caNumber: '42316',
    caIssueDate: '2023-02-18',
    caExpiryDate: '2028-02-18',
    caStatus: 'Válido',
    fispqRelation: 'N/A',
    manualUrl: '#',
    stockCount: 8,
    minStock: 15 // Estoque Crítico!
  },
  {
    id: 'p4',
    name: 'Cinturão de Segurança tipo Paraquedista',
    internalCode: 'EPI-ALT-88',
    barCode: '7891234560205',
    brand: 'Inmes',
    manufacturer: 'Inmes Tecnologia de Altura',
    category: 'Proteção Contra Quedas (NR-35)',
    caNumber: '32145',
    caIssueDate: '2020-03-12',
    caExpiryDate: '2025-03-12',
    caStatus: 'Vencido', // CA Vencido!
    fispqRelation: 'N/A',
    manualUrl: '#',
    stockCount: 22,
    minStock: 10
  }
];

export const INITIAL_DELIVERIES: PPEDelivery[] = [
  {
    id: 'd1',
    employeeId: 'e1',
    employeeName: 'Carlos Henrique Silva',
    ppeId: 'p1',
    ppeName: 'Óculos de Proteção Antiembaçante Cinza',
    caNumber: '39712',
    quantity: 1,
    deliveryDate: '2026-05-15',
    reason: 'Entrega Inicial',
    signingMethod: 'assinatura_digital',
    signatureData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMTAgNTBTMzAgMTAgNTAgNTBTOTAgOTAgOTAgNTAiIHN0cm9rZT0iYmxhY2siIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
    status: 'Entregue'
  },
  {
    id: 'd2',
    employeeId: 'e2',
    employeeName: 'Juliana Montenegro',
    ppeId: 'p2',
    ppeName: 'Protetor Auditivo tipo Plug Copoly',
    caNumber: '11512',
    quantity: 2,
    deliveryDate: '2026-06-01',
    reason: 'Substituição',
    signingMethod: 'senha',
    signatureData: 'PIN: 9182',
    status: 'Entregue'
  }
];

export const INITIAL_TRAININGS: Training[] = [
  {
    id: 't1',
    title: 'Integração de Segurança (NR-01)',
    nr: 'NR-01',
    category: 'Introdutório',
    durationHours: 6,
    expiryMonths: 12
  },
  {
    id: 't2',
    title: 'Trabalho Seguro em Altura (NR-35)',
    nr: 'NR-35',
    category: 'Especializado',
    durationHours: 8,
    expiryMonths: 24
  },
  {
    id: 't3',
    title: 'Instalações Elétricas e Serviços com Eletricidade (NR-10)',
    nr: 'NR-10',
    category: 'Técnico',
    durationHours: 40,
    expiryMonths: 24
  }
];

export const INITIAL_EMPLOYEE_TRAININGS: EmployeeTraining[] = [
  {
    id: 'et1',
    employeeId: 'e1',
    employeeName: 'Carlos Henrique Silva',
    trainingId: 't1',
    trainingTitle: 'Integração de Segurança (NR-01)',
    nr: 'NR-01',
    issueDate: '2025-08-10',
    expiryDate: '2026-08-10',
    score: 95,
    status: 'Aprovado'
  },
  {
    id: 'et2',
    employeeId: 'e2',
    employeeName: 'Juliana Montenegro',
    trainingId: 't2',
    trainingTitle: 'Trabalho Seguro em Altura (NR-35)',
    nr: 'NR-35',
    issueDate: '2024-02-12',
    expiryDate: '2026-02-12',
    score: 88,
    status: 'Vencido' // Vencido recentemente!
  }
];

export const INITIAL_ACCIDENTS: AccidentReport[] = [
  {
    id: 'a1',
    date: '2026-05-18',
    type: 'Quase Acidente',
    reporterName: 'Carlos Henrique Silva',
    sector: 'Usinagem',
    description: 'Faísca de desbaste atingiu a proximidade da fiação elétrica sem proteção, provocando breve estalo. Necessário reforçar capota de blindagem e aterramento.',
    rootCauses5Whys: [
      'Por que houve faíscas na fiação? Porque o biombo protetor estava ausente.',
      'Por que o biombo protetor estava ausente? Porque foi retirado para manutenção da lavadora.',
      'Por que a fiação estava próxima? Porque mudaram o layout sem aval da equipe gestora SST.',
      'Por que mudaram o layout sem validação? Falha de comunicação e planejamento de projetos.',
      'Por que falhou a segurança no planejamento? Ausência de checklist preventivo de mudanças de layout.'
    ],
    ishikawa: {
      metodo: 'Falta de POP para alteração de posicionamento físico de máquinas',
      maquina: 'Ausência de carenagem rígida de proteção de faíscas na politriz',
      medida: 'Sem monitoramento de distâncias seguras de segurança',
      meioAmbiente: 'Pó suspenso propício a ignição rápida',
      maoDeObra: 'Falta de reciclagem do trabalhador em riscos de centelhas industriais',
      material: 'Cabo flexível desgastado exposto'
    },
    severity: 'Leve',
    status: 'Em Investigação'
  }
];

export const INITIAL_ACTION_PLANS: ActionPlan[] = [
  {
    id: 'ap1',
    accidentId: 'a1',
    title: 'Instalação de biombos anteparas móveis com retardante de chama',
    responsible: 'Tec. Marcos Patrício',
    deadline: '2026-06-30',
    status: 'Em Andamento'
  },
  {
    id: 'ap2',
    accidentId: 'a1',
    title: 'Reciclagem Express de NR-12 para operadores de Usinagem',
    responsible: 'Luiz Gonzaga',
    deadline: '2026-07-05',
    status: 'Pendente'
  }
];

export const INITIAL_FISPQ: FISPQDocument[] = [
  {
    id: 'f1',
    chemicalName: 'Óleo Solúvel de Corte Semissemisintético Novo Horizonte',
    manufacturer: 'Lubrificantes Ipiranga S/A',
    revisionDate: '2025-03-22',
    version: '4.2',
    ghsClassification: 'Sensibilização cutânea (Categoria 1), Toxicidade aguda (Categoria 4)'
  },
  {
    id: 'f2',
    chemicalName: 'Gás Acetileno Recompe',
    manufacturer: 'White Martins Gases Industriais',
    revisionDate: '2024-11-15',
    version: '6.0',
    ghsClassification: 'Gás inflamável (Categoria 1), Gás sob pressão'
  }
];

// Simple LMS mock questionnaires for Brazilian regulatory tests
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export const LMS_QUIZZES: Record<string, QuizQuestion[]> = {
  'NR-35': [
    {
      question: 'Considera-se trabalho em altura toda atividade executada acima de quantos metros do nível inferior, onde haja risco de queda?',
      options: ['1,0 metro', '1,5 metros', '2,0 metros', '2,5 metros'],
      correct: 2
    },
    {
      question: 'Qual das seguintes opções representa um sistema de ancoragem adequado segundo a NR-35?',
      options: [
        'Qualquer tubulação metálica de eletroduto',
        'Um ponto certificado capaz de suportar as cargas de impacto estimadas',
        'Um prego longo fixado na viga de concreto fresco',
        'Amarração em vergalhões soltos na laje'
      ],
      correct: 1
    }
  ],
  'NR-10': [
    {
      question: 'Quais trabalhadores estão autorizados a realizar intervenções em instalações elétricas?',
      options: [
        'Apenas os trabalhadores qualificados, habilitados, capacitados ou autorizados',
        'Qualquer montador experiente com luva plástica',
        'Profissionais de limpeza de canaletas',
        'Auxiliares administrativos da manutenção de fábrica'
      ],
      correct: 0
    }
  ],
  'NR-01': [
    {
      question: 'O GRO (Gerenciamento de Riscos Ocupacionais) e o PGR (Programa de Gerenciamento de Riscos) são normatizados por qual NR?',
      options: ['NR-09', 'NR-07', 'NR-01', 'NR-06'],
      correct: 2
    }
  ]
};
