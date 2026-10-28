# Encurtador Proparts

Encurtador de links interno, com painel protegido por senha única, UTMs e contagem de cliques.
Stack: Next.js 16 (Vercel) + Supabase (Postgres).

## O que faz

- Cria links curtos com código automático ou personalizado (ex.: `/bf-garmin`)
- Aplica UTMs automaticamente no redirecionamento (origem, mídia, campanha, conteúdo, termo)
- Agrupa links por campanha, com busca e filtro
- Ativa, desativa, edita e exclui links
- Conta cliques por dia, país, dispositivo e site de origem (últimos 30 dias)
- Dashboard geral com gráfico de cliques por dia, comparação com o período anterior e rankings de campanhas, origens, dispositivos e links
- Relatório por campanha (7, 30 ou 90 dias) com ranking de links e exportação CSV para Excel
- Repassa fbclid, gclid e parâmetros de anúncio para o destino
- Ignora robôs e pré-visualizações (WhatsApp, redes sociais) na contagem
- Não guarda IP nem dados pessoais (LGPD)

## Como funciona o acesso

Não há cadastro de usuários: o painel (`/admin`) pede só a **senha única** definida em `ADMIN_PASSWORD`.
A sessão dura 7 dias. Para trocar a senha, altere `ADMIN_PASSWORD` na Vercel e faça um novo deploy.
Para **derrubar todas as sessões abertas** (ex.: alguém saiu da equipe), troque também `SESSION_SECRET`.

Os links curtos (`/codigo`) são públicos: qualquer pessoa com o link é redirecionada.

## Deploy (passo a passo)

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região sugerida: São Paulo, `sa-east-1`).
2. Abra **SQL Editor**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   Depois rode, em ordem, cada arquivo da pasta [`supabase/migrations`](supabase/migrations).
3. Em **Project Settings > API**, copie:
   - **Project URL** → vai em `SUPABASE_URL`
   - **service_role / secret key** → vai em `SUPABASE_SERVICE_ROLE_KEY`

> A chave secreta dá acesso total ao banco. Ela fica só nas variáveis da Vercel: nunca no código, no GitHub ou em mensagens.

### 2. Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e importe este repositório do GitHub.
2. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chave secreta do Supabase |
| `ADMIN_PASSWORD` | senha de acesso ao painel (use uma senha forte) |
| `SESSION_SECRET` | texto aleatório com 32+ caracteres (comando abaixo) |
| `SHORT_BASE_URL` | opcional: domínio curto, ex.: `https://prt.link` |

Para gerar o `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

3. Clique em **Deploy**. Acesse `https://SEU-PROJETO.vercel.app/admin` e entre com a senha.

### 3. Domínio próprio (opcional)

Em **Vercel > Project > Settings > Domains**, adicione o domínio curto e configure o DNS conforme indicado.
Depois preencha `SHORT_BASE_URL` com esse domínio. Registro de domínio e DNS: Centro de Suporte (suporte@byproparts.com.br).

### Recomendações de segurança

- Ative o **Vercel Firewall** com uma regra de limite de requisições para `/login` (ex.: 10 por minuto por IP).
- Troque `ADMIN_PASSWORD` periodicamente e sempre que alguém deixar a equipe.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

Abra http://localhost:3000.

## Estrutura

| Caminho | Função |
|---|---|
| `app/[slug]/route.ts` | Redirecionamento público e registro de cliques |
| `app/login/` | Tela e ações de login/logout |
| `app/admin/page.tsx` | Visão geral (dashboard com gráficos) |
| `app/admin/links/` | Meus links: criação, lista, detalhes e edição |
| `app/admin/campanhas/` | Campanhas: cards, relatório por período e CSV |
| `app/admin/sidebar.tsx`, `ui.tsx` | Layout (menu lateral, cabeçalho) no padrão visual Proparts |
| `proxy.ts` | Bloqueia `/admin` sem sessão válida |
| `lib/session.ts` | Senha única e cookie de sessão assinado |
| `lib/links.ts` | Validação, geração de código e montagem das UTMs |
| `supabase/schema.sql` | Tabelas, segurança (RLS) e funções do banco |

## Próximas evoluções (versão avançada)

- QR code para cada link (download PNG/SVG)
- Links de revendas (agrupamento por revenda)
- Data de expiração e agendamento de links
