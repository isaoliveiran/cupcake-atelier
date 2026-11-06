const { ErroValidacao } = require('../util');

const PROXIMO_STATUS = {
  Recebido: 'Em preparo',
  'Em preparo': 'Saiu para entrega',
  'Saiu para entrega': 'Entregue',
};
const FORMAS_PAGAMENTO = ['PIX', 'Cartão na entrega', 'Dinheiro'];

module.exports = (db) => {
  function buscar(id) {
    const pedido = db
      .prepare('SELECT p.*, u.nome AS cliente_nome, u.email AS cliente_email FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = ?')
      .get(Number(id));
    if (!pedido) return null;
    pedido.itens = db
      .prepare(
        `SELECT i.*, pr.nome AS produto_nome, pr.emoji, pr.disponivel FROM itens_pedido i
         JOIN produtos pr ON pr.id = i.produto_id WHERE i.pedido_id = ? ORDER BY i.id`
      )
      .all(pedido.id);
    return pedido;
  }

  function criar(usuarioId, resumo, { endereco, pagamento, observacao = '' }) {
    const erros = [];
    endereco = String(endereco ?? '').trim();
    observacao = String(observacao ?? '').trim().slice(0, 300);
    if (!resumo.itens || !resumo.itens.length) erros.push('Seu carrinho está vazio.');
    if (endereco.length < 5) erros.push('Informe o endereço completo para entrega (mínimo 5 caracteres).');
    if (!FORMAS_PAGAMENTO.includes(pagamento)) erros.push('Selecione uma forma de pagamento válida.');
    if (erros.length) throw new ErroValidacao(erros);

    db.exec('BEGIN');
    try {
      const r = db
        .prepare(
          `INSERT INTO pedidos (
            usuario_id, subtotal_centavos, desconto_centavos, frete_centavos,
            total_centavos, cupom_aplicado, endereco_entrega, forma_pagamento, observacao
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          usuarioId,
          resumo.subtotal_centavos,
          resumo.desconto_centavos || 0,
          resumo.frete_centavos,
          resumo.total_centavos,
          resumo.cupom_aplicado || '',
          endereco,
          pagamento,
          observacao
        );
      const pedidoId = r.lastInsertRowid;
      const insItem = db.prepare(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unit_centavos) VALUES (?, ?, ?, ?)'
      );
      for (const item of resumo.itens) {
        insItem.run(pedidoId, item.produto.id, item.quantidade, item.preco_unit_centavos);
      }
      db.exec('COMMIT');
      return buscar(pedidoId);
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  const listarPorUsuario = (usuarioId) =>
    db.prepare('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC').all(Number(usuarioId)).map((p) => buscar(p.id));

  function listarTodos({ status = '' } = {}) {
    const filtro = String(status ?? '').trim();
    const rows = filtro
      ? db.prepare('SELECT id FROM pedidos WHERE status = ? ORDER BY id DESC').all(filtro)
      : db.prepare('SELECT id FROM pedidos ORDER BY id DESC').all();
    return rows.map((r) => buscar(r.id));
  }

  function avancarStatus(id) {
    const p = buscar(id);
    if (!p) return null;
    const prox = PROXIMO_STATUS[p.status];
    if (!prox) throw new ErroValidacao([`Não é possível avançar um pedido com status "${p.status}".`]);
    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run(prox, p.id);
    return buscar(p.id);
  }

  function cancelar(id, usuarioId) {
    const p = buscar(id);
    if (!p || (usuarioId && p.usuario_id !== Number(usuarioId))) return null;
    if (p.status !== 'Recebido') {
      throw new ErroValidacao(['Apenas pedidos com status "Recebido" podem ser cancelados.']);
    }
    db.prepare("UPDATE pedidos SET status = 'Cancelado' WHERE id = ?").run(p.id);
    return buscar(p.id);
  }

  return { FORMAS_PAGAMENTO, PROXIMO_STATUS, buscar, criar, listarPorUsuario, listarTodos, avancarStatus, cancelar };
};
