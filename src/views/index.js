const { esc, brl, formatarDataBr } = require('../util');
const { FORMAS_PAGAMENTO, PROXIMO_STATUS } = require('../models/pedidos')({});

function layout(ctx, titulo, corpo) {
  const u = ctx.usuario;
  const qtd = Object.values(ctx.carrinho || {}).reduce((s, n) => s + n, 0);
  const aviso = ctx.aviso
    ? `<div class="aviso aviso-${esc(ctx.aviso.tipo)}" role="status">${esc(ctx.aviso.msg)}</div>`
    : '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · Cupcake & Co. Atelier</title>
<link rel="stylesheet" href="/style.css"></head>
<body>
<header class="topo">
  <a class="logo" href="/">🧁 Cupcake &amp; Co. Atelier</a>
  <nav>
    <a href="/">Vitrine</a>
    <a href="/carrinho">Carrinho (${qtd})</a>
    ${u ? `<a href="/pedidos">Meus Pedidos</a>` : ''}
    ${u && u.perfil === 'admin' ? `<a href="/admin/produtos">Gerenciar Sabores</a><a href="/admin/pedidos">Painel de Pedidos</a>` : ''}
    ${u
      ? `<form method="post" action="/sair" class="inline"><button class="link">Sair (${esc(u.nome.split(' ')[0])})</button></form>`
      : `<a href="/login">Entrar</a><a class="btn btn-pequeno" href="/cadastro">Criar Conta</a>`}
  </nav>
</header>
<main class="container">${aviso}${corpo}</main>
<footer class="rodape">Cupcake &amp; Co. Atelier · Projeto Integrador II · Engenharia de Software · Isabelle Novais Oliveira (RGM 39943780)</footer>
</body></html>`;
}

function listaErros(erros) {
  if (!erros || !erros.length) return '';
  return `<ul class="erros">${erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
}

function cardapio(ctx, produtos, { busca = '', categoria = '' } = {}) {
  const categorias = ['Clássicos', 'Especiais', 'Frutados'];
  const cards = produtos
    .map(
      (p) => `<article class="card">
      <div class="emoji" aria-hidden="true">${esc(p.emoji)}</div>
      <span class="tag-cat">${esc(p.categoria)}</span>
      <h2>${esc(p.nome)}</h2>
      <p class="desc">${esc(p.descricao)}</p>
      <p class="preco">${brl(p.preco_centavos)}</p>
      <form method="post" action="/carrinho/adicionar" class="linha">
        <input type="hidden" name="produto_id" value="${p.id}">
        <label class="sr" for="q${p.id}">Quantidade</label>
        <input id="q${p.id}" type="number" name="quantidade" value="1" min="1" max="99" class="qtd">
        <button class="btn">Adicionar</button>
      </form>
    </article>`
    )
    .join('');

  const vazio = (busca || categoria)
    ? `<p>Nenhum sabor encontrado para o filtro selecionado. <a href="/">Limpar filtros e ver todos</a></p>`
    : '<p>Nenhum sabor disponível no momento.</p>';

  return layout(
    ctx,
    'Vitrine de Cupcakes',
    `<section class="hero">
      <h1>Cupcakes artesanais assados todos os dias</h1>
      <p>Escolha seus sabores favoritos. Entrega rápida por R$ 7,00 ou <strong>frete grátis</strong> acima de R$ 60,00! Use o cupom <strong>DOCE10</strong> para 10% OFF.</p>
      <form method="get" action="/" class="busca">
        <input type="search" name="q" value="${esc(busca)}" placeholder="Buscar por sabor ou ingrediente (ex.: nutella, limão)..." aria-label="Buscar sabor">
        <select name="categoria" aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          ${categorias.map((c) => `<option value="${esc(c)}" ${categoria === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
        <button class="btn">Filtrar</button>
        ${(busca || categoria) ? `<a class="btn btn-sec" href="/">Limpar</a>` : ''}
      </form>
    </section>
    <section class="grade">${cards || vazio}</section>`
  );
}

function carrinho(ctx, resumo) {
  if (!resumo.itens.length) {
    return layout(
      ctx,
      'Seu Carrinho',
      `<h1>Seu Carrinho</h1><p>Seu carrinho ainda está vazio.</p><p><a class="btn" href="/">Explorar vitrine de cupcakes</a></p>`
    );
  }
  const linhas = resumo.itens
    .map(
      (i) => `<tr>
      <td>${esc(i.produto.emoji)} <strong>${esc(i.produto.nome)}</strong></td>
      <td>${brl(i.preco_unit_centavos)}</td>
      <td>
        <form method="post" action="/carrinho/atualizar" class="linha">
          <input type="hidden" name="produto_id" value="${i.produto.id}">
          <input type="number" name="quantidade" value="${i.quantidade}" min="0" max="99" class="qtd">
          <button class="btn btn-sec">Atualizar</button>
        </form>
      </td>
      <td>${brl(i.subtotal_centavos)}</td>
      <td>
        <form method="post" action="/carrinho/remover">
          <input type="hidden" name="produto_id" value="${i.produto.id}">
          <button class="link perigo">Remover</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return layout(
    ctx,
    'Seu Carrinho',
    `<h1>Seu Carrinho</h1>
    <table class="tabela">
      <thead><tr><th>Sabor</th><th>Preço Unit.</th><th>Quantidade</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="cupom-box">
      <form method="post" action="/carrinho/cupom" class="linha">
        <label for="cupom-input"><strong>Cupom promocional:</strong></label>
        <input id="cupom-input" type="text" name="cupom" value="${esc(resumo.cupom_aplicado)}" placeholder="Ex.: DOCE10">
        <button class="btn btn-sec">Aplicar Cupom</button>
      </form>
      ${resumo.cupom_aplicado ? `<p class="tag-ok">Cupom <strong>${esc(resumo.cupom_aplicado)}</strong> aplicado (-${brl(resumo.desconto_centavos)})!</p>` : ''}
    </div>
    <div class="totais">
      <p>Subtotal dos itens: <strong>${brl(resumo.subtotal_centavos)}</strong></p>
      ${resumo.desconto_centavos > 0 ? `<p class="desconto">Desconto (${esc(resumo.cupom_aplicado)}): <strong>- ${brl(resumo.desconto_centavos)}</strong></p>` : ''}
      <p>Taxa de entrega: <strong>${resumo.frete_centavos === 0 ? 'Grátis' : brl(resumo.frete_centavos)}</strong></p>
      <p class="total">Total do pedido: <strong>${brl(resumo.total_centavos)}</strong></p>
      <div class="acoes">
        <a class="btn btn-sec" href="/">Continuar comprando</a>
        <a class="btn" href="/checkout">Avançar para pagamento</a>
      </div>
    </div>`
  );
}

function checkout(ctx, resumo, { erros = [], dados = {} } = {}) {
  const endereco = dados.endereco ?? ctx.usuario?.endereco ?? '';
  const pagamento = dados.pagamento ?? 'PIX';
  const observacao = dados.observacao ?? '';
  const opcoes = FORMAS_PAGAMENTO.map(
    (f) => `<label class="radio"><input type="radio" name="pagamento" value="${esc(f)}" ${pagamento === f ? 'checked' : ''}> ${esc(f)}</label>`
  ).join('');

  return layout(
    ctx,
    'Finalizar Pedido',
    `<h1>Finalizar Pedido</h1>
    ${listaErros(erros)}
    <div class="colunas">
      <form method="post" action="/checkout" class="form">
        <label>Endereço completo de entrega
          <input type="text" name="endereco" value="${esc(endereco)}" required placeholder="Rua, número, bairro e complemento">
        </label>
        <fieldset><legend>Forma de pagamento</legend>${opcoes}</fieldset>
        <label>Observações para a confeitaria (opcional)
          <textarea name="observacao" rows="2" maxlength="300" placeholder="Ex.: colocar vela de aniversário, tocar interfone 102...">${esc(observacao)}</textarea>
        </label>
        <button class="btn">Confirmar pedido (${brl(resumo.total_centavos)})</button>
      </form>
      <aside class="resumo">
        <h2>Resumo da Compra</h2>
        <ul>${resumo.itens.map((i) => `<li>${i.quantidade}x ${esc(i.produto.nome)} — ${brl(i.subtotal_centavos)}</li>`).join('')}</ul>
        ${resumo.desconto_centavos > 0 ? `<p>Desconto (${esc(resumo.cupom_aplicado)}): - ${brl(resumo.desconto_centavos)}</p>` : ''}
        <p>Entrega: ${resumo.frete_centavos === 0 ? 'Grátis' : brl(resumo.frete_centavos)}</p>
        <p class="total">Total: <strong>${brl(resumo.total_centavos)}</strong></p>
      </aside>
    </div>`
  );
}

function pedidosCliente(ctx, lista) {
  const itens = lista
    .map(
      (p) => `<article class="pedido">
      <header>
        <a href="/pedidos/${p.id}"><strong>Pedido #${p.id}</strong></a>
        <span class="badge status-${esc(p.status.toLowerCase().replace(/\s+/g, '-'))}">${esc(p.status)}</span>
        <span class="data">${esc(formatarDataBr(p.criado_em))}</span>
        <strong>${brl(p.total_centavos)}</strong>
      </header>
      <p>${p.itens.map((i) => `${i.quantidade}x ${esc(i.produto_nome)}`).join(', ')}</p>
    </article>`
    )
    .join('');

  return layout(ctx, 'Meus Pedidos', `<h1>Meus Pedidos</h1>${itens || '<p>Você ainda não realizou nenhum pedido.</p>'}`);
}

function detalhePedido(ctx, p) {
  const podeCancelar = p.status === 'Recebido' && ctx.usuario && ctx.usuario.id === p.usuario_id;
  return layout(
    ctx,
    `Pedido #${p.id}`,
    `<h1>Pedido #${p.id} <span class="badge">${esc(p.status)}</span></h1>
    <p class="meta">Realizado em ${esc(formatarDataBr(p.criado_em))} · Pagamento: <strong>${esc(p.forma_pagamento)}</strong></p>
    <p><strong>Endereço de entrega:</strong> ${esc(p.endereco_entrega)}</p>
    ${p.observacao ? `<p><strong>Observações:</strong> ${esc(p.observacao)}</p>` : ''}
    <table class="tabela">
      <thead><tr><th>Item</th><th>Qtd</th><th>Unitário</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${p.itens
          .map(
            (i) => `<tr><td>${esc(i.emoji)} ${esc(i.produto_nome)}</td><td>${i.quantidade}</td><td>${brl(i.preco_unit_centavos)}</td><td>${brl(i.preco_unit_centavos * i.quantidade)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="totais">
      <p>Subtotal: ${brl(p.subtotal_centavos)} ${p.desconto_centavos > 0 ? `· Desconto (${esc(p.cupom_aplicado)}): -${brl(p.desconto_centavos)}` : ''} · Frete: ${p.frete_centavos === 0 ? 'Grátis' : brl(p.frete_centavos)}</p>
      <p class="total">Total cobrado: <strong>${brl(p.total_centavos)}</strong></p>
    </div>
    <div class="acoes">
      <form method="post" action="/pedidos/${p.id}/repetir" class="inline">
        <button class="btn">Repetir Pedido</button>
      </form>
      ${podeCancelar ? `<form method="post" action="/pedidos/${p.id}/cancelar" class="inline" onsubmit="return confirm('Tem certeza que deseja cancelar o Pedido #${p.id}?');"><button class="btn perigo">Cancelar Pedido</button></form>` : ''}
      <a class="btn btn-sec" href="/pedidos">Voltar para meus pedidos</a>
    </div>`
  );
}

function login(ctx, { erros = [], email = '' } = {}) {
  return layout(
    ctx,
    'Entrar',
    `<h1>Acessar minha conta</h1>
    ${listaErros(erros)}
    <form method="post" action="/login" class="form estreito">
      <label>E-mail<input type="email" name="email" value="${esc(email)}" required></label>
      <label>Senha<input type="password" name="senha" required></label>
      <button class="btn">Entrar</button>
      <p>Novo por aqui? <a href="/cadastro">Crie sua conta rapidamente</a>.</p>
    </form>`
  );
}

function cadastro(ctx, { erros = [], dados = {} } = {}) {
  return layout(
    ctx,
    'Criar Conta',
    `<h1>Criar Conta de Cliente</h1>
    ${listaErros(erros)}
    <form method="post" action="/cadastro" class="form estreito">
      <label>Nome completo<input type="text" name="nome" value="${esc(dados.nome)}" required></label>
      <label>E-mail<input type="email" name="email" value="${esc(dados.email)}" required></label>
      <label>Senha (mínimo 6 caracteres)<input type="password" name="senha" required minlength="6"></label>
      <label>Endereço padrão para entregas<input type="text" name="endereco" value="${esc(dados.endereco)}" placeholder="Rua, número, bairro, cidade"></label>
      <button class="btn">Concluir Cadastro</button>
    </form>`
  );
}

function adminProdutos(ctx, lista) {
  const linhas = lista
    .map(
      (p) => `<tr>
      <td>${esc(p.emoji)} <strong>${esc(p.nome)}</strong><br><small>${esc(p.categoria)} — ${esc(p.descricao)}</small></td>
      <td>${brl(p.preco_centavos)}</td>
      <td>${p.disponivel ? '<span class="badge ok">Ativo na vitrine</span>' : '<span class="badge">Pausado</span>'}</td>
      <td class="acoes">
        <a class="btn btn-sec btn-pequeno" href="/admin/produtos/${p.id}/editar">Editar</a>
        <form method="post" action="/admin/produtos/${p.id}/alternar" class="inline">
          <button class="btn btn-sec btn-pequeno">${p.disponivel ? 'Pausar' : 'Ativar'}</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return layout(
    ctx,
    'Gerenciar Sabores (Admin)',
    `<div class="cabecalho-pagina">
      <h1>Catálogo de Sabores</h1>
      <a class="btn" href="/admin/produtos/novo">+ Cadastrar Novo Cupcake</a>
    </div>
    <table class="tabela">
      <thead><tr><th>Cupcake</th><th>Preço</th><th>Status na Vitrine</th><th>Ações</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>`
  );
}

function formProduto(ctx, { produto = {}, erros = [], acao = '/admin/produtos' } = {}) {
  const preco =
    produto.preco ?? (produto.preco_centavos ? (produto.preco_centavos / 100).toFixed(2).replace('.', ',') : '');
  return layout(
    ctx,
    produto.id ? 'Editar Cupcake' : 'Novo Cupcake',
    `<h1>${produto.id ? 'Editar Cupcake' : 'Cadastrar Novo Cupcake'}</h1>
    ${listaErros(erros)}
    <form method="post" action="${esc(acao)}" class="form estreito">
      <label>Nome do sabor<input type="text" name="nome" value="${esc(produto.nome)}" required></label>
      <label>Categoria<input type="text" name="categoria" value="${esc(produto.categoria || 'Clássicos')}" required></label>
      <label>Descrição detalhada<input type="text" name="descricao" value="${esc(produto.descricao)}"></label>
      <label>Preço unitário (R$)<input type="text" name="preco" value="${esc(preco)}" placeholder="9,50" required></label>
      <label>Emoji ilustrativo<input type="text" name="emoji" value="${esc(produto.emoji || '🧁')}" maxlength="4"></label>
      <div class="acoes">
        <button class="btn">Salvar Sabor</button>
        <a class="btn btn-sec" href="/admin/produtos">Cancelar</a>
      </div>
    </form>`
  );
}

const STATUS_PEDIDO = ['Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado'];

function adminPedidos(ctx, lista, { statusFiltro = '' } = {}) {
  const filtros = ['', ...STATUS_PEDIDO]
    .map((s) => {
      const rotulo = s || 'Todos';
      const ativo = s === statusFiltro ? 'btn' : 'btn btn-sec';
      const href = s ? `/admin/pedidos?status=${encodeURIComponent(s)}` : '/admin/pedidos';
      return `<a class="${ativo} btn-pequeno" href="${href}">${esc(rotulo)}</a>`;
    })
    .join(' ');

  const itens = lista
    .map((p) => {
      const prox = PROXIMO_STATUS[p.status];
      return `<article class="pedido">
        <header>
          <strong>#${p.id} · ${esc(p.cliente_nome)}</strong>
          <span class="badge">${esc(p.status)}</span>
          <span class="data">${esc(formatarDataBr(p.criado_em))}</span>
          <strong>${brl(p.total_centavos)} (${esc(p.forma_pagamento)})</strong>
        </header>
        <p><strong>Itens:</strong> ${p.itens.map((i) => `${i.quantidade}x ${esc(i.produto_nome)}`).join(', ')}</p>
        <p><strong>Entrega:</strong> ${esc(p.endereco_entrega)}${p.observacao ? ` · <em>Obs.: ${esc(p.observacao)}</em>` : ''}</p>
        ${prox ? `<form method="post" action="/admin/pedidos/${p.id}/status"><button class="btn btn-pequeno">Avançar para "${esc(prox)}"</button></form>` : ''}
      </article>`;
    })
    .join('');

  return layout(
    ctx,
    'Painel de Pedidos (Admin)',
    `<h1>Gestão de Pedidos da Confeitaria</h1>
    <div class="filtros" role="navigation" aria-label="Filtrar por status">${filtros}</div>
    ${itens || '<p>Nenhum pedido encontrado para este filtro.</p>'}`
  );
}

function mensagem(ctx, titulo, texto) {
  return layout(ctx, titulo, `<h1>${esc(titulo)}</h1><p>${esc(texto)}</p><p><a class="btn" href="/">Voltar para a Vitrine</a></p>`);
}

module.exports = {
  cardapio,
  carrinho,
  checkout,
  pedidosCliente,
  detalhePedido,
  login,
  cadastro,
  adminProdutos,
  formProduto,
  adminPedidos,
  mensagem,
};
