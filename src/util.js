const crypto = require('node:crypto');

class ErroValidacao extends Error {
  constructor(erros) {
    super(erros.join('; '));
    this.erros = erros;
  }
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

const brl = (centavos) =>
  (Number(centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarDataBr(isoUtc) {
  if (!isoUtc) return '';
  const d = new Date(isoUtc.includes('T') ? isoUtc : isoUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return String(isoUtc);
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parsePreco(valor) {
  let t = String(valor ?? '').trim();
  if (!t) return null;
  t = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verificarSenha(senha, armazenado) {
  const [salt, hash] = String(armazenado || '').split(':');
  if (!salt || !hash) return false;
  const tentativa = crypto.scryptSync(String(senha ?? ''), salt, 64);
  const esperado = Buffer.from(hash, 'hex');
  return tentativa.length === esperado.length && crypto.timingSafeEqual(tentativa, esperado);
}

module.exports = { ErroValidacao, esc, brl, formatarDataBr, parsePreco, hashSenha, verificarSenha };
