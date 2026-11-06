// Regras de negócio do carrinho (Versão 2 - Corrigida e Atualizada pós-testes)
const LIMITE_POR_ITEM = 99;
const FRETE_FIXO_CENTAVOS = 700; // R$ 7,00
const META_FRETE_GRATIS = 6000;  // R$ 60,00

const CUPONS_VALIDOS = {
  DOCE10: { codigo: 'DOCE10', percentual: 10, descricao: '10% de desconto nos cupcakes' },
  PRIMEIRACOMPRA: { codigo: 'PRIMEIRACOMPRA', percentual: 15, descricao: '15% de desconto de boas-vindas' },
};

function limitar(q) {
  const n = Math.floor(Number(q));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(LIMITE_POR_ITEM, n));
}

function adicionar(carrinho, produtoId, quantidade = 1) {
  const q = limitar(quantidade);
  if (q <= 0) return { ...carrinho };
  const atual = carrinho[produtoId] || 0;
  return { ...carrinho, [produtoId]: Math.min(LIMITE_POR_ITEM, atual + q) };
}

function remover(carrinho, produtoId) {
  const novo = { ...carrinho };
  delete novo[produtoId];
  return novo;
}

function atualizar(carrinho, produtoId, quantidade) {
  const q = limitar(quantidade);
  return q <= 0 ? remover(carrinho, produtoId) : { ...carrinho, [produtoId]: q };
}

const calcularFrete = (subtotal) =>
  subtotal <= 0 || subtotal >= META_FRETE_GRATIS ? 0 : FRETE_FIXO_CENTAVOS;

function validarCupom(codigo) {
  const chave = String(codigo ?? '').trim().toUpperCase();
  return CUPONS_VALIDOS[chave] || null;
}

function detalhar(carrinho, buscarProduto, codigoCupom = '') {
  const itens = [];
  let subtotal = 0;
  for (const [idStr, qtd] of Object.entries(carrinho || {})) {
    const q = limitar(qtd);
    if (q <= 0) continue;
    const p = buscarProduto(Number(idStr));
    if (!p || !p.disponivel) continue;
    const subtotalItem = p.preco_centavos * q;
    subtotal += subtotalItem;
    itens.push({
      produto: p,
      quantidade: q,
      preco_unit_centavos: p.preco_centavos,
      subtotal_centavos: subtotalItem,
    });
  }
  const cupomInfo = subtotal > 0 ? validarCupom(codigoCupom) : null;
  const desconto = cupomInfo ? Math.round((subtotal * cupomInfo.percentual) / 100) : 0;
  const frete = calcularFrete(subtotal);
  const total = Math.max(1, subtotal - desconto + frete);
  return {
    itens,
    subtotal_centavos: subtotal,
    desconto_centavos: desconto,
    frete_centavos: frete,
    total_centavos: subtotal === 0 ? 0 : total,
    cupom_aplicado: cupomInfo ? cupomInfo.codigo : '',
  };
}

module.exports = {
  LIMITE_POR_ITEM,
  FRETE_FIXO_CENTAVOS,
  META_FRETE_GRATIS,
  CUPONS_VALIDOS,
  adicionar,
  remover,
  atualizar,
  calcularFrete,
  validarCupom,
  detalhar,
};
