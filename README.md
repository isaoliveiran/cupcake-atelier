# 🧁 Cupcake & Co. Atelier — Sistema Web de Vendas e Delivery de Cupcakes

Projeto desenvolvido para a disciplina **Projeto Integrador Transdisciplinar em Engenharia de Software II** (Cruzeiro do Sul Virtual).
- **Autora:** Isabelle Novais Oliveira
- **RGM:** 39943780

## Arquitetura e Tecnologias
Aplicação web estruturada no padrão arquitetural **MVC (Model-View-Controller)** utilizando **Node.js** e **SQLite** nativo (`node:sqlite`), sem dependências externas pesadas:
- **Model (`src/models/`):** Regras de negócio, persistência SQLite, validação de domínio, cálculo de frete/cupons e gestão de sessões.
- **View (`src/views/` e `public/style.css`):** Camada de apresentação SSR (Server-Side Rendering) responsiva, acessível e aderente às heurísticas de IHC/UX.
- **Controller (`src/controllers/`):** Controladores separados por contexto (`loja.js`, `conta.js` e `admin.js`).
- **Banco de Dados (`db/schema.sql`):** Projeto físico relacional normalizado em SQLite com restrições de integridade (`CHECK`, `UNIQUE`, `FOREIGN KEY`).
- **Testes Automatizados (`test/`):** Testes unitários e de integração HTTP com `node:test`.

## Pré-requisitos
- **Node.js 22.13+** (possui os módulos nativos `node:sqlite` e `node:test` embutidos).

## Como Executar Localmente
```bash
# Iniciar o servidor web (http://localhost:3000)
npm start

# Executar a suíte de testes automatizados (Verificação e Validação)
npm test
```

## Credenciais de Demonstração (Seed Automático)
Na primeira execução, o banco é populado automaticamente com 6 sabores de cupcakes e uma conta administrativa:
- **E-mail Admin:** `admin@cupcakeatelier.local`
- **Senha Admin:** `admin123`

## Documentação Técnica (`docs/`)
- [`docs/diagrama-de-classes.md`](docs/diagrama-de-classes.md): Modelagem UML (Classes, Casos de Uso e Fluxo MVC).
- [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md): Projeto físico e Dicionário de Dados das 5 tabelas SQLite.
- [`docs/ficha-de-teste.md`](docs/ficha-de-teste.md): Template de avaliação e registros dos 5 testes realizados por pares.
- [`docs/laudo-de-qualidade.md`](docs/laudo-de-qualidade.md): Laudo Técnico de Qualidade consolidando bugs corrigidos, melhorias de UX e resultados da suíte de testes.
