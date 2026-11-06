# Laudo Técnico de Qualidade de Software (Verificação e Validação)

**Projeto:** Cupcake & Co. Atelier (PIT II — Engenharia de Software II)
**Autora:** Isabelle Novais Oliveira | **RGM:** 39943780
**Data de Emissão:** 02/11/2026

## 1. Resumo Executivo
Este Laudo de Qualidade documenta os resultados das atividades de **Verificação** (inspeção de código, aderência ao padrão MVC, integridade referencial do banco SQLite e testes unitários/integração automatizados) e **Validação** (testes de aceitação conduzidos por 5 avaliadores externos simulando clientes e administradores reais).

## 2. Registro de Não Conformidades (Bugs) e Melhorias Implementadas na Versão 2.0

| ID | Origem (Avaliador) | Problema / Ponto de Melhoria Identificado na V1 | Solução Técnica Implementada na V2 | Arquivos Alterados | Status |
|---|---|---|---|---|---|
| **#01** | Bruna Martins | Ausência de busca e filtro na vitrine de cupcakes. | Implementado formulário `GET /` com busca textual (`LIKE` por nome/descrição) e seletor de categoria (`Clássicos`, `Especiais`, `Frutados`). | `src/models/produtos.js`, `src/controllers/loja.js`, `src/views/index.js` | **Corrigido e Validado** |
| **#02** | Hugo Gato | Input aceitava quantidade negativa no carrinho e datas apareciam em formato UTC bruto. | Adicionado bloqueio `min="1"` no HTML, sanitização `limitar(q)` no Model rejeitando `q <= 0`, e função `formatarDataBr()` convertendo UTC para `America/Sao_Paulo` (`DD/MM/AAAA HH:MM`). | `src/models/carrinho.js`, `src/util.js`, `src/views/index.js` | **Corrigido e Validado** |
| **#03** | Laila Silva | Cancelamento imediato sem confirmação (risco de erro acidental) e ausência de recompra rápida. | Adicionado diálogo de confirmação preventiva (`onsubmit="return confirm(...)"`) no botão de cancelar e criada a rota `POST /pedidos/:id/repetir` que recarrega os itens disponíveis no carrinho. | `src/controllers/loja.js`, `src/views/index.js` | **Corrigido e Validado** |
| **#04** | Lucas Mendes | Painel de pedidos do administrador não possuía filtro por etapa operacional. | Implementado filtro por query string (`GET /admin/pedidos?status=...`) no Model e barra de botões de filtro rápido na View administrativa. | `src/models/pedidos.js`, `src/controllers/admin.js`, `src/views/index.js` | **Corrigido e Validado** |
| **#05** | Mariana Costa | Falta de suporte a cupons de desconto no carrinho. | Criado motor de cupons no Model (`DOCE10` = 10% OFF; `PRIMEIRACOMPRA` = 15% OFF), persistência na sessão e no pedido (`desconto_centavos`, `cupom_aplicado`) e caixa de cupom no carrinho. | `db/schema.sql`, `src/models/carrinho.js`, `src/controllers/loja.js` | **Corrigido e Validado** |

## 3. Evidências de Verificação Automatizada (`npm test`)
A suíte de testes automatizados foi executada com o test runner nativo do Node.js (`node --test`), cobrindo:
1. **Testes Unitários de Carrinho (`test/carrinho.test.js`):** Soma de itens, teto de 99 unidades, bloqueio de quantidades negativas/inválidas, exclusão de itens pausados, cálculo de frete grátis (>= R$ 60,00) e aplicação de cupons de desconto.
2. **Testes Unitários de Modelos e Utilitários (`test/models.test.js`):** Conversão monetária em centavos (`parsePreco`), sanitização anti-XSS (`esc`), formatação de data brasileira (`formatarDataBr`), hash criptográfico de senha (`scrypt`), busca/filtro de produtos e máquina de estados do pedido.
3. **Teste de Integração HTTP Ponta a Ponta (`test/http.test.js`):** Simulação completa de requisições HTTP com cookies de sessão cobrindo vitrine, busca, aplicação de cupom, cadastro, checkout, repetição de pedido e avanço de status pelo administrador.

**Resultado da Execução:** 100% dos testes aprovados (0 falhas).

## 4. Parecer Final de Qualidade
O sistema **Cupcake & Co. Atelier (v2.0)** atende integralmente aos requisitos funcionais e não funcionais especificados nos Projetos Integradores I e II, encontrando-se apto para operação e homologado sem pendências críticas.
