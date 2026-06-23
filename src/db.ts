import { Pool } from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Configuração do pool de conexões com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL desabilitado: banco PostgreSQL do Coolify não suporta SSL (rede interna Docker)
  ssl: false
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Verificando/Criando tabelas no PostgreSQL...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trading_name VARCHAR(255),
        cnpj VARCHAR(50) NOT NULL,
        address TEXT,
        cnae VARCHAR(50),
        risk_degree INTEGER,
        sst_responsible VARCHAR(255),
        rh_responsible VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cpf VARCHAR(50) NOT NULL,
        rg VARCHAR(50),
        birth_date DATE,
        matricula VARCHAR(50),
        company_id VARCHAR(50),
        sector VARCHAR(100),
        role VARCHAR(100),
        manager VARCHAR(255),
        admission_date DATE,
        status VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        signature TEXT,
        photo_url TEXT,
        biometric_template TEXT,
        biometric_finger VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS ppes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ca VARCHAR(50),
        validity_date DATE,
        stock INTEGER,
        min_stock INTEGER,
        description TEXT,
        internal_code VARCHAR(50),
        bar_code VARCHAR(50),
        brand VARCHAR(255),
        manufacturer VARCHAR(255),
        category VARCHAR(100),
        ca_number VARCHAR(50),
        ca_issue_date DATE,
        ca_expiry_date DATE,
        ca_status VARCHAR(50),
        fispq_relation VARCHAR(255),
        manual_url TEXT
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id VARCHAR(50) PRIMARY KEY,
        delivery_date DATE,
        status VARCHAR(50),
        ppe_id VARCHAR(50),
        employee_id VARCHAR(50),
        quantity INTEGER,
        employee_name VARCHAR(255),
        ppe_name VARCHAR(255),
        ca_number VARCHAR(50),
        reason VARCHAR(100),
        signing_method VARCHAR(100),
        signature_data TEXT,
        selfie_url TEXT
      );

      CREATE TABLE IF NOT EXISTS trainings (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        nr VARCHAR(50),
        validity_months INTEGER,
        title VARCHAR(255),
        category VARCHAR(100),
        duration_hours INTEGER,
        expiry_months INTEGER
      );

      CREATE TABLE IF NOT EXISTS employee_trainings (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50),
        training_id VARCHAR(50),
        status VARCHAR(50),
        employee_name VARCHAR(255),
        training_title VARCHAR(255),
        nr VARCHAR(50),
        issue_date DATE,
        expiry_date DATE,
        score NUMERIC
      );

      CREATE TABLE IF NOT EXISTS accidents (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(50),
        description TEXT,
        date DATE,
        type VARCHAR(50),
        reporter_name VARCHAR(255),
        sector VARCHAR(100),
        severity VARCHAR(50),
        root_causes_5whys TEXT,
        ishikawa TEXT
      );

      CREATE TABLE IF NOT EXISTS action_plans (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(50),
        title VARCHAR(255),
        responsible VARCHAR(255),
        deadline DATE,
        accident_id VARCHAR(50),
        evidence TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Executar migrações para tabelas existentes
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae VARCHAR(50);
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS risk_degree INTEGER;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS sst_responsible VARCHAR(255);
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS rh_responsible VARCHAR(255);

      ALTER TABLE employees ADD COLUMN IF NOT EXISTS signature TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_template TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_finger VARCHAR(100);

      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS internal_code VARCHAR(50);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS bar_code VARCHAR(50);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS ca_number VARCHAR(50);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS ca_issue_date DATE;
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS ca_expiry_date DATE;
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS ca_status VARCHAR(50);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS fispq_relation VARCHAR(255);
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS manual_url TEXT;
      ALTER TABLE ppes ADD COLUMN IF NOT EXISTS durability_days INTEGER DEFAULT 90;

      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ppe_name VARCHAR(255);
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ca_number VARCHAR(50);
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS reason VARCHAR(100);
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS signing_method VARCHAR(100);
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS signature_data TEXT;
      ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS selfie_url TEXT;

      ALTER TABLE trainings ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      ALTER TABLE trainings ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE trainings ADD COLUMN IF NOT EXISTS duration_hours INTEGER;
      ALTER TABLE trainings ADD COLUMN IF NOT EXISTS expiry_months INTEGER;

      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS training_title VARCHAR(255);
      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS nr VARCHAR(50);
      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS issue_date DATE;
      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS expiry_date DATE;
      ALTER TABLE employee_trainings ADD COLUMN IF NOT EXISTS score NUMERIC;

      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS date DATE;
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS type VARCHAR(50);
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255);
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS severity VARCHAR(50);
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS root_causes_5whys TEXT;
      ALTER TABLE accidents ADD COLUMN IF NOT EXISTS ishikawa TEXT;

      ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS accident_id VARCHAR(50);
      ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS evidence TEXT;

      CREATE TABLE IF NOT EXISTS fispq_docs (
        id VARCHAR(50) PRIMARY KEY,
        chemical_name VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        revision_date DATE,
        version VARCHAR(50),
        ghs_classification TEXT,
        cas_number VARCHAR(100),
        physical_state VARCHAR(100),
        risk_phrases TEXT,
        epc_measures TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sectors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        processes TEXT,
        risks TEXT,
        company_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_roles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sector_id VARCHAR(50),
        risks TEXT,
        required_ppes TEXT,
        company_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS epi_matrix (
        id VARCHAR(50) PRIMARY KEY,
        role_id VARCHAR(50),
        role_name VARCHAR(255),
        ppe_id VARCHAR(50),
        ppe_name VARCHAR(255),
        is_mandatory BOOLEAN DEFAULT true,
        justification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inspections (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        sector VARCHAR(100),
        responsible VARCHAR(255),
        scheduled_date DATE,
        completed_date DATE,
        status VARCHAR(50) DEFAULT 'Agendada',
        observations TEXT,
        score NUMERIC,
        nc_count INTEGER DEFAULT 0,
        company_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inspection_items (
        id VARCHAR(50) PRIMARY KEY,
        inspection_id VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        nr_reference VARCHAR(100),
        result VARCHAR(50),
        observation TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents_sst (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        document_number VARCHAR(100),
        responsible VARCHAR(255),
        elaboration_date DATE,
        revision_date DATE,
        expiry_date DATE,
        validity_months INTEGER,
        status VARCHAR(50) DEFAULT 'Vigente',
        file_url TEXT,
        description TEXT,
        nr_references TEXT,
        company_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50),
        employee_name VARCHAR(255),
        alert_type VARCHAR(100),
        detail TEXT,
        phone VARCHAR(50),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50),
        message TEXT,
        error_detail TEXT
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS aso_certificates (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        next_exam_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        doctor_name VARCHAR(255),
        doctor_crm VARCHAR(50),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS aso_exam_types (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        periodicity_months INTEGER DEFAULT 12,
        company_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cipa_candidates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sector VARCHAR(100) NOT NULL,
        votes INTEGER DEFAULT 0,
        is_elected BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS epi_stock_entries (
        id VARCHAR(50) PRIMARY KEY,
        ppe_id VARCHAR(50) NOT NULL,
        ppe_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        supplier VARCHAR(255),
        invoice_number VARCHAR(100),
        entry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS epi_returns (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        ppe_id VARCHAR(50) NOT NULL,
        ppe_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        reason VARCHAR(255),
        return_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS psychosocial_assessments (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        assessment_date DATE NOT NULL,
        evaluator VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cipa_voters (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        employee_name VARCHAR(255) NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verificar e criar usuários iniciais se não existirem
    const userCheck = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (userCheck.rows.length === 0) {
      console.log('Criando usuários padrão no PostgreSQL...');
      const adminHash = crypto.createHash('sha256').update('admin123').digest('hex');
      const marcosHash = crypto.createHash('sha256').update('sst123').digest('hex');
      
      await client.query(`
        INSERT INTO users (id, username, password_hash, name, role) VALUES 
        ('u_admin', 'admin', $1, 'Administrador Principal', 'Admin'),
        ('u_marcos', 'marcos', $2, 'Dr. Marcos Patrício', 'SST')
      `, [adminHash, marcosHash]);
    }

    // Seeder para Empresas
    const companyCheck = await client.query("SELECT id FROM companies");
    if (companyCheck.rows.length === 0) {
      console.log('Semeando empresas iniciais...');
      await client.query(`
        INSERT INTO companies (id, name, trading_name, cnpj, address, cnae, risk_degree, sst_responsible, rh_responsible) VALUES
        ('c1', 'Novo Horizonte Alumínios LTDA', 'Fábrica - Novo Horizonte Alumínios', '12.345.678/0001-99', 'Av. Industrial, 1500 - Distrito Industrial', '24.41-5', 3, 'Dr. Marcos Patrício (SST)', 'Aline Souza (RH)')
      `);
    }

    // Seeder para EPIs
    const ppeCheck = await client.query("SELECT id FROM ppes");
    if (ppeCheck.rows.length === 0) {
      console.log('Semeando EPIs iniciais...');
      await client.query(`
        INSERT INTO ppes (id, name, ca, validity_date, stock, min_stock, description, internal_code, bar_code, brand, manufacturer, category, ca_number, ca_issue_date, ca_expiry_date, ca_status, fispq_relation, manual_url, durability_days) VALUES
        ('ppe1', 'Protetor Auricular Plug de Silicone', '39712', '2029-11-18', 120, 20, 'Protetor auditivo de silicone antialérgico', 'EPI-AUD-01', '7891011121314', '3M', '3M do Brasil', 'Proteção Auditiva', '39712', '2021-02-15', '2029-11-18', 'Válido', 'N/A', '#', 30),
        ('ppe2', 'Óculos de Segurança Fumê', '32145', '2029-12-05', 85, 15, 'Óculos de proteção em policarbonato com haste flexível', 'EPI-VIS-02', '7891011121321', 'Kalipso', 'Kalipso Indústria', 'Proteção Ocular', '32145', '2021-05-10', '2029-12-05', 'Válido', 'N/A', '#', 180),
        ('ppe3', 'Luva de Vaqueta Cano Curto', '28932', '2024-03-12', 8, 10, 'Luva de proteção em couro de vaqueta macio', 'EPI-MAN-03', '7891011121338', 'Marluvas', 'Marluvas Calçados', 'Proteção dos Pés', '28932', '2019-03-12', '2024-03-12', 'Vencido', 'N/A', '#', 90)
      `);
    }

    // Seeder para Treinamentos
    const trainingCheck = await client.query("SELECT id FROM trainings");
    if (trainingCheck.rows.length === 0) {
      console.log('Semeando treinamentos iniciais...');
      await client.query(`
        INSERT INTO trainings (id, name, nr, validity_months, title, category, duration_hours, expiry_months) VALUES
        ('t1', 'Treinamento NR-35 Trabalho em Altura', 'NR-35', 24, 'Treinamento NR-35 Trabalho em Altura', 'Segurança em Altura', 8, 24),
        ('t2', 'Treinamento NR-12 Segurança em Máquinas', 'NR-12', 12, 'Treinamento NR-12 Segurança em Máquinas', 'Segurança Industrial', 16, 12),
        ('t3', 'Integração de Segurança (NR-01)', 'NR-01', 12, 'Integração de Segurança (NR-01)', 'Normativo Geral', 4, 12)
      `);
    }

    // Seeder para FISPQ
    const fispqCheck = await client.query("SELECT id FROM fispq_docs");
    if (fispqCheck.rows.length === 0) {
      console.log('Semeando FISPQ iniciais...');
      await client.query(`
        INSERT INTO fispq_docs (id, chemical_name, manufacturer, revision_date, version, ghs_classification, cas_number, physical_state, risk_phrases, epc_measures) VALUES
        ('fispq1', 'Alumínio em Pó (Pó Metálico)', 'Sulfam Industrial Ltda.', '2024-06-01', '03', 'Perigo: Inflamável (Cat.2); Tóxico (Cat.4); Perigoso para Ambiente Aquático', '7429-90-5', 'Sólido (pó fino cinzento)', '["H228 - Sólido inflamável","H302 - Nocivo se ingerido","H400 - Muito tóxico para organismos aquáticos"]', '["Luvas de proteção (NR-06/CA)","Proteção respiratória P3","Óculos de vedação","Não usar perto de fontes de calor"]'),
        ('fispq2', 'Silicato de Sódio (Solução)', 'Química São Paulo LTDA', '2023-11-20', '02', 'Atenção: Irritante (Cat.2); Corrosivo (Cat.1C)', '1344-09-8', 'Líquido viscoso (transparente a amarelado)', '["H314 - Causa queimaduras graves na pele","H318 - Causa lesão ocular grave"]', '["Luvas de borracha butílica","Óculos de proteção vedados","Avental impermeável","Lavar imediatamente com água em caso de contato"]'),
        ('fispq3', 'Fluido de Corte Semissintético (Emulsão)', 'Master Químicos S/A', '2024-01-15', '01', 'Atenção: Irritante para a pele (Cat.2); Nocivo (Cat.4)', 'Mistura', 'Líquido (branco-leitoso após diluição)', '["H302 - Nocivo se ingerido","H315 - Provoca irritação cutânea","H317 - Pode provocar reação alérgica cutânea"]', '["Luvas de nitrila (NR-06/CA)","Evitar contato prolongado com a pele","Usar óculos de segurança durante o manuseio"]')
      `);
    }

    // Seeder para Setores
    const sectorCheck = await client.query("SELECT id FROM sectors");
    if (sectorCheck.rows.length === 0) {
      console.log('Semeando setores iniciais...');
      await client.query(`
        INSERT INTO sectors (id, name, description, processes, risks, company_id) VALUES
        ('sec1', 'Usinagem', 'Setor de usinagem e torneamento de peças de alumínio', '["Torneamento","Fresagem","Retífica"]', '["Ruído acima de 85dB","Fragmentos de alumínio","Fluidos de corte","Vibração"]', 'c1'),
        ('sec2', 'Soldagem e Montagem', 'Setor de soldagem MIG/TIG e montagem de estruturas', '["Soldagem MIG","Soldagem TIG","Montagem de estruturas"]', '["Fumos metálicos","Radiação UV","Calor intenso","Choque elétrico"]', 'c1'),
        ('sec3', 'Almoxarifado', 'Controle de estoque de EPIs e insumos', '["Recebimento de materiais","Inventário","Distribuição de EPIs"]', '["Esforço físico","Queda de objetos","Poeira"]', 'c1'),
        ('sec4', 'Administrativo', 'Setor administrativo e financeiro', '["Processamento de dados","Atendimento ao cliente","Gestão financeira"]', '["Ergonomia","Estresse","LER/DORT"]', 'c1')
      `);
    }

    // Seeder para Cargos
    const rolesCheck = await client.query("SELECT id FROM job_roles");
    if (rolesCheck.rows.length === 0) {
      console.log('Semeando cargos iniciais...');
      await client.query(`
        INSERT INTO job_roles (id, name, description, sector_id, risks, required_ppes, company_id) VALUES
        ('role1', 'Torneiro Mecânico', 'Operador de tornos e fresadoras CNC', 'sec1', '["Ruído","Fragmentos metálicos","Vibração","Fluidos de corte"]', '["ppe1","ppe2"]', 'c1'),
        ('role2', 'Soldador', 'Soldagem MIG/TIG em estruturas de alumínio', 'sec2', '["Fumos metálicos","Radiação UV","Calor","Choque elétrico"]', '["ppe2","ppe3"]', 'c1'),
        ('role3', 'Almoxarife', 'Controle e distribuição de materiais e EPIs', 'sec3', '["Esforço físico","Queda de objetos"]', '["ppe3"]', 'c1'),
        ('role4', 'Técnico de Segurança', 'Análise de riscos, inspeções e auditorias de SST', 'sec1', '["Risco geral de fábrica"]', '["ppe1","ppe2","ppe3"]', 'c1')
      `);
    }

    // Seeder para Documentos SST
    const docsCheck = await client.query("SELECT id FROM documents_sst");
    if (docsCheck.rows.length === 0) {
      console.log('Semeando documentos SST iniciais...');
      await client.query(`
        INSERT INTO documents_sst (id, title, type, document_number, responsible, elaboration_date, revision_date, expiry_date, validity_months, status, description, nr_references, company_id) VALUES
        ('doc1', 'PGR - Programa de Gerenciamento de Riscos', 'PGR', 'PGR-NH-2024-001', 'Dr. Marcos Patrício', '2024-01-15', '2024-07-15', '2026-01-15', 24, 'Vigente', 'Programa de Gerenciamento de Riscos conforme NR-01 e NR-09 para todas as atividades da Novo Horizonte Alumínios.', '["NR-01","NR-09"]', 'c1'),
        ('doc2', 'LTCAT - Laudo Técnico das Condições Ambientais', 'LTCAT', 'LTCAT-NH-2024-001', 'Engenheiro Raimundo Costa', '2024-02-20', '2024-08-20', '2025-02-20', 12, 'Vigente', 'Laudo técnico de avaliação das condições de trabalho para fins previdenciários (aposentadoria especial).', '["NR-09","IN INSS 77/2015"]', 'c1'),
        ('doc3', 'PCMSO - Programa de Controle Médico de Saúde Ocupacional', 'PCMSO', 'PCMSO-NH-2024-001', 'Dr. Ana Beatriz (Médico do Trabalho)', '2024-03-01', '2025-03-01', '2026-03-01', 24, 'Vigente', 'Programa de controle médico com cronograma de exames ocupacionais periódicos, admissionais e demissionais.', '["NR-07"]', 'c1'),
        ('doc4', 'DDS - Diálogo Diário de Segurança (Registro Anual)', 'DDS', 'DDS-NH-2025-001', 'Dr. Marcos Patrício', '2025-01-02', '2025-01-02', '2025-12-31', 12, 'Vigente', 'Registro consolidado dos DDS realizados ao longo do ano com temas e participantes.', '["NR-01"]', 'c1')
      `);
    }

    // Seeder para Inspeções
    const inspCheck = await client.query("SELECT id FROM inspections");
    if (inspCheck.rows.length === 0) {
      console.log('Semeando inspeções iniciais...');
      await client.query(`
        INSERT INTO inspections (id, title, type, sector, responsible, scheduled_date, completed_date, status, observations, score, nc_count, company_id) VALUES
        ('insp1', 'Inspeção de EPI e EPCs - Usinagem', 'Inspeção Geral', 'Usinagem', 'Dr. Marcos Patrício', '2026-06-01', '2026-06-01', 'Concluída', 'Verificados todos os equipamentos do setor. Foram encontradas 2 não conformidades menores.', 88, 2, 'c1'),
        ('insp2', 'Verificação de Extintores - Planta Geral', 'Prevenção de Incêndio', 'Toda a Planta', 'Dr. Marcos Patrício', '2026-06-10', '2026-06-10', 'Concluída', 'Todos os extintores dentro da validade. Sinalização adequada.', 100, 0, 'c1'),
        ('insp3', 'Checklist NR-12 - Máquinas e Equipamentos', 'NR-12', 'Usinagem', 'Eng. Raimundo Costa', '2026-07-01', NULL, 'Agendada', NULL, NULL, 0, 'c1')
      `);

      await client.query(`
        INSERT INTO inspection_items (id, inspection_id, description, category, nr_reference, result, observation) VALUES
        ('ii1', 'insp1', 'EPIs disponíveis e em bom estado para todos os funcionários', 'EPI/EPC', 'NR-06', 'Conforme', NULL),
        ('ii2', 'insp1', 'Protetor auricular sendo utilizado por todos os expostos a ruído', 'EPI/EPC', 'NR-06', 'Conforme', NULL),
        ('ii3', 'insp1', 'Sinalização de obrigatoriedade de uso de EPI afixada', 'Sinalização', 'NR-26', 'Não Conforme', 'Sinalização faltando na entrada do setor de torneamento'),
        ('ii4', 'insp2', 'Extintores dentro da validade e desobstruídos', 'Incêndio', 'NR-23', 'Conforme', NULL),
        ('ii5', 'insp2', 'Rotas de fuga sinalizadas e desobstruídas', 'Emergência', 'NR-23', 'Conforme', NULL)
      `);
    }

    // Seeder para WhatsApp Logs
    const waCheck = await client.query("SELECT id FROM whatsapp_logs LIMIT 1");
    if (waCheck.rows.length === 0) {
      console.log('Semeando logs de WhatsApp iniciais...');
      await client.query(`
        INSERT INTO whatsapp_logs (id, employee_id, employee_name, alert_type, detail, phone, sent_at, status, message) VALUES
        ('wl_1', 'e1', 'Carlos Henrique Silva', 'Treinamento Vencido', 'Trabalho em Altura (NR-35)', '+5551988887755', '2026-06-15T13:42:00Z',
         'Simulado',
         E'⚠️ ALERTA DE SST - NOVO HORIZONTE ALUMÍNIOS ⚠️\n\nOlá, Carlos Henrique Silva!\nEste é um aviso automático do SESMT. O seu treinamento mandatório Trabalho em Altura (NR-35) está vencido.\n\nPor favor, fale com a supervisão ou equipe de SST para confirmar sua escala!'),
        ('wl_2', 'e2', 'Juliana Montenegro', 'CA de EPI Vencendo', 'Bota de Segurança de Couro Cano Curto', '+5551977775544', '2026-06-16T17:15:00Z',
         'Simulado',
         E'⚠️ ALERTA DE SST - NOVO HORIZONTE ALUMÍNIOS ⚠️\n\nOlá, Juliana Montenegro!\nEste é um aviso automático do SESMT. O CA do seu EPI Bota de Segurança (CA: 41209) está próximo do vencimento.\n\nDirija-se ao Almoxarifado para realizar a substituição (NR-06).')
      `);
    }

    // Seeder para ASO Certificates
    const asoCertCheck = await client.query("SELECT id FROM aso_certificates LIMIT 1");
    if (asoCertCheck.rows.length === 0) {
      console.log('Semeando certificados ASO iniciais...');
      await client.query(`
        INSERT INTO aso_certificates (id, employee_id, employee_name, exam_date, next_exam_date, status, doctor_name, doctor_crm, file_url) VALUES
        ('aso1', 'e1', 'Carlos Henrique Silva', '2025-06-01', '2026-06-01', 'Vencido', 'Dr. Ana Beatriz', 'CRM/SP 123456', '#'),
        ('aso2', 'e2', 'Juliana Montenegro', '2026-01-15', '2027-01-15', 'Apto', 'Dr. Roberto Alves', 'CRM/SP 654321', '#')
      `);
    }

    // Seeder para ASO Exam Types
    const asoExamCheck = await client.query("SELECT id FROM aso_exam_types LIMIT 1");
    if (asoExamCheck.rows.length === 0) {
      console.log('Semeando tipos de exames complementares...');
      await client.query(`
        INSERT INTO aso_exam_types (id, name, description, periodicity_months, company_id) VALUES
        ('exam1', 'Audiometria tonal e vocal', 'Avaliação da acuidade auditiva para trabalhadores expostos a ruído.', 12, 'c1'),
        ('exam2', 'Acuidade Visual', 'Teste de escala de Snellen para motoristas e operadores de empilhadeira.', 12, 'c1'),
        ('exam3', 'Espirometria', 'Avaliação da função pulmonar para expostos a fumos metálicos.', 24, 'c1')
      `);
    }

    // Seeder para CIPA Candidates
    const cipaCheck = await client.query("SELECT id FROM cipa_candidates LIMIT 1");
    if (cipaCheck.rows.length === 0) {
      console.log('Semeando candidatos da CIPA...');
      await client.query(`
        INSERT INTO cipa_candidates (id, name, sector, votes, is_elected) VALUES
        ('cand1', 'Carlos Henrique Silva', 'Usinagem', 24, true),
        ('cand2', 'Juliana Montenegro', 'Soldagem e Montagem', 18, true),
        ('cand3', 'Roberto Carlos Pereira', 'Almoxarifado', 12, false),
        ('cand4', 'Fernanda Souza Lima', 'Administrativo', 8, false)
      `);
    }

    // Seeder para Risco Psicossocial
    const psychoCheck = await client.query("SELECT id FROM psychosocial_assessments LIMIT 1");
    if (psychoCheck.rows.length === 0) {
      console.log('Semeando avaliações psicossociais iniciais...');
      await client.query(`
        INSERT INTO psychosocial_assessments (id, employee_id, employee_name, answers, score, risk_level, assessment_date, evaluator) VALUES
        ('psy1', 'e1', 'Carlos Henrique Silva', '{"q1":2,"q2":3,"q3":2,"q4":4,"q5":3}', 14, 'Médio', '2026-06-20', 'Dr. Marcos Patrício'),
        ('psy2', 'e2', 'Juliana Montenegro', '{"q1":1,"q2":1,"q3":2,"q4":2,"q5":1}', 7, 'Baixo', '2026-06-21', 'Dr. Marcos Patrício')
      `);
    }

    console.log('Tabelas inicializadas e semeadas com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  } finally {
    client.release();
  }
};
