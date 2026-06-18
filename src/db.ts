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
        address TEXT
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
        email VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS ppes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ca VARCHAR(50),
        validity_date DATE,
        stock INTEGER,
        min_stock INTEGER,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id VARCHAR(50) PRIMARY KEY,
        delivery_date DATE,
        status VARCHAR(50),
        ppe_id VARCHAR(50),
        employee_id VARCHAR(50),
        quantity INTEGER
      );

      CREATE TABLE IF NOT EXISTS trainings (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        nr VARCHAR(50),
        validity_months INTEGER
      );

      CREATE TABLE IF NOT EXISTS employee_trainings (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50),
        training_id VARCHAR(50),
        status VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS accidents (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(50),
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS action_plans (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(50),
        title VARCHAR(255),
        responsible VARCHAR(255),
        deadline DATE
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    console.log('Tabelas inicializadas com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  } finally {
    client.release();
  }
};
