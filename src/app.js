const fs = require('node:fs');
const path = require('node:path');
const criarModelos = require('./models');
const v = require('./views');

const PUBLIC = path.join(__dirname, '..', 'public');

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', (c) => {
      dados += c;
      if (dados.length > 100_000) {
        reject(new Error('Payload excede o limite'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(dados))));
    req.on('error', reject);
  });
}

function lerCookie(req, nome) {
  for (const parte of String(req.headers.cookie || '').split(';')) {
    const [k, ...resto] = parte.trim().split('=');
    if (k === nome) return resto.join('=');
  }
  return undefined;
}

function criarApp(db) {
  const m = criarModelos(db);
  const rotas = [];
  const r = (metodo, caminho, fn, opcoes = {}) => {
    const re = new RegExp('^' + caminho.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
    rotas.push({ metodo, re, fn, opcoes });
  };

  const h = {
    html: (corpo, status = 200, headers = {}) => ({
      status,
      headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
      corpo,
    }),
    redirect: (local) => ({ status: 303, headers: { location: local }, corpo: '' }),
    flash: (ctx, tipo, msg) => m.sessoes.definirFlash(ctx.sessao.token, { tipo, msg }),
    salvarCarrinho: (ctx, carrinho) => {
      ctx.carrinho = carrinho;
      m.sessoes.salvarCarrinho(ctx.sessao.token, carrinho);
    },
    salvarCupom: (ctx, cupom) => {
      ctx.cupom = cupom;
      if (m.sessoes.salvarCupom) m.sessoes.salvarCupom(ctx.sessao.token, cupom);
    },
  };

  require('./controllers/loja')(r, m, h);
  require('./controllers/conta')(r, m, h);
  require('./controllers/admin')(r, m, h);

  return async (req, res) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const url = urlObj.pathname;
      const query = Object.fromEntries(urlObj.searchParams);

      if (req.method === 'GET' && url === '/style.css') {
        res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
        return res.end(fs.readFileSync(path.join(PUBLIC, 'style.css')));
      }

      let sessao = m.sessoes.buscar(lerCookie(req, 'sid'));
      let setCookie = null;
      if (!sessao) {
        sessao = m.sessoes.criar();
        setCookie = `sid=${sessao.token}; Path=/; HttpOnly; SameSite=Lax`;
      }

      const ctx = {
        sessao,
        usuario: sessao.usuario_id ? m.usuarios.buscar(sessao.usuario_id) : null,
        carrinho: JSON.parse(sessao.carrinho || '{}'),
        cupom: sessao.cupom || '',
        aviso: m.sessoes.consumirFlash(sessao.token),
        params: {},
        query,
        body: {},
      };

      const rota = rotas.find((rt) => rt.metodo === req.method && rt.re.test(url));
      let resposta;
      if (!rota) {
        resposta = h.html(v.mensagem(ctx, 'Página não encontrada (404)', 'O endereço acessado não existe.'), 404);
      } else {
        ctx.params = url.match(rota.re).groups || {};
        if (rota.opcoes.login && !ctx.usuario) {
          h.flash(ctx, 'erro', 'Faça login para acessar esta funcionalidade.');
          resposta = h.redirect('/login');
        } else if (rota.opcoes.admin && ctx.usuario.perfil !== 'admin') {
          resposta = h.html(v.mensagem(ctx, 'Acesso restrito', 'Esta área é exclusiva para administradores da confeitaria.'), 403);
        } else {
          if (req.method === 'POST') ctx.body = await lerCorpo(req);
          resposta = await rota.fn(ctx);
        }
      }

      const headers = { ...resposta.headers };
      if (setCookie) headers['set-cookie'] = setCookie;
      res.writeHead(resposta.status, headers);
      res.end(resposta.corpo);
    } catch (e) {
      console.error(e);
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Erro interno no servidor.');
    }
  };
}

module.exports = { criarApp };
