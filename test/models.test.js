const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirBanco } = require('../src/db');
const criarModelos = require('../src/models');
const carrinho = require('../src/models/carrinho');
const { parsePreco, esc, formatarDataBr, ErroValidacao } = require('../src/util');

const novo = () => criarModelos(abrirBanco());

test('parsePreco converte formatos brasileiros e rejeita valores <= 0', () => {
  assert.equal(parsePreco('9,50'), 950);
  assert.equal(parsePreco('11.5'), 1150);
  assert.equal(parsePreco('1.250,00'), 125000);
  for (const inv of ['', 'abc', '0', '-10', null]) assert.equal(parsePreco(inv), null);
});

test('esc neutraliza caracteres especiais contra XSS', () => {
  assert.equal(esc('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

test('formatarDataBr converte timestamp UTC do SQLite para padrão brasileiro DD/MM/AAAA', () => {
  const f = formatarDataBr('2026-10-25 17:30:00');
  assert.match(f, /^25\/10\/2026.*14:30$/);
});

test('usuários: cadastro com hash scrypt, bloqueio de e-mail duplicado e autenticação', () => {
  const m = novo();
  const u = m.usuarios.criar({ nome: 'Bruna Martins', email: 'BRUNA@email.com', senha: '123456' });
  assert.equal(u.email, 'bruna@email.com');
  assert.ok(m.usuarios.autenticar('bruna@email.com', '123456'));
  assert.equal(m.usuarios.autenticar('bruna@email.com', 'errada'), null);
  assert.throws(() => m.usuarios.criar({ nome: 'Outra', email: 'bruna@email.com', senha: '123456' }), ErroValidacao);
});

test('produtos: cadastro, busca por termo/categoria e alternância de disponibilidade', () => {
  const m = novo();
  const p1 = m.produtos.criar({ nome: 'Ninho com Nutella', descricao: 'Pura avelã', categoria: 'Especiais', preco: '12,00' });
  m.produtos.criar({ nome: 'Limão Siciliano', descricao: 'Cítrico com merengue', categoria: 'Frutados', preco: '10,50' });

  assert.equal(m.produtos.listar({ busca: 'nutella' }).length, 1);
  assert.equal(m.produtos.listar({ categoria: 'Frutados' }).length, 1);
  assert.equal(m.produtos.listar({ busca: 'inexistente' }).length, 0);

  const pausado = m.produtos.alternarDisponibilidade(p1.id);
  assert.equal(pausado.disponivel, 0);
  assert.equal(m.produtos.listar({ apenasDisponiveis: true }).length, 1);
});

test('pedidos: fluxo completo de status, filtro administrativo e regras de cancelamento', () => {
  const m = novo();
  const u = m.usuarios.criar({ nome: 'Hugo Silva', email: 'hugo@teste.com', senha: '123456' });
  const p = m.produtos.criar({ nome: 'Brigadeiro Belga', preco: '9,50' });
  const resumo = carrinho.detalhar({ [p.id]: 2 }, m.produtos.buscar, 'DOCE10');

  const ped = m.pedidos.criar(u.id, resumo, {
    endereco: 'Rua Minas Gerais, 200, Centro',
    pagamento: 'PIX',
    observacao: 'Entregar na portaria',
  });
  assert.equal(ped.status, 'Recebido');
  assert.equal(ped.cupom_aplicado, 'DOCE10');
  assert.equal(ped.desconto_centavos, 190);

  assert.equal(m.pedidos.avancarStatus(ped.id).status, 'Em preparo');
  assert.equal(m.pedidos.listarTodos({ status: 'Em preparo' }).length, 1);
  assert.equal(m.pedidos.listarTodos({ status: 'Recebido' }).length, 0);

  // Não permite cancelar pedido que já entrou em preparo
  assert.throws(() => m.pedidos.cancelar(ped.id, u.id), ErroValidacao);
});
