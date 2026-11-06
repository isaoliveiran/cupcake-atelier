const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { abrirBanco } = require('../src/db');
const { criarApp } = require('../src/app');
const { popular } = require('../src/seed');

async function iniciar() {
  const db = abrirBanco();
  popular(db);
  const server = http.createServer(criarApp(db));
  await new Promise((ok) => server.listen(0, ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { db, server, base };
}

function cliente(base) {
  let cookie = '';
  async function req(metodo, caminho, dados) {
    const res = await fetch(base + caminho, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...(dados ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
      body: dados ? new URLSearchParams(dados).toString() : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { status: res.status, headers: res.headers, texto: await res.text() };
  }
  return { get: (c) => req('GET', c), post: (c, d) => req('POST', c, d) };
}

test('jornada ponta a ponta HTTP: vitrine, busca, cupom, checkout, repetir pedido e painel admin', async (t) => {
  const { server, base } = await iniciar();
  t.after(() => server.close());

  const cli = cliente(base);
  const home = await cli.get('/');
  assert.equal(home.status, 200);
  assert.match(home.texto, /Brigadeiro Belga/);

  // Testar busca na vitrine
  const busca = await cli.get('/?q=velvet');
  assert.match(busca.texto, /Red Velvet Real/);
  assert.doesNotMatch(busca.texto, /Limão Siciliano/);

  // Adicionar ao carrinho e aplicar cupom DOCE10
  await cli.post('/carrinho/adicionar', { produto_id: '1', quantidade: '2' });
  await cli.post('/carrinho/cupom', { cupom: 'DOCE10' });
  const car = await cli.get('/carrinho');
  assert.match(car.texto, /DOCE10/);

  // Cadastrar cliente e fechar pedido
  await cli.post('/cadastro', {
    nome: 'Laila Ferreira',
    email: 'laila@exemplo.com',
    senha: 'senha123',
    endereco: 'Av. Sete de Setembro, 900 - Centro',
  });
  const fim = await cli.post('/checkout', {
    endereco: 'Av. Sete de Setembro, 900 - Centro',
    pagamento: 'PIX',
    observacao: 'Sem guardanapos',
  });
  assert.equal(fim.status, 303);
  assert.equal(fim.headers.get('location'), '/pedidos/1');

  // Testar botão Repetir Pedido
  const rep = await cli.post('/pedidos/1/repetir', {});
  assert.equal(rep.status, 303);
  assert.equal(rep.headers.get('location'), '/carrinho');

  // Login Admin e avanço de status
  const adm = cliente(base);
  await adm.post('/login', { email: 'admin@cupcakeatelier.local', senha: 'admin123' });
  await adm.post('/admin/pedidos/1/status', {});
  const listaAdm = await adm.get('/admin/pedidos?status=Em%20preparo');
  assert.match(listaAdm.texto, /Laila Ferreira/);
});
