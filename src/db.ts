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
        photo_url TEXT
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
        INSERT INTO ppes (id, name, ca, validity_date, stock, min_stock, description, internal_code, bar_code, brand, manufacturer, category, ca_number, ca_issue_date, ca_expiry_date, ca_status, fispq_relation, manual_url) VALUES
        ('ppe1', 'Protetor Auricular Plug de Silicone', '39712', '2029-11-18', 120, 20, 'Protetor auditivo de silicone antialérgico', 'EPI-AUD-01', '7891011121314', '3M', '3M do Brasil', 'Proteção Auditiva', '39712', '2021-02-15', '2029-11-18', 'Válido', 'N/A', '#'),
        ('ppe2', 'Óculos de Segurança Fumê', '32145', '2029-12-05', 85, 15, 'Óculos de proteção em policarbonato com haste flexível', 'EPI-VIS-02', '7891011121321', 'Kalipso', 'Kalipso Indústria', 'Proteção Ocular', '32145', '2021-05-10', '2029-12-05', 'Válido', 'N/A', '#'),
        ('ppe3', 'Luva de Vaqueta Cano Curto', '28932', '2024-03-12', 8, 10, 'Luva de proteção em couro de vaqueta macio', 'EPI-MAN-03', '7891011121338', 'Marluvas', 'Marluvas Calçados', 'Proteção dos Pés', '28932', '2019-03-12', '2024-03-12', 'Vencido', 'N/A', '#')
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

    console.log('Tabelas inicializadas e semeadas com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  } finally {
    client.release();
  }
};
