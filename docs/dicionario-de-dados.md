# Dicionário de Dados e Projeto Físico (SQLite 3)

**Autora:** Isabelle Novais Oliveira | **RGM:** 39943780

Todos os valores monetários são armazenados como números inteiros em **centavos** (`INTEGER`), prevenindo imprecisões de ponto flutuante (IEEE 754).

## 1. Tabela `usuarios`
Armazena clientes cadastrados e administradores da confeitaria.

| Atributo | Tipo Físico | Domínio / Restrições | Descrição |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Identificador único do usuário |
| `nome` | `TEXT` | `NOT NULL CHECK (length(nome) >= 2)` | Nome completo |
| `email` | `TEXT` | `NOT NULL UNIQUE` | E-mail de login (normalizado em minúsculas) |
| `senha_hash` | `TEXT` | `NOT NULL` | Hash criptográfico `scrypt` + salt aleatório |
| `perfil` | `TEXT` | `NOT NULL DEFAULT 'cliente' CHECK IN ('cliente','admin')` | Nível de permissão no sistema |
| `endereco` | `TEXT` | `NOT NULL DEFAULT ''` | Endereço residencial padrão para entregas |
| `criado_em` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))` | Data/hora UTC do cadastro |

## 2. Tabela `produtos`
Catálogo de cupcakes comercializados na vitrine virtual.

| Atributo | Tipo Físico | Domínio / Restrições | Descrição |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Identificador único do sabor |
| `nome` | `TEXT` | `NOT NULL CHECK (length(nome) >= 2)` | Nome comercial do cupcake |
| `descricao` | `TEXT` | `NOT NULL DEFAULT ''` | Ingredientes, massa, recheio e cobertura |
| `categoria` | `TEXT` | `NOT NULL DEFAULT 'Clássicos'` | Classificação (`Clássicos`, `Especiais`, `Frutados`) |
| `preco_centavos` | `INTEGER` | `NOT NULL CHECK (preco_centavos > 0)` | Preço unitário em centavos (ex.: `950` = R$ 9,50) |
| `emoji` | `TEXT` | `NOT NULL DEFAULT '🧁'` | Representação visual do card |
| `disponivel` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK IN (0, 1)` | Flag booleana (`1` = visível na vitrine, `0` = pausado) |
| `criado_em` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))` | Data/hora UTC do cadastro |

## 3. Tabela `pedidos`
Cabeçalho dos pedidos efetuados pelos clientes.

| Atributo | Tipo Físico | Domínio / Restrições | Descrição |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Número identificador do pedido |
| `usuario_id` | `INTEGER` | `NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT` | Cliente autor da compra |
| `status` | `TEXT` | `NOT NULL CHECK IN ('Recebido','Em preparo','Saiu para entrega','Entregue','Cancelado')` | Etapa atual do pedido |
| `subtotal_centavos` | `INTEGER` | `NOT NULL CHECK (subtotal_centavos > 0)` | Soma bruta dos itens em centavos |
| `desconto_centavos` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (desconto_centavos >= 0)` | Valor abatido por cupom promocional |
| `frete_centavos` | `INTEGER` | `NOT NULL CHECK (frete_centavos >= 0)` | Taxa de entrega (R$ 7,00 ou grátis >= R$ 60,00) |
| `total_centavos` | `INTEGER` | `NOT NULL CHECK (total_centavos > 0)` | Valor final líquido cobrado |
| `cupom_aplicado` | `TEXT` | `NOT NULL DEFAULT ''` | Código promocional utilizado (`DOCE10`, etc.) |
| `endereco_entrega` | `TEXT` | `NOT NULL CHECK (length(endereco_entrega) >= 5)` | Local de entrega informado no checkout |
| `forma_pagamento` | `TEXT` | `NOT NULL CHECK IN ('PIX','Cartão na entrega','Dinheiro')` | Modalidade de pagamento |
| `observacao` | `TEXT` | `NOT NULL DEFAULT ''` | Instruções adicionais para confeitaria/entregador |
| `criado_em` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))` | Data/hora UTC da confirmação |

## 4. Tabela `itens_pedido`
Entidade associativa que registra os sabores e preços praticados no momento da compra.

| Atributo | Tipo Físico | Domínio / Restrições | Descrição |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Identificador da linha de item |
| `pedido_id` | `INTEGER` | `NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE` | Chave estrangeira do pedido |
| `produto_id` | `INTEGER` | `NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT` | Chave estrangeira do cupcake |
| `quantidade` | `INTEGER` | `NOT NULL CHECK (quantidade BETWEEN 1 AND 99)` | Unidades adquiridas daquele sabor |
| `preco_unit_centavos` | `INTEGER` | `NOT NULL CHECK (preco_unit_centavos > 0)` | Preço unitário congelado no ato da venda |

## 5. Tabela `sessoes`
Persistência de estado HTTP (autenticação, carrinho ativo, cupom e mensagens flash).

| Atributo | Tipo Físico | Domínio / Restrições | Descrição |
|---|---|---|---|
| `token` | `TEXT` | `PRIMARY KEY` | Token criptográfico enviado via cookie `HttpOnly` |
| `usuario_id` | `INTEGER` | `REFERENCES usuarios(id) ON DELETE CASCADE` | Usuário logado na sessão (ou `NULL`) |
| `carrinho` | `TEXT` | `NOT NULL DEFAULT '{}'` | Mapa JSON `{ "produtoId": quantidade }` |
| `cupom` | `TEXT` | `NOT NULL DEFAULT ''` | Cupom aplicado na sessão atual |
| `flash` | `TEXT` | `NOT NULL DEFAULT ''` | Notificação temporária de feedback visual |
| `criado_em` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))` | Data/hora de abertura da sessão |
