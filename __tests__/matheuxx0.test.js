const request = require('supertest');
const { criarApp } = require('../src/app');
const { validarDados } = require('../src/regras');

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

describe('Testes Unitários - Matheus (Integrante 4)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // CT04 (Rota): PATCH não existe na API -> 404 "Rota não encontrada"
  test('CT04 PATCH /produtos/1 deve responder 404 "Rota não encontrada" e não alterar nada', async () => {
    // 1) Preparar
    const repo = criarRepoMock();
    const app = criarApp(repo);
    const corpo = { descricao: 'Caderno universitário', sku: 'cad-1234', categoriaId: 1 };

    // 2) Agir
    const res = await request(app).patch('/produtos/1').send(corpo);

    // 3) Conferir
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Rota não encontrada' });
    expect(repo.atualizar).not.toHaveBeenCalled();
    expect(repo.buscarPorId).not.toHaveBeenCalled();
  });

  // CT08 (Rota): erro de banco que NÃO é duplicidade -> 500, nunca 409
  test('CT08 POST /produtos deve responder 500 "Erro interno" quando inserir falha com ER_LOCK_WAIT_TIMEOUT', async () => {
    // 1) Preparar: tudo válido, e só o inserir falha
    const repo = criarRepoMock();
    repo.categoriaExiste.mockResolvedValue(true);
    repo.buscarPorSku.mockResolvedValue(null);
    const erroBanco = new Error('Lock wait timeout exceeded');
    erroBanco.code = 'ER_LOCK_WAIT_TIMEOUT';
    repo.inserir.mockRejectedValue(erroBanco);
    const app = criarApp(repo);
    const corpo = { descricao: 'Caderno universitário', sku: 'cad-1234', categoriaId: 1 };

    // 2) Agir
    const res = await request(app).post('/produtos').send(corpo);

    // 3) Conferir
    expect(res.status).toBe(500);
    expect(res.status).not.toBe(409);
    expect(res.body).toEqual({ erro: 'Erro interno' });
    expect(repo.inserir).toHaveBeenCalledTimes(1);
  });

  // CT12 (Rota): POST limpa (trim), normaliza o sku e devolve os dados limpos
  test('CT12 POST /produtos deve responder 201 com id 15 e dados já limpos e normalizados', async () => {
    // 1) Preparar
    const repo = criarRepoMock();
    repo.categoriaExiste.mockResolvedValue(true);
    repo.buscarPorSku.mockResolvedValue(null);
    repo.inserir.mockResolvedValue(15);
    const app = criarApp(repo);
    const corpo = { descricao: '  Caderno universitário  ', sku: 'cad-1234', categoriaId: 1 };

    // 2) Agir
    const res = await request(app).post('/produtos').send(corpo);

    // 3) Conferir
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 15,
      descricao: 'Caderno universitário',
      sku: 'CAD-1234',
      categoriaId: 1,
    });
    expect(repo.inserir).toHaveBeenCalledTimes(1);
  });

  // CT16 (Regra): validarDados() sem argumento -> erro de validação, não TypeError
  test('CT16 validarDados() sem argumento deve lançar erro (não TypeError) citando descricao, sku e categoriaId', () => {
    // 1) Preparar: nada (a entrada é a ausência de argumento)
    let erro;

    // 2) Agir
    try {
      validarDados();
    } catch (e) {
      erro = e;
    }

    // 3) Conferir
    expect(erro).toBeDefined();
    expect(erro).not.toBeInstanceOf(TypeError);
    expect(erro.message).toContain('descricao');
    expect(erro.message).toContain('sku');
    expect(erro.message).toContain('categoriaId');
  });

  // CT20 (Rota): limite 81 (acima do máximo 80) -> 400 antes de ir ao banco
  test('CT20 GET /produtos?limite=81 deve responder 400 sobre o limite e não consultar o banco', async () => {
    // 1) Preparar
    const repo = criarRepoMock();
    const app = criarApp(repo);

    // 2) Agir
    const res = await request(app).get('/produtos?descricao=Ab&limite=81');

    // 3) Conferir
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/limite/i);
    expect(repo.buscarPorDescricao).not.toHaveBeenCalled();
  });
});
