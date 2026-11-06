const usuarios = require('./usuarios');
const produtos = require('./produtos');
const pedidos = require('./pedidos');
const sessoes = require('./sessoes');

module.exports = function criarModelos(db) {
  return {
    usuarios: usuarios(db),
    produtos: produtos(db),
    pedidos: pedidos(db),
    sessoes: sessoes(db),
  };
};
