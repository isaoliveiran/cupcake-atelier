const { ErroValidacao, hashSenha, verificarSenha } = require('../util');

module.exports = (db) => {
  const buscar = (id) =>
    db.prepare('SELECT id, nome, email, perfil, endereco FROM usuarios WHERE id = ?').get(Number(id));

  const buscarPorEmail = (email) =>
    db.prepare('SELECT * FROM usuarios WHERE email = ?').get(String(email ?? '').trim().toLowerCase());

  function criar({ nome, email, senha, endereco = '', perfil = 'cliente' }) {
    nome = String(nome ?? '').trim();
    email = String(email ?? '').trim().toLowerCase();
    senha = String(senha ?? '');
    endereco = String(endereco ?? '').trim();
    const erros = [];
    if (nome.length < 2) erros.push('Informe seu nome completo (mínimo 2 caracteres).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('Informe um endereço de e-mail válido.');
    if (senha.length < 6) erros.push('A senha deve ter pelo menos 6 caracteres.');
    if (!erros.length && buscarPorEmail(email)) erros.push('Este e-mail já está cadastrado.');
    if (erros.length) throw new ErroValidacao(erros);

    const r = db
      .prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil, endereco) VALUES (?, ?, ?, ?, ?)')
      .run(nome, email, hashSenha(senha), perfil, endereco);
    return buscar(r.lastInsertRowid);
  }

  function autenticar(email, senha) {
    const u = buscarPorEmail(email);
    if (!u || !verificarSenha(senha, u.senha_hash)) return null;
    return buscar(u.id);
  }

  function atualizarEndereco(id, endereco) {
    endereco = String(endereco ?? '').trim();
    if (endereco.length < 5) throw new ErroValidacao(['Informe um endereço válido (mínimo 5 caracteres).']);
    db.prepare('UPDATE usuarios SET endereco = ? WHERE id = ?').run(endereco, Number(id));
    return buscar(id);
  }

  return { buscar, buscarPorEmail, criar, autenticar, atualizarEndereco };
};
