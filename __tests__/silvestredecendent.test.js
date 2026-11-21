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

describe('Testes Unitários - Herbert (Integrante 1)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  
  test('CT01 Busca ?descricao=Ab&modo=exato (modo que não existe)', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);
    const res = await request(app).get('/produtos?descricao=Ab&modo=exato');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Modo de busca inválido. Use: prefixo ou contem' });
    expect(repo.buscarPorDescricao).not.toHaveBeenCalled();
  });

  test('CT05 descricao abaixo do mínimo ("AAA") e os demais campos válidos', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);
    const corpo = { descricao: 'AAA', sku: 'cad-1234', categoriaId: 1 };

    const res = await request(app).post('/produtos').send(corpo);

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('descricao');
    expect(repo.categoriaExiste).not.toHaveBeenCalled();
    expect(repo.buscarPorSku).not.toHaveBeenCalled();
    expect(repo.inserir).not.toHaveBeenCalled();
  });

  test('CT09 PUT /produtos/abc com um corpo válido', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);
    const corpo = { descricao: 'Caderno universitário', sku: 'cad-1234', categoriaId: 1 };

    const res = await request(app).put('/produtos/abc').send(corpo);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'ID inválido' });
    expect(repo.buscarPorId).not.toHaveBeenCalled();
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  test('CT13 descricao = " AAA ": com os espaços tem tamanho suficiente, mas sem eles fica abaixo do mínimo (4)', () => {
    const dados = { descricao: ' AAA ', sku: 'cad-1234', categoriaId: 1 };

    expect(() => validarDados(dados)).toThrow('Campo descricao');
  });

  test('CT17 repo.listarCategorias falha com new Error("banco fora do ar")', async () => {
    const repo = criarRepoMock();
    repo.listarCategorias.mockRejectedValue(new Error('banco fora do ar')); // o mock FALHA
    jest.spyOn(console, 'error').mockImplementation(() => {});              // só silencia o log do erro
    const app = criarApp(repo);

    const res = await request(app).get('/categorias');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno' });
    expect(JSON.stringify(res.body)).not.toContain('banco fora do ar');
    expect(repo.listarCategorias).toHaveBeenCalledTimes(1);
  });
});