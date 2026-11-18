# Resultados de Performance — Adryan Claro (`mrclaro`)

## Tabela Comparativa (E1 a E5)

| Etapa | Cenário | Requisição | Amostras | Média (ms) | P95 (ms) | P99 (ms) | Throughput (req/s) | Erro (%) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **E1** | Base pequena (sem índice) | `busca-prefixo` | 500 | 2,02 | 5,00 | 6,00 | 52,69 | 0,00% |
| **E1** | Base pequena (sem índice) | `busca-contem` | 500 | 1,81 | 5,00 | 6,00 | 53,19 | 0,00% |
| **E1** | Base pequena (sem índice) | `inclusao` | 500 | 5,99 | 11,00 | 16,99 | 53,21 | 0,00% |
| **E2** | Carga 100k via JDBC (sem índice) | `carga-volume` | 100.000 | 7,22 | 12,00 | 18,00 | 1.288,74 | 0,00% |
| **E3** | Base cheia ~100,5k (sem índice) | `busca-prefixo` | 500 | 144,20 | 220,95 | 251,96 | 25,89 | 0,00% |
| **E3** | Base cheia ~100,5k (sem índice) | `busca-contem` | 500 | 207,17 | 290,00 | 317,97 | 26,17 | 0,00% |
| **E3** | Base cheia ~100,5k (sem índice) | `inclusao` | 500 | 58,95 | 164,00 | 200,00 | 26,38 | 0,00% |
| **E4** | Base cheia ~100,5k (com índice) | `busca-prefixo` | 500 | 3,58 | 5,00 | 7,99 | 40,06 | 0,00% |
| **E4** | Base cheia ~100,5k (com índice) | `busca-contem` | 500 | 143,62 | 209,95 | 220,99 | 40,00 | 0,00% |
| **E4** | Base cheia ~100,5k (com índice) | `inclusao` | 500 | 8,19 | 12,95 | 20,00 | 40,28 | 0,00% |
| **E5** | Carga 100k via JDBC (com índice) | `carga-volume` | 100.000 | 6,68 | 9,00 | 14,00 | 1.407,34 | 0,00% |

## Análise dos Resultados

1. **Impacto do volume sem índice (E1 → E3):** Com poucos registros (E1), o *Full Table Scan* é instantâneo (média geral de 3,27 ms). Ao crescer para mais de 100.000 linhas (E3), o tempo médio de `busca-prefixo` saltou de **2,02 ms para 144,20 ms** (71× mais lento) e `busca-contem` foi para **207,17 ms**, derrubando o throughput total pela metade devido à varredura sequencial da tabela e contenção de conexões no pool.
2. **Efeito seletivo do índice B-Tree (E3 → E4):** Após criar `CREATE INDEX idx_produtos_descricao ON produtos (descricao)`, a requisição `busca-prefixo` (`LIKE 'Ab%'`) caiu de **144,20 ms para 3,58 ms** (redução de **97,5%**), pois índices B-Tree ordenam os valores da esquerda para a direita e permitem busca por intervalo. Em contrapartida, `busca-contem` (`LIKE '%ab%'`) permaneceu elevada (**143,62 ms**), porque o curinga `%` no início impede o uso da árvore B-Tree e obriga o MySQL a varrer toda a tabela/índice (a pequena melhora em relação ao E3 ocorre apenas pela menor disputa de I/O gerada pelas consultas de prefixo).
3. **Custo de escrita com índice (E2 vs E5 e E1 vs E4):** Na API (`inclusao`), a média subiu levemente de **5,99 ms (E1)** para **8,19 ms (E4)** pelo custo adicional de atualizar o índice secundário `idx_produtos_descricao` a cada inserção. Na carga massiva via JDBC (E2: **7,22 ms** vs E5: **6,68 ms**), o aquecimento do *InnoDB Buffer Pool* compensou o custo de manutenção da B-Tree em disco, mantendo a vazão acima de 1.280 req/s com **0,00% de erro** em todas as etapas.
