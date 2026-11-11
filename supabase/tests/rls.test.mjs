// Testes das migrations e das políticas de segurança (RLS) do Pet Care RS.
//
// Roda todas as migrations de supabase/migrations e o seed em um PostgreSQL
// embutido (PGlite, em WebAssembly), com uma simulação mínima dos esquemas
// auth e storage do Supabase. Depois executa cenários com usuários anônimo,
// comum (Maria, Outro) e administradora de organização (Ana), verificando o
// que cada um pode ou não ler e alterar.
//
// Uso: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const projectDir = process.argv[2] ?? process.cwd();
const db = new PGlite();

const stubs = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage; create publication supabase_realtime;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id bigserial primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
grant usage on schema auth, storage, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant all on storage.objects to anon, authenticated; grant all on all sequences in schema storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
`;
await db.exec(stubs);

const migDir = join(projectDir, 'supabase', 'migrations');
for (const f of readdirSync(migDir).sort()) {
  await db.exec(readFileSync(join(migDir, f), 'utf8'));
  console.log('OK migration', f);
}
await db.exec(readFileSync(join(projectDir, 'supabase', 'seed.sql'), 'utf8'));
console.log('OK seed');

const U_MARIA = '00000000-0000-0000-0000-000000000001';
const U_ANA = '00000000-0000-0000-0000-000000000002';
const U_OUTRO = '00000000-0000-0000-0000-000000000003';
await db.exec(`
insert into auth.users (id, email, raw_user_meta_data) values
 ('${U_MARIA}', 'maria@x.com', '{"nome":"Maria"}'),
 ('${U_ANA}', 'ana@x.com', '{"full_name":"Ana"}'),
 ('${U_OUTRO}', 'outro@x.com', '{}');
update public.usuario set alertas_ativos=true, cidade='Canoas' where id='${U_MARIA}';
update public.usuario set tipo_usuario='admin_org', id_organizacao=(select id from public.organizacao where nome='Abrigo Patas Unidas') where id='${U_ANA}';
`);

let failures = 0;
async function as(uid, fn) {
  await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`
                    : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
async function expectOk(label, sql, check) {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) { failures++; console.log('FAIL', label, JSON.stringify(r.rows)); }
    else console.log('pass', label);
  } catch (e) { failures++; console.log('FAIL', label, e.message); }
}
async function expectErr(label, sql) {
  try { await db.exec(sql); failures++; console.log('FAIL (deveria falhar)', label); }
  catch { console.log('pass', label); }
}

const luna = (await db.query(`select id from public.animal where nome='Luna'`)).rows[0].id;
const taison = (await db.query(`select id from public.animal where nome='Taison'`)).rows[0].id;

await expectOk('trigger cria perfis', `select count(*)::int c from public.usuario`, (r) => r[0].c === 3);

await as(null, async () => {
  await expectOk('anon lê animais', `select count(*)::int c from public.animal`, (r) => r[0].c === 7);
  await expectOk('anon não lê usuários', `select count(*)::int c from public.usuario`, (r) => r[0].c === 0);
  await expectOk('anon envia contato', `insert into public.mensagem_contato (nome,email,assunto,mensagem) values ('Fulano','f@x.com','Oi','Teste')`);
  await expectOk('anon não lê contatos', `select count(*)::int c from public.mensagem_contato`, (r) => r[0].c === 0);
  await expectErr('anon não solicita adoção', `insert into public.adocao (id_usuario,id_animal) values ('${U_MARIA}', ${luna})`);
});

