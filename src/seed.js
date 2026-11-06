const criarModelos = require('./models');

function popular(db, { adminSenha = 'admin123' } = {}) {
  const m = criarModelos(db);
  if (!m.usuarios.buscarPorEmail('admin@cupcakeatelier.local')) {
    m.usuarios.criar({
      nome: 'Isabelle Oliveira (Admin)',
      email: 'admin@cupcakeatelier.local',
      senha: adminSenha,
      perfil: 'admin',
      endereco: 'Av. Primeiro de Junho, 450 - Centro, Divinópolis - MG',
    });
  }
  if (!m.produtos.listar().length) {
    [
      ['Brigadeiro Belga', 'Massa fofinha de cacau 50% com recheio e topo de brigadeiro gourmet', 'Clássicos', '9,50', '🍫'],
      ['Red Velvet Real', 'Massa aveludada vermelha com frosting cremoso de cream cheese e toque de baunilha', 'Especiais', '11,00', '❤️'],
      ['Ninho com Nutella', 'Massa de baunilha recheada com Nutella pura e cobertura de mousse de Leite Ninho', 'Especiais', '12,00', '🌰'],
      ['Morango Nordeste', 'Massa branca leve com compota artesanal de morangos frescos e chantininho', 'Frutados', '10,00', '🍓'],
      ['Limão Siciliano & Merengue', 'Massa cítrica recheada com curd de limão siciliano e merengue maçaricado', 'Frutados', '10,50', '🍋'],
      ['Doce de Leite Mineiro', 'Massa amanteigada com doce de leite artesanal da Canastra e flor de sal', 'Clássicos', '9,90', '🍯'],
    ].forEach(([nome, descricao, categoria, preco, emoji]) =>
      m.produtos.criar({ nome, descricao, categoria, preco, emoji })
    );
  }
}

module.exports = { popular };
