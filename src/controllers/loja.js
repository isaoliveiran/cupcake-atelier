const v = require('../views');
const carrinhoModelo = require('../models/carrinho');
const { ErroValidacao } = require('../util');

module.exports = (r, m, h) => {
  const detalharCarrinho = (ctx) => carrinhoModelo.detalhar(ctx.carrinho, m.produtos.buscar, ctx.cupom);

  r('GET', '/', (ctx) => {
    const busca = ctx.query?.q || '';
    const categoria = ctx.query?.categoria || '';
    const lista = m.produtos.listar({ apenasDisponiveis: true, busca, categoria });
    return h.html(v.cardapio(ctx, lista, { busca, categoria }));
  });

  r('GET', '/carrinho', (ctx) => h.html(v.carrinho(ctx, detalharCarrinho(ctx))));

  r('POST', '/carrinho/adicionar', (ctx) => {
    const p = m.produtos.buscar(ctx.body.produto_id);
    if (!p || !p.disponivel) {
      h.flash(ctx, 'erro', 'Este sabor não está disponível.');
      return h.redirect('/');
    }
    const qtd = Number(ctx.body.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      h.flash(ctx, 'erro', 'Informe uma quantidade válida maior que zero.');
      return h.redirect('/');
    }
    h.salvarCarrinho(ctx, carrinhoModelo.adicionar(ctx.carrinho, p.id, qtd));
    h.flash(ctx, 'ok', `${p.nome} adicionado ao carrinho!`);
    return h.redirect('/');
  });

  r('POST', '/carrinho/atualizar', (ctx) => {
    h.salvarCarrinho(ctx, carrinhoModelo.atualizar(ctx.carrinho, ctx.body.produto_id, ctx.body.quantidade));
    return h.redirect('/carrinho');
  });

  r('POST', '/carrinho/remover', (ctx) => {
    h.salvarCarrinho(ctx, carrinhoModelo.remover(ctx.carrinho, ctx.body.produto_id));
    return h.redirect('/carrinho');
  });

  r('POST', '/carrinho/cupom', (ctx) => {
    const codigo = String(ctx.body.cupom ?? '').trim().toUpperCase();
    if (!codigo) {
      h.salvarCupom(ctx, '');
      h.flash(ctx, 'ok', 'Cupom removido.');
      return h.redirect('/carrinho');
    }
    const info = carrinhoModelo.validarCupom(codigo);
    if (!info) {
      h.salvarCupom(ctx, '');
      h.flash(ctx, 'erro', 'Cupom inválido ou expirado. Tente DOCE10 ou PRIMEIRACOMPRA.');
      return h.redirect('/carrinho');
    }
    h.salvarCupom(ctx, info.codigo);
    h.flash(ctx, 'ok', `Cupom ${info.codigo} aplicado (${info.descricao})!`);
    return h.redirect('/carrinho');
  });

  r('GET', '/checkout', (ctx) => {
    const resumo = detalharCarrinho(ctx);
    if (!resumo.itens.length) return h.redirect('/carrinho');
    return h.html(v.checkout(ctx, resumo));
  }, { login: true });

  r('POST', '/checkout', (ctx) => {
    const resumo = detalharCarrinho(ctx);
    try {
      const pedido = m.pedidos.criar(ctx.usuario.id, resumo, ctx.body);
      h.salvarCarrinho(ctx, {});
      h.salvarCupom(ctx, '');
      h.flash(ctx, 'ok', `Pedido #${pedido.id} confirmado com sucesso!`);
      return h.redirect(`/pedidos/${pedido.id}`);
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      return h.html(v.checkout(ctx, resumo, { erros: e.erros, dados: ctx.body }), 422);
    }
  }, { login: true });

  r('GET', '/pedidos', (ctx) => h.html(v.pedidosCliente(ctx, m.pedidos.listarPorUsuario(ctx.usuario.id))), { login: true });

  r('GET', '/pedidos/:id', (ctx) => {
    const p = m.pedidos.buscar(ctx.params.id);
    if (!p || (p.usuario_id !== ctx.usuario.id && ctx.usuario.perfil !== 'admin')) {
      return h.html(v.mensagem(ctx, 'Pedido não encontrado', 'Este pedido não existe ou não pertence à sua conta.'), 404);
    }
    return h.html(v.detalhePedido(ctx, p));
  }, { login: true });

  r('POST', '/pedidos/:id/cancelar', (ctx) => {
    try {
      const p = m.pedidos.cancelar(ctx.params.id, ctx.usuario.id);
      if (!p) return h.html(v.mensagem(ctx, 'Pedido não encontrado', 'Não foi possível localizar o pedido.'), 404);
      h.flash(ctx, 'ok', `Pedido #${p.id} foi cancelado.`);
      return h.redirect(`/pedidos/${p.id}`);
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      h.flash(ctx, 'erro', e.erros[0]);
      return h.redirect(`/pedidos/${ctx.params.id}`);
    }
  }, { login: true });

  r('POST', '/pedidos/:id/repetir', (ctx) => {
    const p = m.pedidos.buscar(ctx.params.id);
    if (!p || p.usuario_id !== ctx.usuario.id) {
      return h.html(v.mensagem(ctx, 'Pedido não encontrado', 'Não foi possível localizar o pedido.'), 404);
    }
    let novo = { ...ctx.carrinho };
    let adicionados = 0;
    for (const item of p.itens) {
      const prod = m.produtos.buscar(item.produto_id);
      if (prod && prod.disponivel) {
        novo = carrinhoModelo.adicionar(novo, prod.id, item.quantidade);
        adicionados += item.quantidade;
      }
    }
    h.salvarCarrinho(ctx, novo);
    if (adicionados === 0) {
      h.flash(ctx, 'erro', 'Os sabores deste pedido estão temporariamente pausados na vitrine.');
      return h.redirect(`/pedidos/${p.id}`);
    }
    h.flash(ctx, 'ok', 'Itens readicionados ao carrinho com sucesso!');
    return h.redirect('/carrinho');
  }, { login: true });
};