await as(U_MARIA, async () => {
  await expectOk('maria vê só o próprio perfil', `select count(*)::int c from public.usuario`, (r) => r[0].c === 1);
  await db.query(`update public.usuario set tipo_usuario='admin_sistema', nome='Maria Silva' where id='${U_MARIA}'`);
  await expectOk('maria não se promove', `select tipo_usuario, nome from public.usuario where id='${U_MARIA}'`,
    (r) => r[0].tipo_usuario === 'comum' && r[0].nome === 'Maria Silva');
  await expectOk('maria solicita adoção', `insert into public.adocao (id_usuario,id_animal,dados_formulario) values ('${U_MARIA}', ${luna}, '{"motivo":"amo cães"}')`);
  await expectErr('maria não duplica solicitação', `insert into public.adocao (id_usuario,id_animal) values ('${U_MARIA}', ${luna})`);
  await expectErr('maria não solicita em nome de outro', `insert into public.adocao (id_usuario,id_animal) values ('${U_OUTRO}', ${taison})`);
  await expectErr('maria não aprova a própria adoção', `update public.adocao set status='aprovada' where id_usuario='${U_MARIA}' returning id`.replace('returning id','') + `; select 1/(select count(*) from public.adocao where status='aprovada')`);
  await expectErr('maria não cadastra animal para adoção', `insert into public.animal (id_organizacao,nome,especie,cidade,status) values (1,'X','gato','Canoas','disponivel')`);
  await expectOk('maria registra perdido', `insert into public.animal (id_usuario,nome,especie,cidade,status) values ('${U_MARIA}','Mingau','gato','Canoas','perdido')`);
  await expectErr('maria não marca perdido como disponível', `update public.animal set status='disponivel' where nome='Mingau'; select 1/(select count(*) from public.animal where nome='Mingau' and status='disponivel')`);
  await expectErr('maria não altera animal da ONG', `update public.animal set nome='Hack' where id=${luna}; select 1/(select count(*) from public.animal where nome='Hack')`);
  await expectOk('maria se inscreve em vaga', `insert into public.inscricao_voluntariado (id_vaga,id_usuario) values ((select min(id) from public.vaga_voluntariado), '${U_MARIA}')`);
  await expectOk('maria upload na própria pasta', `insert into storage.objects (bucket_id,name) values ('fotos','${U_MARIA}/a.jpg')`);
  await expectErr('maria upload em pasta alheia', `insert into storage.objects (bucket_id,name) values ('fotos','${U_OUTRO}/a.jpg')`);
});

await as(U_OUTRO, async () => {
  await expectOk('outro não vê adoção da maria', `select count(*)::int c from public.adocao`, (r) => r[0].c === 0);
  await expectOk('outro não vê inscrição da maria', `select count(*)::int c from public.inscricao_voluntariado`, (r) => r[0].c === 0);
  await expectOk('outro envia mensagem sobre perdido', `insert into public.mensagem_animal (id_animal,id_remetente,mensagem) values ((select id from public.animal where nome='Mingau'),'${U_OUTRO}','Vi na rua X')`);
});

await as(U_MARIA, async () => {
  await expectOk('maria (tutora) lê mensagem do perdido', `select count(*)::int c from public.mensagem_animal`, (r) => r[0].c === 1);
});

await as(U_ANA, async () => {
  await expectOk('ana vê adoção da Luna', `select count(*)::int c from public.adocao`, (r) => r[0].c === 1);
  await expectOk('ana vê perfil da adotante', `select count(*)::int c from public.usuario where id='${U_MARIA}'`, (r) => r[0].c === 1);
  await expectOk('ana aprova adoção', `update public.adocao set status='aprovada' returning id`, (r) => r.length === 1);
  await expectErr('ana não troca adotante', `update public.adocao set id_usuario='${U_OUTRO}'`);
  await expectOk('ana cadastra animal na sua ONG', `insert into public.animal (id_organizacao,nome,especie,cidade) values ((select id from public.organizacao where nome='Abrigo Patas Unidas'),'Rex','cachorro','Canoas') returning id`, (r) => r.length === 1);
  await expectErr('ana não cadastra animal em outra ONG', `insert into public.animal (id_organizacao,nome,especie,cidade) values ((select id from public.organizacao where nome='ONG Amigo Fiel'),'Rex2','cachorro','Canoas')`);
  await expectOk('ana não altera animal de outra ONG', `update public.animal set nome='Z' where id=${taison} returning id`, (r) => r.length === 0);
  await expectOk('ana edita sua ONG', `update public.organizacao set necessidades='Ração' where nome='Abrigo Patas Unidas' returning id`, (r) => r.length === 1);
  await expectOk('ana não edita outra ONG', `update public.organizacao set necessidades='X' where nome='ONG Amigo Fiel' returning id`, (r) => r.length === 0);
  await expectOk('ana vê inscrição na sua vaga', `select count(*)::int c from public.inscricao_voluntariado`, (r) => r[0].c === 1);
});


// ---- Fase 5: voluntariado ----
await as(U_MARIA, async () => {
  await expectErr('não duplica inscrição ativa', `insert into public.inscricao_voluntariado (id_vaga,id_usuario) values ((select min(id) from public.vaga_voluntariado), '${U_MARIA}')`);
  await expectOk('cancela inscrição', `update public.inscricao_voluntariado set status='cancelada' where id_usuario='${U_MARIA}' and status='pendente' returning id`, (r) => r.length === 1);
  await expectOk('reinscreve após cancelar', `insert into public.inscricao_voluntariado (id_vaga,id_usuario) values ((select min(id) from public.vaga_voluntariado), '${U_MARIA}') returning id`, (r) => r.length === 1);
  await expectErr('não se inscreve com status aprovada', `insert into public.inscricao_voluntariado (id_vaga,id_usuario,status) values ((select max(id) from public.vaga_voluntariado), '${U_MARIA}','aprovada')`);
});
await expectOk('[setup] encerra uma vaga', `update public.vaga_voluntariado set status='encerrada' where id=(select max(id) from public.vaga_voluntariado) returning id`, (r) => r.length === 1);
await as(U_MARIA, async () => {
  await expectErr('não se inscreve em vaga encerrada', `insert into public.inscricao_voluntariado (id_vaga,id_usuario) values ((select max(id) from public.vaga_voluntariado), '${U_MARIA}')`);
});
await as(U_ANA, async () => {
  await expectOk('ana cria vaga na sua ONG', `insert into public.vaga_voluntariado (id_organizacao,titulo,atividade) values ((select id from public.organizacao where nome='Abrigo Patas Unidas'),'Nova','limpeza') returning id`, (r) => r.length === 1);
  await expectErr('ana não cria vaga em outra ONG', `insert into public.vaga_voluntariado (id_organizacao,titulo,atividade) values ((select id from public.organizacao where nome='ONG Amigo Fiel'),'X','limpeza')`);
});

