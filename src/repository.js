// Camada de acesso a dados: só SQL, sem regra de negócio.
// Nos testes unitários esta camada deve ser substituída por um mock.

const SELECT_BASE = `
  SELECT t.id, t.descricao AS descricao, t.sku AS sku, t.categoria_id AS categoriaId, a.nome AS categoria, t.criado_em AS criadoEm
  FROM produtos t
  JOIN categorias a ON a.id = t.categoria_id`;

function criarRepository(pool) {
  return {
    async listarCategorias() {
      const [rows] = await pool.query('SELECT id, nome FROM categorias ORDER BY id');
      return rows;
    },

    async categoriaExiste(id) {
      const [rows] = await pool.query('SELECT 1 FROM categorias WHERE id = ?', [id]);
      return rows.length > 0;
    },

    // padrao: string usada no LIKE (ex.: "Ab%" ou "%Ab%")
    async buscarPorDescricao(padrao, limite) {
      const [rows] = await pool.query(
        `${SELECT_BASE} WHERE t.descricao LIKE ? ORDER BY t.descricao LIMIT ?`,
        [padrao, limite]
      );
      return rows;
    },

    async buscarPorId(id) {
      const [rows] = await pool.query(`${SELECT_BASE} WHERE t.id = ?`, [id]);
      return rows[0] || null;
    },

    async buscarPorSku(sku) {
      const [rows] = await pool.query('SELECT id, sku AS sku FROM produtos WHERE sku = ?', [sku]);
      return rows[0] || null;
    },

    async inserir({ descricao, sku, categoriaId }) {
      const [res] = await pool.query(
        'INSERT INTO produtos (descricao, sku, categoria_id) VALUES (?, ?, ?)',
        [descricao, sku, categoriaId]
      );
      return res.insertId;
    },

    async atualizar(id, { descricao, sku, categoriaId }) {
      const [res] = await pool.query(
        'UPDATE produtos SET descricao = ?, sku = ?, categoria_id = ? WHERE id = ?',
        [descricao, sku, categoriaId, id]
      );
      return res.affectedRows > 0;
    },

    async excluir(id) {
      const [res] = await pool.query('DELETE FROM produtos WHERE id = ?', [id]);
      return res.affectedRows > 0;
    },
  };
}

module.exports = { criarRepository };
