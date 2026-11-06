-- Projeto Físico do Banco de Dados Relacional (SQLite 3)
-- Autora: Isabelle Novais Oliveira | RGM: 39943780
-- Disciplina: Projeto Integrador Transdisciplinar em Engenharia de Software II

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL CHECK (length(nome) >= 2),
  email       TEXT    NOT NULL UNIQUE,
  senha_hash  TEXT    NOT NULL,
  perfil      TEXT    NOT NULL DEFAULT 'cliente' CHECK (perfil IN ('cliente', 'admin')),
  endereco    TEXT    NOT NULL DEFAULT '',
  criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nome             TEXT    NOT NULL CHECK (length(nome) >= 2),
  descricao        TEXT    NOT NULL DEFAULT '',
  categoria        TEXT    NOT NULL DEFAULT 'Clássicos',
  preco_centavos   INTEGER NOT NULL CHECK (preco_centavos > 0),
  emoji            TEXT    NOT NULL DEFAULT '🧁',
  disponivel       INTEGER NOT NULL DEFAULT 1 CHECK (disponivel IN (0, 1)),
  criado_em        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  status            TEXT    NOT NULL DEFAULT 'Recebido'
                    CHECK (status IN ('Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado')),
  subtotal_centavos INTEGER NOT NULL CHECK (subtotal_centavos > 0),
  desconto_centavos INTEGER NOT NULL DEFAULT 0 CHECK (desconto_centavos >= 0),
  frete_centavos    INTEGER NOT NULL CHECK (frete_centavos >= 0),
  total_centavos    INTEGER NOT NULL CHECK (total_centavos > 0),
  cupom_aplicado    TEXT    NOT NULL DEFAULT '',
  endereco_entrega  TEXT    NOT NULL CHECK (length(endereco_entrega) >= 5),
  forma_pagamento   TEXT    NOT NULL CHECK (forma_pagamento IN ('PIX', 'Cartão na entrega', 'Dinheiro')),
  observacao        TEXT    NOT NULL DEFAULT '',
  criado_em         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id            INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id           INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade           INTEGER NOT NULL CHECK (quantidade > 0 AND quantidade <= 99),
  preco_unit_centavos  INTEGER NOT NULL CHECK (preco_unit_centavos > 0)
);

CREATE TABLE IF NOT EXISTS sessoes (
  token       TEXT PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  carrinho    TEXT NOT NULL DEFAULT '{}',
  cupom       TEXT NOT NULL DEFAULT '',
  flash       TEXT NOT NULL DEFAULT '',
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status  ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido    ON itens_pedido(pedido_id);
