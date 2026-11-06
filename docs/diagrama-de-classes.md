# Modelagem UML Atualizada (Kaizen — PIT I para PIT II)

**Autora:** Isabelle Novais Oliveira | **RGM:** 39943780

## 1. Diagrama de Classes de Persistência e Domínio (Mermaid)

```mermaid
classDiagram
  class Usuario {
    +int id
    +string nome
    +string email
    +string senhaHash
    +string perfil
    +string endereco
    +string criadoEm
    +criar(dados)
    +autenticar(email, senha)
  }

  class Produto {
    +int id
    +string nome
    +string descricao
    +string categoria
    +int precoCentavos
    +string emoji
    +bool disponivel
    +listar(filtros)
    +criar(dados)
    +atualizar(id, dados)
    +alternarDisponibilidade(id)
  }

  class Pedido {
    +int id
    +int usuarioId
    +string status
    +int subtotalCentavos
    +int descontoCentavos
    +int freteCentavos
    +int totalCentavos
    +string cupomAplicado
    +string enderecoEntrega
    +string formaPagamento
    +string observacao
    +string criadoEm
    +criar(usuarioId, resumo, dados)
    +avancarStatus(id)
    +cancelar(id, usuarioId)
  }

  class ItemPedido {
    +int id
    +int pedidoId
    +int produtoId
    +int quantidade
    +int precoUnitCentavos
  }

  class Carrinho {
    +adicionar(carrinho, produtoId, qtd)
    +atualizar(carrinho, produtoId, qtd)
    +remover(carrinho, produtoId)
    +validarCupom(codigo)
    +detalhar(carrinho, buscarProduto, cupom)
  }

  Usuario "1" --> "0..*" Pedido : realiza
  Pedido "1" *-- "1..*" ItemPedido : composto por
  Produto "1" --> "0..*" ItemPedido : referenciado em
  Carrinho ..> Produto : consulta preço e disponibilidade
```

## 2. Revisão de Requisitos e Histórias de Usuário (Backlog Implementado)
- **HU01 (Vitrine e Busca):** Como cliente, desejo visualizar os cupcakes disponíveis e filtrar por nome, ingrediente ou categoria para encontrar rapidamente meu sabor favorito.
- **HU02 (Carrinho e Cupom):** Como cliente, desejo adicionar itens ao carrinho, alterar quantidades, aplicar cupons de desconto (`DOCE10`, `PRIMEIRACOMPRA`) e ter cálculo automático de frete (grátis a partir de R$ 60,00).
- **HU03 (Cadastro e Autenticação):** Como cliente, desejo criar minha conta com endereço padrão e realizar login seguro com senha criptografada (`scrypt`).
- **HU04 (Checkout e Acompanhamento):** Como cliente, desejo finalizar meu pedido escolhendo a forma de pagamento (PIX, Cartão na entrega ou Dinheiro), acompanhar a mudança de status em tempo real, cancelar pedidos ainda não iniciados ou repetir um pedido anterior.
- **HU05 (Gestão Administrativa):** Como administrador da confeitaria, desejo cadastrar e editar sabores, pausar produtos esgotados e gerenciar a fila de pedidos filtrando por status (`Recebido`, `Em preparo`, `Saiu para entrega`, `Entregue`, `Cancelado`).
