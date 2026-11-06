const crypto = require('node:crypto');

module.exports = (db) => {
  const buscar = (token) => (token ? db.prepare('SELECT * FROM sessoes WHERE token = ?').get(token) : undefined);

  function criar() {
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessoes (token) VALUES (?)').run(token);
    return buscar(token);
  }

  const definirUsuario = (token, usuarioId) =>
    db.prepare('UPDATE sessoes SET usuario_id = ? WHERE token = ?').run(usuarioId, token);

  const salvarCarrinho = (token, carrinho) =>
    db.prepare('UPDATE sessoes SET carrinho = ? WHERE token = ?').run(JSON.stringify(carrinho), token);

  const salvarCupom = (token, cupom) =>
    db.prepare('UPDATE sessoes SET cupom = ? WHERE token = ?').run(String(cupom ?? '').trim().toUpperCase(), token);

  const definirFlash = (token, aviso) =>
    db.prepare('UPDATE sessoes SET flash = ? WHERE token = ?').run(aviso ? JSON.stringify(aviso) : '', token);

  function consumirFlash(token) {
    const s = buscar(token);
    if (!s || !s.flash) return null;
    definirFlash(token, null);
    return JSON.parse(s.flash);
  }

  const destruir = (token) => db.prepare('DELETE FROM sessoes WHERE token = ?').run(token);

  return { buscar, criar, definirUsuario, salvarCarrinho, salvarCupom, definirFlash, consumirFlash, destruir };
};
