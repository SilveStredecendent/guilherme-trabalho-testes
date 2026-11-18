const request = require('supertest');
const { criarApp } = require('../src/app');
const { validarDados, validarLimite } = require('../src/regras');

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

describe('Testes Unitários - Adryan (Integrante 2)', () => {
  test('CT02 deve retornar somente os 3 campos válidos e descartar campos extras', () => {
    const entrada = {
      descricao: 'Caderno universitário',
      sku: 'cad-1234',
      categoriaId: 1,
      id: 99,
      ativo: true,
    };

    const resultado = validarDados(entrada);

    expect(resultado).toEqual({
      descricao: 'Caderno universitário',
      sku: 'CAD-1234',
      categoriaId: 1,
    });
    expect(resultado.id).toBeUndefined();
    expect(resultado.ativo).toBeUndefined();
  });

  test('CT06 deve aceitar os limites extremos 1 e 80 em validarLimite', () => {
    const min = validarLimite(1);
    const max = validarLimite(80);

    expect(min).toBe(1);
    expect(max).toBe(80);
  });

  test('CT10 deve normalizar o sku antes de chamar repo.buscarPorSku no PUT /produtos/:id', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    repo.buscarPorId.mockResolvedValue({
      id: 4,
      descricao: 'Caderno antigo',
      sku: 'CAD-0001',
      categoriaId: 1,
    });
    repo.categoriaExiste.mockResolvedValue(true);
    repo.buscarPorSku.mockResolvedValue(null);
    repo.atualizar.mockResolvedValue({
      id: 4,
      descricao: 'Caderno universitário',
      sku: 'CAD-1234',
      categoriaId: 1,
    });

    const corpo = {
      descricao: 'Caderno universitário',
      sku: 'cad-1234',
      categoriaId: 1,
    };

    const res = await request(app).put('/produtos/4').send(corpo);

    expect(res.status).toBe(200);
    expect(repo.buscarPorSku).toHaveBeenCalledWith('CAD-1234');
    expect(repo.atualizar).toHaveBeenCalledWith(4, {
      descricao: 'Caderno universitário',
      sku: 'CAD-1234',
      categoriaId: 1,
    });
  });

  test('CT14 deve aceitar descricao com exatamente 4 caracteres', () => {
    const entrada = {
      descricao: 'Mesa',
      sku: 'MES-1000',
      categoriaId: 2,
    };

    const resultado = validarDados(entrada);

    expect(resultado).toEqual({
      descricao: 'Mesa',
      sku: 'MES-1000',
      categoriaId: 2,
    });
  });

  test('CT18 deve responder 400 e não chamar repo.excluir quando ID for inválido no DELETE', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    const res = await request(app).delete('/produtos/abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'ID inválido' });
    expect(repo.excluir).not.toHaveBeenCalled();
  });
});
