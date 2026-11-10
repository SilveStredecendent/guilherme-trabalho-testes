// Apaga todos os registros de produtos e remove índices da coluna descricao (se existirem).
// Use para recomeçar os testes de performance do zero: npm run db:reset
require('dotenv').config();
const { pool, inicializarBanco } = require('../src/db');

(async () => {
  await inicializarBanco();
  await pool.query('TRUNCATE TABLE produtos');

  const [indices] = await pool.query("SHOW INDEX FROM produtos WHERE Column_name = 'descricao'");
  for (const nome of new Set(indices.map((i) => i.Key_name))) {
    await pool.query(`DROP INDEX \`${nome}\` ON produtos`);
    console.log(`Índice removido: ${nome}`);
  }

  console.log('Tabela produtos zerada.');
  await pool.end();
})().catch(async (err) => {
  console.error(err.message);
  await pool.end();
  process.exit(1);
});
