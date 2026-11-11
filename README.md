# Pet Care RS

[![CI](https://github.com/hanneckeraf-2/pet-care-rs/actions/workflows/ci.yml/badge.svg)](https://github.com/hanneckeraf-2/pet-care-rs/actions/workflows/ci.yml)

Repositório: https://github.com/hanneckeraf-2/pet-care-rs

Site agregador de informações para protetores de animais no Vale do Sinos/RS, com foco em Canoas e São Leopoldo.
Ele conecta ONGs, abrigos e protetores a adotantes, voluntários, doadores e tutores de animais desaparecidos.

Projeto das Atividades Extensionistas da UNINTER (Bacharelado em Ciência da Computação).
ODS 3 (Saúde e bem-estar) e ODS 15 (Vida terrestre).

## Funcionalidades

| Área | O que faz | Persona |
|---|---|---|
| **Adoção** | Busca com filtros (espécie, idade, cidade, organização, porte, sexo, texto), página do animal com galeria e formulário de solicitação de adoção | Maria |
| **Voluntariado** | Vagas filtráveis por disponibilidade, atividade e cidade; inscrição com "Quero Ajudar" | Carlos |
| **Painel da organização** | Cadastro e edição de animais com fotos, aprovação de adoções e de voluntários, perfil público (Pix, necessidades, redes sociais) e relatórios | Ana |
| **Desaparecidos** | Registro de animal perdido ou encontrado com fotos, busca, mensagens para o tutor, marcar como "voltou para casa" | Fernanda |
| **Organizações** | Lista e página pública de cada organização, com doação via Pix (sem intermediação do site) | Doadores |
| **Notificações** | Avisos em tempo real (sino no cabeçalho) e por e-mail sobre adoções, inscrições, mensagens e novos animais na cidade | Todos |
| **Conta** | Cadastro por e-mail/senha ou Google, recuperação de senha, perfil, histórico, exclusão de conta | Todos |
| **Contato** | Formulário com proteção contra spam e perguntas frequentes | Todos |
| **App (PWA)** | Instalável no celular e no computador ("Instalar app" no rodapé), funciona com conexão instável, avisa quando há nova versão | Todos |

## Tecnologias

Todas são gratuitas ou têm plano gratuito, como pede o requisito não funcional "Recursos".

- **Front-end:** React 18, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form e Zod (validação), lucide-react (ícones).
- **Back-end:** [Supabase](https://supabase.com), que oferece:
  - PostgreSQL com Row Level Security;
  - Auth (e-mail/senha e Google);
  - Storage (fotos);
  - Realtime (notificações).
- **PWA:** vite-plugin-pwa (Web App Manifest + Service Worker com Workbox). As fotos ficam em cache; dados pessoais e sessões nunca.
- **Testes de banco:** PGlite (PostgreSQL em WebAssembly), rodando as migrations e as regras de segurança localmente.

## Como rodar localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o projeto no Supabase
1. Crie uma conta gratuita em https://supabase.com e um novo projeto (região South America, São Paulo).
2. Copie a **Project URL**: use o botão **Connect** no topo do painel ou vá em **Project Settings > Data API**. O formato é `https://<project-ref>.supabase.co`.
3. Copie a chave pública em **Project Settings > API Keys**: a **Publishable key** (`sb_publishable_...`) ou, na aba *Legacy*, a `anon` key.
   **Nunca** use a *Secret key* nem a `service_role` no front-end.
4. Copie `.env.example` para `.env.local` e preencha com esses dois valores:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```

### 3. Criar o banco de dados
```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --remote --include-seed
```
Sem `--remote`, a CLI tenta um banco local no Docker (`127.0.0.1:54322`).
O `--include-seed` aplica também os dados de exemplo (`supabase/seed.sql`). Use-o **só na primeira vez**, para não duplicar os dados.

Se preferir não usar a CLI: no **SQL Editor** do Supabase, execute cada arquivo de `supabase/migrations/` em ordem alfabética e, depois, o `supabase/seed.sql`.

### 4. Configurar a autenticação
1. Em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`
2. Login com Google (opcional):
   1. No [Google Cloud Console](https://console.cloud.google.com/), crie um OAuth Client do tipo "Web application".
   2. Em *Authorized redirect URI*, use `https://<project-ref>.supabase.co/auth/v1/callback`.
   3. Cole o Client ID e o Secret em **Authentication > Sign In / Providers > Google**.
3. Durante o desenvolvimento, você pode desligar **Confirm email** em **Authentication > Sign In / Providers > Email**. O servidor de e-mail gratuito do Supabase envia poucos e-mails por hora.

### 5. Rodar o site
```bash
npm run dev
```
O site abre em http://localhost:5173.

## Deploy (Vercel)
O site é publicado na [Vercel](https://vercel.com), e cada push no `main` gera um deploy automático. A configuração está em `vercel.json`: rewrite para as rotas da SPA, headers de segurança e cache.

1. Em vercel.com, entre com o GitHub e escolha **Add New → Project → Import** `pet-care-rs`. O preset Vite é detectado sozinho.
2. Em **Environment Variables**, informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e clique em **Deploy**.
3. No Supabase, em **Authentication > URL Configuration**:
   - troque a **Site URL** pela URL da Vercel;
   - adicione `https://<seu-app>.vercel.app/**` às **Redirect URLs**, mantendo a de `localhost`.

## Notificações por e-mail (Brevo)
As notificações do site também são enviadas por e-mail, se o usuário mantiver a opção ligada no perfil. O envio passa pela Edge Function `supabase/functions/enviar-email-notificacao`, acionada a cada nova notificação. O provedor é o [Brevo](https://www.brevo.com), com plano gratuito de 300 e-mails por dia.

1. **Brevo:**
   1. Crie a conta.
   2. Em **Senders, Domains & Dedicated IPs → Senders**, adicione e verifique o e-mail remetente.
   3. Em **SMTP & API**, gere uma **API key** e anote também as credenciais **SMTP**.
2. **E-mails de login** (confirmação e recuperação de senha): no Supabase, em **Authentication > Emails > SMTP Settings**, ative o SMTP personalizado com:
   - host `smtp-relay.brevo.com`, porta `587`;
   - usuário e senha SMTP do Brevo;
   - o e-mail remetente verificado.
3. **Segredos da função**, fora do git:
   ```bash
   npx supabase secrets set BREVO_API_KEY=... EMAIL_REMETENTE=voce@exemplo.com SITE_URL=https://<seu-app>.vercel.app WEBHOOK_SECRET=<texto-aleatorio-longo>
   ```
4. **Publicar a função:**
   ```bash
   npx supabase functions deploy enviar-email-notificacao --no-verify-jwt
   ```
5. **Criar o webhook** em **Database > Webhooks > Create a new hook**:
   - tabela `notificacao`, evento **Insert**;
   - tipo **Supabase Edge Functions**, função `enviar-email-notificacao`, método `POST`;
   - header `x-webhook-secret` com o mesmo valor de `WEBHOOK_SECRET`.

   O webhook é criado no painel, e não numa migration, para o segredo não ficar no repositório público.

## Tornar um usuário administrador de organização
1. Cadastre-se normalmente pelo site.
2. No **SQL Editor**, execute:
   ```sql
   update public.usuario
   set tipo_usuario = 'admin_org',
       id_organizacao = (select id from public.organizacao where nome = 'Abrigo Patas Unidas')
   where email = 'seu-email@exemplo.com';
   ```
   Use `tipo_usuario = 'admin_sistema'` para um administrador geral.
3. Recarregue o site. A opção **Painel da organização** aparece no menu do usuário.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (pasta `dist/`) |
| `npm run lint` | ESLint |
| `npm run test:db` | Testa as migrations e as regras de segurança (RLS) num PostgreSQL embutido. Não precisa de Supabase nem de Docker |

## Estrutura

```
src/
  components/    componentes reutilizáveis (Header, PetCard, VagaCard, SeletorFotos, ui...)
  contexts/      AuthContext (sessão e perfil) e NotificacoesContext (tempo real)
  hooks/         hooks de dados
  lib/           cliente Supabase, consultas, rótulos, validações, upload, tradução de erros
  pages/         páginas por área: animais, desaparecidos, organizacoes, voluntariado,
                 auth, usuario, admin
  types/         tipos do banco (database.ts)
supabase/
  migrations/    esquema SQL, políticas RLS, funções, triggers e storage (em ordem)
  seed.sql       dados de exemplo
  tests/         testes das migrations e das políticas de segurança
```

## Modelo de dados

Baseado no Diagrama ER do Trabalho Final da etapa 2, com estes ajustes:

| Diagrama original | Implementação | Motivo |
|---|---|---|
| `Autenticacao` | `auth.users` do Supabase | Provedores e senhas ficam com o Supabase Auth (hash, recuperação, OAuth) |
| `Usuario` | `usuario` | Perfil ligado a `auth.users`, criado automaticamente por trigger |
| `Voluntariado` | `vaga_voluntariado` + `inscricao_voluntariado` | A vaga (aberta pela ONG) e a candidatura (do voluntário) são entidades diferentes |
| `Foto` | `foto` | Pode pertencer a um animal, a um usuário ou a uma organização; os arquivos ficam no bucket `fotos` |
| `Adocao` | `adocao` | Ganhou `dados_formulario` (respostas do adotante) e status em enum |
| (novo) | `notificacao` | Notificações geradas por triggers |
| (novo) | `mensagem_animal` | Mensagens "Entrar em Contato" sobre animais desaparecidos |
| (novo) | `mensagem_contato` | Formulário de contato do site |

Como o trabalho previa, as doações não são registradas no sistema: cada organização exibe a própria chave Pix.

## Segurança

O requisito não funcional "Segurança de dados/acesso" é atendido assim:

- **Row Level Security em todas as tabelas.** O navegador só acessa o banco com a chave pública. As regras ficam no banco:
  - cada usuário só lê os próprios dados;
  - uma organização só gerencia os próprios animais, adoções e vagas;
  - ninguém consegue se promover a administrador.
- **Operações sensíveis em funções SQL.** Aprovar uma adoção (`decidir_adocao`) e excluir a conta (`excluir_minha_conta`) acontecem de forma atômica, com as permissões verificadas no servidor.
- **Notificações geradas apenas pelo servidor.** Os clientes não conseguem criar notificações para outros usuários.
- **Uploads restritos:** só JPG, PNG ou WEBP, até 5 MB, e cada usuário grava apenas na própria pasta do Storage.
- **Validação de formulários com Zod** no front-end e restrições (`check`) no banco.
- **Links externos das organizações** só são exibidos se usarem `https://`.
- **Testes automatizados** (`npm run test:db`) cobrem os cenários de permissão das personas.

## Próximos passos

- Chatbot de orientação (previsto nos requisitos; adiado nesta etapa).
- Login com Apple e Meta.
