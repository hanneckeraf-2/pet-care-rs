# Pet Care RS

Site agregador de informações para protetores de animais no Vale do Sinos/RS (Canoas e São Leopoldo).
Projeto das Atividades Extensionistas (UNINTER, Bacharelado em Ciência da Computação).

**Stack:**
- Front-end: React 18 + TypeScript + Vite + Tailwind CSS
- Back-end: Supabase (PostgreSQL, Auth, Storage, Row Level Security)

## Como rodar localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o projeto no Supabase
1. Crie uma conta gratuita em https://supabase.com e um novo projeto (região: South America, São Paulo).
2. Copie a **Project URL**: use o botão **Connect** no topo do painel ou vá em **Project Settings > Data API**. O formato é `https://<project-ref>.supabase.co`.
3. Copie a chave pública em **Project Settings > API Keys**: a **Publishable key** (`sb_publishable_...`) ou, na aba *Legacy*, a `anon` key.
   **Nunca** use a *Secret key* nem a `service_role` no front-end.
4. Copie `.env.example` para `.env.local` e preencha com esses dois valores:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```

### 3. Criar o banco de dados
Escolha uma das opções abaixo.

**Opção A: pelo painel (mais simples)**
1. Abra **SQL Editor** no painel do Supabase.
2. Cole e execute o conteúdo de cada arquivo de `supabase/migrations/`, em ordem alfabética.
3. Cole e execute o conteúdo de `supabase/seed.sql` (dados de exemplo).

**Opção B: pela Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref <id-do-projeto>
npx supabase db push
```
Depois rode o `supabase/seed.sql` no SQL Editor.

### 4. Rodar o site
```bash
npm run dev
```

## Tornar um usuário administrador de organização
1. Cadastre-se normalmente pelo site.
2. No SQL Editor, execute o comando abaixo. Ele vincula o usuário à organização e dá a ele permissão de gerenciar animais, adoções e voluntários dela.
   ```sql
   update public.usuario
   set tipo_usuario = 'admin_org',
       id_organizacao = (select id from public.organizacao where nome = 'Abrigo Patas Unidas')
   where email = 'seu-email@exemplo.com';
   ```
   Use `tipo_usuario = 'admin_sistema'` para um administrador geral.

## Estrutura

```
src/
  components/   componentes reutilizáveis (Header, Footer, HeroSlider, ...)
  pages/        páginas por rota
  lib/          cliente Supabase e constantes
  types/        tipos do banco (database.ts)
supabase/
  migrations/   esquema SQL, políticas RLS, triggers e storage
  seed.sql      dados de exemplo
```

## Modelo de dados

Baseado no Diagrama ER do trabalho da etapa 2, com estes ajustes:

| Diagrama original | Implementação |
|---|---|
| `Autenticacao` | `auth.users` do Supabase (e-mail/senha e Google) |
| `Usuario` | `usuario`: perfil ligado a `auth.users`, criado automaticamente por trigger |
| `Voluntariado` | `vaga_voluntariado` (vaga aberta pela ONG) + `inscricao_voluntariado` (candidatura) |
| `Foto` | `foto`: pode pertencer a um animal, usuário ou organização; arquivos no bucket `fotos` |
| (novo) | `notificacao`, `mensagem_animal` (contato sobre perdidos), `mensagem_contato` |

**Segurança:** todas as tabelas têm Row Level Security.
- Cada usuário só acessa os próprios dados.
- Organizações só gerenciam os próprios animais, adoções e vagas.
- Um usuário não consegue se promover a administrador.

## Scripts
| Comando | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint |
