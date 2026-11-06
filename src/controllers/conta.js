const v = require('../views');
const { ErroValidacao } = require('../util');

module.exports = (r, m, h) => {
  r('GET', '/login', (ctx) => h.html(v.login(ctx)));

  r('POST', '/login', (ctx) => {
    const u = m.usuarios.autenticar(ctx.body.email, ctx.body.senha);
    if (!u) {
      return h.html(v.login(ctx, { erros: ['E-mail ou senha incorretos.'], email: ctx.body.email }), 401);
    }
    m.sessoes.definirUsuario(ctx.sessao.token, u.id);
    h.flash(ctx, 'ok', `Olá, ${u.nome.split(' ')[0]}! Que bom ver você por aqui.`);
    return h.redirect(u.perfil === 'admin' ? '/admin/pedidos' : '/');
  });

  r('GET', '/cadastro', (ctx) => h.html(v.cadastro(ctx)));

  r('POST', '/cadastro', (ctx) => {
    try {
      const u = m.usuarios.criar(ctx.body);
      m.sessoes.definirUsuario(ctx.sessao.token, u.id);
      h.flash(ctx, 'ok', 'Sua conta foi criada com sucesso!');
      return h.redirect('/');
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e;
      return h.html(v.cadastro(ctx, { erros: e.erros, dados: ctx.body }), 422);
    }
  });

  r('POST', '/sair', (ctx) => {
    m.sessoes.destruir(ctx.sessao.token);
    return h.redirect('/');
  });
};
