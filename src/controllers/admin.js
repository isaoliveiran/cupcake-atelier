const v = require('../views');
const { ErroValidacao } = require('../util');

module.exports = (r, m, h) => {
  const adm = { login: true, admin: true };

  r('GET', '/admin/produtos', (ctx) => h.html(v.adminProdutos(ctx, m.produtos.listar())), adm);

  r('GET', '/admin/produtos/novo', (ctx) => h.html(v.formProduto(ctx, { acao: '/admin/produtos' })), adm);

  r('POST', '/admin/produtos', (ctx) => {
    try {
      m.produtos.criar(ctx.body);
      h.flash(ctx, 'ok', 'Novo sabor cadastrado na vitrine.');
      return h.redirect('/admin/produtos');
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      return h.html(v.formProduto(ctx, { produto: ctx.body, erros: e.erros, acao: '/admin/produtos' }), 422);
    }
  }, adm);

  r('GET', '/admin/produtos/:id/editar', (ctx) => {
    const p = m.produtos.buscar(ctx.params.id);
    if (!p) return h.html(v.mensagem(ctx, 'Sabor não encontrado', 'Este sabor não existe.'), 404);
    return h.html(v.formProduto(ctx, { produto: p, acao: `/admin/produtos/${p.id}` }));
  }, adm);

  r('POST', '/admin/produtos/:id', (ctx) => {
    try {
      const p = m.produtos.atualizar(ctx.params.id, ctx.body);
      if (!p) return h.html(v.mensagem(ctx, 'Sabor não encontrado', 'Este sabor não existe.'), 404);
      h.flash(ctx, 'ok', 'Dados do cupcake atualizados.');
      return h.redirect('/admin/produtos');
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      return h.html(
        v.formProduto(ctx, { produto: { ...ctx.body, id: ctx.params.id }, erros: e.erros, acao: `/admin/produtos/${ctx.params.id}` }),
        422
      );
    }
  }, adm);

  r('POST', '/admin/produtos/:id/alternar', (ctx) => {
    m.produtos.alternarDisponibilidade(ctx.params.id);
    return h.redirect('/admin/produtos');
  }, adm);

  r('GET', '/admin/pedidos', (ctx) => {
    const statusFiltro = ctx.query?.status || '';
    return h.html(v.adminPedidos(ctx, m.pedidos.listarTodos({ status: statusFiltro }), { statusFiltro }));
  }, adm);

  r('POST', '/admin/pedidos/:id/status', (ctx) => {
    try {
      const p = m.pedidos.avancarStatus(ctx.params.id);
      if (p) h.flash(ctx, 'ok', `Pedido #${p.id} atualizado para "${p.status}".`);
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      h.flash(ctx, 'erro', e.erros[0]);
    }
    return h.redirect('/admin/pedidos');
  }, adm);
};
