const request = require('supertest');
const { criarApp } = require('../src/app');
const { validarId, montarPadrao } = require('../src/regras');

function criarRepoMock() {
  return {
    listarCategorias: jest.fn(),
    categoriaExiste: jest.fn(),
    buscarPorDescricao: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorSku: jest.fn(),
    inserir: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
  };
}

// CT03: o limite chega na URL como texto "5" e precisa chegar ao repository como número 5
test('CT03 GET /produtos com limite=5 deve chamar o repository com o limite como número', async () => {
  const repo = criarRepoMock();
  const lista = [{ id: 1, descricao: 'Abacaxi', sku: 'FRU-1111', categoriaId: 1 }];
  repo.buscarPorDescricao.mockResolvedValue(lista);
  const app = criarApp(repo);

  const res = await request(app).get('/produtos?descricao=Ab&limite=5');

  expect(res.status).toBe(200);
  expect(res.body.resultados).toEqual(lista);
  expect(repo.buscarPorDescricao).toHaveBeenCalledTimes(1);
  expect(repo.buscarPorDescricao).toHaveBeenCalledWith('Ab%', 5);
});

// CT07: validarId recusa texto vazio e null
test('CT07 validarId deve recusar texto vazio e null com "ID inválido"', () => {
  expect(() => validarId('')).toThrow('ID inválido');
  expect(() => validarId(null)).toThrow('ID inválido');
});

// CT11: termo numérico não pode dar erro e vira "%123%" no modo contem
test('CT11 montarPadrao deve aceitar termo numérico e devolver "%123%" no modo contem', () => {
  expect(montarPadrao(123, 'contem')).toBe('%123%');
});

// CT15: erro técnico do banco vira 500 genérico, sem expor a mensagem
test('CT15 DELETE /produtos/4 deve responder 500 genérico quando repo.excluir falha', async () => {
  const erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const repo = criarRepoMock();
  // Se o DELETE do seu app.js não chama buscarPorId, apague a linha abaixo
  repo.buscarPorId.mockResolvedValue({ id: 4, descricao: 'Caderno universitário', sku: 'CAD-1234', categoriaId: 1 });
  repo.excluir.mockRejectedValue(new Error('timeout na conexão'));
  const app = criarApp(repo);

  const res = await request(app).delete('/produtos/4');

  expect(res.status).toBe(500);
  expect(res.body).toEqual({ erro: 'Erro interno' });
  expect(repo.excluir).toHaveBeenCalledTimes(1);
  expect(repo.excluir).toHaveBeenCalledWith(4);

  erroSpy.mockRestore();
});

// CT19: o POST grava a descricao sem espaços nas pontas e o sku em maiúsculas
test('CT19 POST /produtos deve gravar descricao limpa e sku normalizado', async () => {
  const repo = criarRepoMock();
  repo.categoriaExiste.mockResolvedValue(true);
  repo.buscarPorSku.mockResolvedValue(null);
  repo.inserir.mockResolvedValue(15);
  const app = criarApp(repo);
  const corpo = { descricao: ' Caderno universitário ', sku: 'cad-1234', categoriaId: 1 };

  const res = await request(app).post('/produtos').send(corpo);

  expect(res.status).toBe(201);
  expect(repo.inserir).toHaveBeenCalledTimes(1);
  expect(repo.inserir).toHaveBeenCalledWith({
    descricao: 'Caderno universitário',
    sku: 'CAD-1234',
    categoriaId: 1,
  });
});