// ---- Fase 6: painel da organização ----
const max = (await db.query(`select id from public.animal where nome='Max'`)).rows[0].id;
await as(U_MARIA, async () => {
  await expectOk('maria pede o Max', `insert into public.adocao (id_usuario,id_animal) values ('${U_MARIA}', ${max})`);
});
await as(U_OUTRO, async () => {
  await expectOk('outro pede o Max', `insert into public.adocao (id_usuario,id_animal) values ('${U_OUTRO}', ${max})`);
});
const pedidoMaria = (await db.query(`select id from public.adocao where id_animal=${max} and id_usuario='${U_MARIA}'`)).rows[0].id;
await as(U_MARIA, async () => {
  await expectErr('maria não decide adoção', `select public.decidir_adocao(${pedidoMaria}, true, null)`);
});
await as(U_ANA, async () => {
  await expectOk('ana aprova pedido da maria', `select public.decidir_adocao(${pedidoMaria}, true, 'Bem-vindo, Max!')`);
  await expectErr('não decide duas vezes', `select public.decidir_adocao(${pedidoMaria}, false, null)`);
  await expectErr('ana não decide adoção de outra ONG', `select public.decidir_adocao((select id from public.adocao where id_animal=${taison} limit 1), true, null)`);
  await expectOk('ana vê relatório só da sua ONG', `select count(distinct id_organizacao)::int c, sum(solicitacoes)::int s from public.vw_adocoes_por_mes`, (r) => r[0].c === 1 && r[0].s >= 3);
});
await expectOk('Max ficou adotado e o outro pedido foi rejeitado',
  `select (select status::text from public.animal where id=${max}) a, (select status::text from public.adocao where id_animal=${max} and id_usuario='${U_OUTRO}') o, (select descricao from public.adocao where id=${pedidoMaria}) d`,
  (r) => r[0].a === 'adotado' && r[0].o === 'rejeitada' && r[0].d === 'Bem-vindo, Max!');
await as(U_OUTRO, async () => {
  await expectOk('outro não vê relatório da ONG', `select count(*)::int c from public.vw_adocoes_por_mes where solicitacoes > 1`, (r) => r[0].c === 0);
});

// ---- Fase 4: desaparecidos ----
await as(U_OUTRO, async () => {
  await expectOk('nome do remetente vem do servidor', `insert into public.mensagem_animal (id_animal,id_remetente,mensagem,nome_remetente) values ((select id from public.animal where nome='Mingau'),'${U_OUTRO}','De novo','Fingindo ser outro') returning nome_remetente`,
    (r) => r[0].nome_remetente === 'outro');
});
await as(U_MARIA, async () => {
  await expectErr('tutora não manda mensagem para si', `insert into public.mensagem_animal (id_animal,id_remetente,mensagem) values ((select id from public.animal where nome='Mingau'),'${U_MARIA}','oi')`);
  await expectOk('tutora marca como reunido', `update public.animal set status='reunido' where nome='Mingau' returning id`, (r) => r.length === 1);
  await expectOk('tutora apaga mensagem recebida', `delete from public.mensagem_animal where mensagem='De novo' returning id`, (r) => r.length === 1);
});
await as(U_OUTRO, async () => {
  await expectErr('não envia mensagem para animal reunido', `insert into public.mensagem_animal (id_animal,id_remetente,mensagem) values ((select id from public.animal where nome='Mingau'),'${U_OUTRO}','oi')`);
  await expectErr('não envia mensagem para animal de adoção', `insert into public.mensagem_animal (id_animal,id_remetente,mensagem) values (${luna},'${U_OUTRO}','oi')`);
  await expectOk('outro não apaga mensagens alheias', `delete from public.mensagem_animal returning id`, (r) => r.length === 0);
});

