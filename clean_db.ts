import { query } from './src/db.js';

async function cleanTestDeliveries() {
  try {
    console.log('Buscando colaborador Emerson...');
    const result = await query("SELECT id, name FROM employees WHERE name ILIKE '%Emerson%'");
    
    if (result.rows.length === 0) {
      console.log('Nenhum colaborador com nome Emerson encontrado.');
      process.exit(0);
    }

    for (const emp of result.rows) {
      console.log(`Encontrado: ${emp.name} (ID: ${emp.id})`);
      const delResult = await query("DELETE FROM deliveries WHERE employee_id = $1 RETURNING id", [emp.id]);
      console.log(`Deletadas ${delResult.rows.length} entregas de EPI para ${emp.name}.`);
    }
    console.log('Limpeza concluída!');
    process.exit(0);
  } catch (e) {
    console.error('Erro:', e);
    process.exit(1);
  }
}

cleanTestDeliveries();
