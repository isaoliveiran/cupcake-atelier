const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function abrirBanco(caminho = ':memory:') {
  const db = new DatabaseSync(caminho);
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
  return db;
}

module.exports = { abrirBanco };
