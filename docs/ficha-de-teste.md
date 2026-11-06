# Fichas de Teste de Validação com Pares (Situação-Problema 3)

**Autora:** Isabelle Novais Oliveira | **RGM:** 39943780

Abaixo estão documentados os 5 ciclos de testes exploratórios realizados por colegas na Versão 1.0 da aplicação **Cupcake & Co. Atelier**, os quais embasaram as correções e melhorias da Versão 2.0.

---

### Avaliador 1: Bruna Martins Rocha
- **Data do teste:** 28/10/2026
- **O que testou e funcionou:** Cadastro de conta de cliente, visualização dos 6 sabores na vitrine, adição de cupcakes de Brigadeiro Belga e Ninho com Nutella ao carrinho, cálculo automático de frete grátis em compras acima de R$ 60,00 e finalização de pedido via PIX.
- **O que testou e não funcionou – O que deve ser corrigido:** Sentiu falta de uma barra de pesquisa e filtro por categoria na vitrine inicial para localizar sabores específicos (como "limão" ou categoria "Frutados") sem precisar rolar toda a página.
- **Funcionalidade não testada:** Acesso ao painel administrativo de cadastro de produtos (testou apenas com perfil de cliente).

---

### Avaliador 2: Hugo Henrique Gato
- **Data do teste:** 29/10/2026
- **O que testou e funcionou:** Login, alteração de quantidades no carrinho, remoção de item, validação de endereço obrigatório no checkout e visualização do histórico em "Meus Pedidos".
- **O que testou e não funcionou – O que deve ser corrigido:** Identificou um bug funcional na tela inicial: ao digitar um número negativo (ex.: `-2`) no campo de quantidade do card e clicar em "Adicionar", o sistema aceitava o valor e reduzia a quantidade no carrinho. Além disso, o horário do pedido aparecia em formato UTC de banco de dados (`AAAA-MM-DD HH:MM:SS`) em vez do padrão brasileiro (`DD/MM/AAAA HH:MM` no fuso de Brasília).
- **Funcionalidade não testada:** Cancelamento de pedido pelo cliente.

---

### Avaliador 3: Laila Silva Oliveira
- **Data do teste:** 30/10/2026
- **O que testou e funcionou:** Fluxo completo de compra com pagamento em "Cartão na entrega", inclusão de observação personalizada no pedido ("colocar vela de aniversário") e cancelamento de pedido enquanto estava com status "Recebido".
- **O que testou e não funcionou – O que deve ser corrigido:** Ao clicar no botão "Cancelar Pedido", o cancelamento ocorreu imediatamente sem nenhuma caixa de confirmação, gerando risco de cancelamento acidental pelo usuário. Também sugeriu incluir um botão "Repetir Pedido" para readicionar rapidamente os mesmos cupcakes ao carrinho em compras futuras.
- **Funcionalidade não testada:** Edição de preços de sabores no módulo administrativo.

---

### Avaliador 4: Lucas Mendes Cavalcanti
- **Data do teste:** 31/10/2026
- **O que testou e funcionou:** Painel administrativo completo (`/admin/produtos` e `/admin/pedidos`), cadastro de um novo sabor ("Pistache com Framboesa"), pausa de disponibilidade de sabor esgotado (verificando que ele sumiu imediatamente da vitrine do cliente) e avanço de status do pedido (`Recebido` -> `Em preparo` -> `Saiu para entrega` -> `Entregue`).
- **O que testou e não funcionou – O que deve ser corrigido:** Na tela administrativa de gestão de pedidos (`/admin/pedidos`), todos os pedidos (inclusive os já entregues e cancelados) ficavam misturados na mesma listagem. Sugeriu criar botões de filtro rápido por status para facilitar a operação da cozinha.
- **Funcionalidade não testada:** Fluxo de criação de nova conta de cliente (utilizou a credencial de administrador fornecida).

---

### Avaliador 5: Mariana Costa Alencar
- **Data do teste:** 01/11/2026
- **O que testou e funcionou:** Responsividade da interface em tela mobile/tablet, proteção de rotas restritas (redirecionamento para `/login` ao tentar acessar `/checkout` deslogada) e tratamento de mensagens de erro ao tentar cadastrar e-mail duplicado ou senha menor que 6 caracteres.
- **O que testou e não funcionou – O que deve ser corrigido:** Apontou que uma história de usuário prevista na concepção da loja — a aplicação de cupom promocional de desconto no carrinho — ainda não estava disponível na tela de carrinho.
- **Funcionalidade não testada:** Integração com gateway externo de pagamento real (o sistema utiliza simulação de pagamento PIX/Cartão conforme escopo acadêmico).