// ---- Fase 7: notificações ----
const n = async (uid, tipo) => (await db.query(`select count(*)::int c from public.notificacao where id_usuario='${uid}' and tipo='${tipo}'`)).rows[0].c;
await expectOk('[n] ana recebeu pedidos de adoção', `select 1`, async () => true);
console.log((await n(U_ANA,'adocao_nova')) >= 3 ? 'pass ana avisada de novas adoções' : (failures++, 'FAIL ana avisada de novas adoções'));
console.log((await n(U_MARIA,'adocao_aprovada')) >= 1 ? 'pass maria avisada da aprovação' : (failures++, 'FAIL maria avisada da aprovação'));
console.log((await n(U_OUTRO,'adocao_rejeitada')) >= 1 ? 'pass outro avisado da recusa automática' : (failures++, 'FAIL outro avisado da recusa automática'));
console.log((await n(U_ANA,'inscricao_nova')) >= 2 ? 'pass ana avisada de inscrições' : (failures++, 'FAIL ana avisada de inscrições'));
console.log((await n(U_MARIA,'mensagem_animal')) >= 1 ? 'pass tutora avisada de mensagens' : (failures++, 'FAIL tutora avisada de mensagens'));
await as(U_ANA, async () => {
  await expectOk('ana cadastra animal em Canoas', `insert into public.animal (id_organizacao,nome,especie,cidade) values ((select id from public.organizacao where nome='Abrigo Patas Unidas'),'Bidu','cachorro','Canoas')`);
  await expectOk('ana aprova inscrição', `update public.inscricao_voluntariado set status='aprovada' where status='pendente' returning id`, (r) => r.length >= 1);
});
console.log((await n(U_MARIA,'alerta_cidade')) >= 1 ? 'pass maria (alertas em Canoas) avisada do Bidu' : (failures++, 'FAIL alerta cidade'));
console.log((await n(U_OUTRO,'alerta_cidade')) === 0 ? 'pass outro (sem alertas) não avisado' : (failures++, 'FAIL outro recebeu alerta'));
console.log((await n(U_MARIA,'inscricao_aprovada')) >= 1 ? 'pass maria avisada da inscrição aprovada' : (failures++, 'FAIL inscricao aprovada'));
await as(U_MARIA, async () => {
  await expectErr('cliente não chama notificar()', `select public.notificar('${U_OUTRO}','spam','x',null)`);
  await expectErr('cliente não insere notificação direto', `insert into public.notificacao (id_usuario,tipo,mensagem) values ('${U_OUTRO}','spam','x')`);
  await expectOk('maria só vê as suas', `select count(distinct id_usuario)::int c from public.notificacao`, (r) => r[0].c === 1);
  await expectOk('maria marca como lida', `update public.notificacao set lida=true returning id`, (r) => r.length >= 3);
});

// ---- Fase 8: revisão de segurança ----
await as(U_ANA, async () => {
  await expectErr('ana não atribui animal a terceiro', `insert into public.animal (id_organizacao,id_usuario,nome,especie,cidade) values ((select id from public.organizacao where nome='Abrigo Patas Unidas'),'${U_OUTRO}','Hack','gato','Canoas')`);
  await expectOk('ana pode se atribuir como responsável', `insert into public.animal (id_organizacao,id_usuario,nome,especie,cidade) values ((select id from public.organizacao where nome='Abrigo Patas Unidas'),'${U_ANA}','Mimi','gato','Canoas') returning id`, (r) => r.length === 1);
  await expectErr('ana não transfere animal para terceiro', `update public.animal set id_usuario='${U_OUTRO}' where nome='Mimi'`);
});

// ---- Fase 12: preferência de e-mail ----
await expectOk('notificar_email ligado por padrão', `select bool_and(notificar_email) t from public.usuario`, (r) => r[0].t === true);
await as(U_MARIA, async () => {
  await expectOk('maria desliga os e-mails', `update public.usuario set notificar_email=false where id='${U_MARIA}' returning notificar_email`, (r) => r[0].notificar_email === false);
  await expectOk('maria não altera preferência de outro', `update public.usuario set notificar_email=false where id='${U_OUTRO}' returning id`, (r) => r.length === 0);
});

await as(null, async () => {
  await expectErr('anon não exclui conta', `select public.excluir_minha_conta()`);
});
await as(U_OUTRO, async () => {
  await expectOk('outro exclui a própria conta', `select public.excluir_minha_conta()`);
});
await expectOk('só a conta do outro foi removida', `select (select count(*)::int from auth.users) a, (select count(*)::int from public.usuario) u, (select count(*)::int from public.mensagem_animal) m`,
  (r) => r[0].a === 2 && r[0].u === 2 && r[0].m === 0);
console.log(failures ? `\n${failures} FALHA(S)` : '\nTodos os testes passaram');
process.exit(failures ? 1 : 0);
