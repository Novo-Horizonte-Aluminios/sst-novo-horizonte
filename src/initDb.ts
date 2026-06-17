import { initDb } from './db.js';

console.log('Iniciando o setup do banco...');
initDb().then(() => {
  console.log('Setup do banco finalizado.');
  process.exit(0);
}).catch(err => {
  console.error('Erro geral no setup:', err);
  process.exit(1);
});
