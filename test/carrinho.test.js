const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../src/models/carrinho');

const catalogo = {
  1: { id: 1, nome: 'Brigadeiro Belga', preco_centavos: 1000, disponivel: 1 },
  2: { id: 2, nome: 'Red Velvet Real', preco_centavos: 1200, disponivel: 1 },
  3: { id: 3, nome: 'Indisponível', preco_centavos: 900, disponivel: 0 },
};
const buscar = (id) => catalogo[id];

test('adicionar soma quantidades e respeita o teto de 99 unidades', () => {
  let car = c.adicionar({}, 1, 2);
  car = c.adicionar(car, 1, 3);
  assert.equal(car[1], 5);
  assert.equal(c.adicionar({ 1: 95 }, 1, 20)[1], 99);
});

test('correção de bug: adicionar e atualizar rejeitam quantidades negativas ou inválidas', () => {
  assert.deepEqual(c.adicionar({}, 1, 0), {});
  assert.deepEqual(c.adicionar({}, 1, -5), {});
  assert.deepEqual(c.adicionar({}, 1, 'invalido'), {});
  assert.deepEqual(c.atualizar({ 1: 3 }, 1, -2), {});
});

test('atualizar com zero remove o item; remover exclui do carrinho', () => {
  assert.deepEqual(c.atualizar({ 1: 2 }, 1, 0), {});
  assert.equal(c.atualizar({ 1: 2 }, 1, 6)[1], 6);
  assert.deepEqual(c.remover({ 1: 2, 2: 1 }, 1), { 2: 1 });
});

test('detalhar ignora produtos indisponíveis e calcula frete grátis a partir de R$ 60,00', () => {
  const r1 = c.detalhar({ 1: 2, 3: 5 }, buscar); // R$ 20,00 + R$ 7,00 frete
  assert.equal(r1.itens.length, 1);
  assert.equal(r1.subtotal_centavos, 2000);
  assert.equal(r1.frete_centavos, 700);
  assert.equal(r1.total_centavos, 2700);

  const r2 = c.detalhar({ 2: 5 }, buscar); // R$ 60,00 -> frete grátis
  assert.equal(r2.subtotal_centavos, 6000);
  assert.equal(r2.frete_centavos, 0);
  assert.equal(r2.total_centavos, 6000);
});

test('melhoria cupom promocional: aplica DOCE10 (10%) e PRIMEIRACOMPRA (15%)', () => {
  const r = c.detalhar({ 1: 4 }, buscar, 'doce10'); // Subtotal 4000, desc 400, frete 700 -> total 4300
  assert.equal(r.cupom_aplicado, 'DOCE10');
  assert.equal(r.desconto_centavos, 400);
  assert.equal(r.total_centavos, 4300);

  const rInvalido = c.detalhar({ 1: 4 }, buscar, 'EXPIRADO99');
  assert.equal(rInvalido.cupom_aplicado, '');
  assert.equal(rInvalido.desconto_centavos, 0);
});
