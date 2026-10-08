# Dona Clara Empório — pedidos e encomendas online

Web app para a **Panificadora & Empório Dona Clara**, padaria artesanal de bairro com 12 anos de história.
Projeto da disciplina **Design Profissional** (Prof. Sedenilso Antonio Machado, Universidade Positivo) — Estudo de Caso 1.

## 1. Briefing do problema

| | |
|---|---|
| **Cliente** | Clara (produção) e Roberto (financeiro); 2 padeiros, 1 confeiteira, 3 atendentes |
| **Situação** | Vendas só no balcão; encomendas anotadas à mão em caderno |
| **Dor** | Moradores em home office não querem enfrentar fila nem arriscar encontrar o pão esgotado; encomendas de eventos têm atrasos e troca de sabores; duas redes gourmet digitais chegaram a 2 km |
| **Diferencial a preservar** | Tradição e qualidade artesanal |

**Objetivo:** permitir que o cliente veja o que ainda há hoje, reserve para retirada e faça encomendas de eventos sem ligar, e que a equipe tenha todos os pedidos em um só lugar, sem caderno.

## 2. Por que um web app (e não app móvel ou site institucional)

- **Sem instalação:** o vizinho abre o link do WhatsApp ou do Instagram e já pede. Um app nativo exigiria baixar algo para comprar um pão.
- **Resolve a dor operacional**, não só a presença digital: um site institucional mostraria o cardápio, mas não eliminaria o caderno nem os erros de encomenda.
- **Baixo custo e manutenção** para um negócio familiar: um servidor simples, sem mensalidade de plataforma.
- **Evolução natural:** o mesmo web app pode virar PWA e ganhar pagamento online depois.

## 3. Funcionalidades

**Cliente (`/`)**
- Catálogo com estoque do dia ("Últimas 3", "Esgotado hoje"), evitando a viagem em vão.
- Dois fluxos: **Retirar hoje** (respeita o estoque) e **Encomenda para evento** (mínimo de 48 h de antecedência, inclui tábuas de frios e coffee break).
- Campo de observações para sabor e alergias, o que reduz a troca de sabores.
- Código do pedido (ex.: `DC0001`) na confirmação.

**Equipe (`/admin`, protegido por senha)**
- Lista de pedidos com cliente, itens, data e observações.
- Atualização de status: Recebido → Em preparo → Pronto → Entregue / Cancelado.

## 4. Protótipo (wireframes)

```
 CLIENTE  /                              EQUIPE  /admin
+--------------------------------+      +----------------------------------------+
| Dona Clara · há 12 anos        |      | Pedidos da Dona Clara                   |
| O pão da Dona Clara, sem fila  |      | [Senha do painel ____] [Entrar]         |
| e sem esgotar.                 |      +----------------------------------------+
+--------------------------------+      | Cód.   | Cliente | Quando | Itens |Status|
| [Retirar hoje] [Encomenda]     |      | DC0001 | Ana     | 11/10  | 1x Kit| v    |
| Pães                           |      | DC0002 | João    | hoje   | 2x Pão| v    |
| +---------------+ +-----------+|      +----------------------------------------+
| | Pão ferment.  | | Baguete   ||
| | R$ 18  12 disp| | R$ 9      ||
| | [-] 0 [+]     | | [-] 0 [+] ||
| +---------------+ +-----------+|
| Seus dados: nome, telefone,    |
| data/hora, observações         |
| [Confirmar pedido]             |
+--------------------------------+
| 2 itens · R$ 36   [Finalizar]  |
+--------------------------------+
```

> **Protótipo de alta fidelidade:** a própria interface em `public/` é o protótipo funcional (executável com `npm start`). Adicione aqui capturas de tela da sua execução: `docs/tela-cliente.png` e `docs/tela-admin.png`.

**Identidade visual:** verde-alecrim `#25402f`, crosta `#b9801c`, farinha `#f6f5f0`, cacau `#2b2118`. Títulos em serifa (Georgia) para remeter à tradição; texto em fonte de sistema para leitura rápida no celular.

## 5. Arquitetura

```
Navegador (HTML + CSS + JS)  --HTTP/JSON-->  server.js (Node.js, módulo http)  -->  data/db.json
   public/index.html                           GET  /api/products
   public/admin.html                           POST /api/orders
                                               GET  /api/orders        (senha)
                                               PATCH /api/orders/:code (senha)
```

- **Front-end:** HTML, CSS e JavaScript puros, responsivo e com foco visível para teclado.
- **Back-end:** Node.js (>= 18) **sem dependências externas**, o que facilita rodar em qualquer máquina.
- **Persistência:** arquivo JSON local (`data/db.json`, criado automaticamente e ignorado pelo Git). Escolha adequada ao MVP; para produção, trocar por SQLite ou PostgreSQL.
- **Validações no servidor:** nome, telefone com DDD, antecedência de 48 h para encomendas, estoque, itens existentes e bloqueio de itens de evento no fluxo "hoje".

## 6. Como executar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou superior.

```bash
git clone https://github.com/<seu-usuario>/dona-clara-emporio.git
cd dona-clara-emporio
cp .env.example .env        # Windows: copy .env.example .env
# edite o .env e defina ADMIN_PASSWORD
npm start
```

- Loja: http://localhost:3000
- Painel da equipe: http://localhost:3000/admin

## 7. Segurança

- Nenhuma senha, token ou chave no código ou no histórico. A senha do painel vem da variável `ADMIN_PASSWORD` (arquivo `.env`, ignorado pelo Git). Sem ela, o painel fica bloqueado.
- Saída escapada no painel contra injeção de HTML; arquivos estáticos servidos só a partir de `public/`.
- Limitações assumidas no MVP: senha enviada por cabeçalho (use HTTPS em produção) e sem limite de tentativas.

## 8. Próximos passos

Pagamento via Pix, aviso automático por WhatsApp, painel de produção por dia e migração para banco de dados relacional.

## Licença

[MIT](LICENSE)
