const http = require('node:http');
const { abrirBanco } = require('./src/db');
const { criarApp } = require('./src/app');
const { popular } = require('./src/seed');

const db = abrirBanco(process.env.DB_PATH || 'cupcake_atelier.sqlite');
popular(db, { adminSenha: process.env.ADMIN_SENHA || 'admin123' });

const porta = process.env.PORT || 3000;
http.createServer(criarApp(db)).listen(porta, () => {
  console.log(`🧁 Cupcake & Co. Atelier rodando em http://localhost:${porta}`);
  console.log(`🔑 Acesso Admin: admin@cupcakeatelier.local | Senha: ${process.env.ADMIN_SENHA || 'admin123'}`);
});
