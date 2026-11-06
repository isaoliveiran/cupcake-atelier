const { ErroValidacao, parsePreco } = require('../util');

module.exports = (db) => {
  function validar(dados) {
    const erros = [];
    const nome = String(dados.nome ?? '').trim();
    const descricao = String(dados.descricao ?? '').trim();
    const categoria = String(dados.categoria ?? 'Clássicos').trim() || 'Clássicos';
    const emoji = String(dados.emoji ?? '').trim() || '🧁';
    const preco = parsePreco(dados.preco);
    if (nome.length < 2) erros.push('Informe o nome do cupcake.');
    if (preco === null) erros.push('Informe um preço válido maior que zero (ex.: 9,50).');
    if (erros.length) throw new ErroValidacao(erros);
    return { nome, descricao, categoria, emoji, preco_centavos: preco };
  }

  function listar({ apenasDisponiveis = false, busca = '', categoria = '' } = {}) {
    const conds = [];
    const params = [];
    if (apenasDisponiveis) conds.push('disponivel = 1');
    const termo = String(busca ?? '').trim().toLowerCase();
    if (termo) {
      conds.push('(lower(nome) LIKE ? OR lower(descricao) LIKE ?)');
      params.push(`%${termo}%`, `%${termo}%`);
    }
    const cat = String(categoria ?? '').trim();
    if (cat) {
      conds.push('categoria = ?');
      params.push(cat);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return db.prepare(`SELECT * FROM produtos ${where} ORDER BY nome`).all(...params);
  }

  const buscar = (id) => db.prepare('SELECT * FROM produtos WHERE id = ?').get(Number(id));

  function criar(dados) {
    const v = validar(dados);
    const r = db
      .prepare('INSERT INTO produtos (nome, descricao, categoria, preco_centavos, emoji) VALUES (?, ?, ?, ?, ?)')
      .run(v.nome, v.descricao, v.categoria, v.preco_centavos, v.emoji);
    return buscar(r.lastInsertRowid);
  }

  function atualizar(id, dados) {
    if (!buscar(id)) return null;
    const v = validar(dados);
    db.prepare('UPDATE produtos SET nome = ?, descricao = ?, categoria = ?, preco_centavos = ?, emoji = ? WHERE id = ?')
      .run(v.nome, v.descricao, v.categoria, v.preco_centavos, v.emoji, Number(id));
    return buscar(id);
  }

  function alternarDisponibilidade(id) {
    const atual = buscar(id);
    if (!atual) return null;
    const novo = atual.disponivel ? 0 : 1;
    db.prepare('UPDATE produtos SET disponivel = ? WHERE id = ?').run(novo, Number(id));
    return buscar(id);
  }

  return { listar, buscar, criar, atualizar, alternarDisponibilidade };
};
