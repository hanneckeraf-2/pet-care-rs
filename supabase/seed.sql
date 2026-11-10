-- =====================================================================
-- Pet Care RS - Dados de exemplo
-- Rode no SQL Editor do Supabase após aplicar as migrations
-- (ou automaticamente com `supabase db reset` no ambiente local).
-- Os nomes de organizações são fictícios/ilustrativos.
-- =====================================================================

insert into public.organizacao (nome, descricao, endereco, cidade, telefone, email, contatos, pix_doacao, necessidades, foto_url)
values
  ('Abrigo Patas Unidas',
   'Abrigo comunitário que acolhe cães e gatos resgatados das enchentes e de situações de abandono.',
   'Rua das Flores, 100 - Centro', 'Canoas', '(51) 3000-0001', 'contato@patasunidas.org',
   '{"instagram": "https://instagram.com/", "whatsapp": "5551900000001"}',
   'pix@patasunidas.org',
   'Ração para filhotes, areia sanitária, cobertores e medicamentos vermífugos.',
   'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80&w=800'),
  ('ONG Amigo Fiel',
   'ONG dedicada a castração, vacinação e adoção responsável no Vale do Sinos.',
   'Av. Unisinos, 500', 'São Leopoldo', '(51) 3000-0002', 'contato@amigofiel.org',
   '{"instagram": "https://instagram.com/", "facebook": "https://facebook.com/"}',
   '00.000.000/0001-00',
   'Doações financeiras para mutirões de castração e voluntários para feiras de adoção.',
   'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800'),
  ('Lar Temporário Esperança',
   'Rede de lares temporários para animais em recuperação.',
   'Rua Esteio, 250', 'Esteio', '(51) 3000-0003', 'contato@laresperanca.org',
   '{"whatsapp": "5551900000003"}',
   'pix@laresperanca.org',
   'Famílias para lar temporário e transporte para consultas veterinárias.',
   'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=800');

-- Animais para adoção (os 4 da landing page original e mais alguns)
with org as (select id, nome from public.organizacao)
insert into public.animal (id_organizacao, nome, especie, raca, idade_meses, sexo, porte, status, cidade, local, descricao)
values
  ((select id from org where nome = 'Abrigo Patas Unidas'), 'Luna', 'cachorro', 'Golden Retriever', 24, 'femea', 'grande', 'disponivel', 'Canoas', 'Centro',
   'Dócil, adora crianças e passeios. Vacinada e castrada.'),
  ((select id from org where nome = 'ONG Amigo Fiel'), 'Taison', 'gato', 'Sem raça definida', 12, 'macho', 'pequeno', 'disponivel', 'São Leopoldo', 'Centro',
   'Curioso e brincalhão, se dá bem com outros gatos.'),
  ((select id from org where nome = 'Abrigo Patas Unidas'), 'Max', 'cachorro', 'Pastor Alemão', 36, 'macho', 'grande', 'disponivel', 'Canoas', 'Niterói',
   'Protetor e muito leal. Precisa de espaço para correr.'),
  ((select id from org where nome = 'ONG Amigo Fiel'), 'Bela', 'gato', 'Siamês', 6, 'femea', 'pequeno', 'disponivel', 'São Leopoldo', 'Scharlau',
   'Filhote carinhosa, já usa caixa de areia.'),
  ((select id from org where nome = 'Lar Temporário Esperança'), 'Thor', 'cachorro', 'Sem raça definida', 96, 'macho', 'medio', 'disponivel', 'Esteio', 'Centro',
   'Idoso tranquilo, ideal para apartamento.'),
  ((select id from org where nome = 'Lar Temporário Esperança'), 'Mel', 'cachorro', 'Sem raça definida', 4, 'femea', 'pequeno', 'disponivel', 'Esteio', 'Parque Amador',
   'Filhote resgatada na enchente, muito sociável.'),
  ((select id from org where nome = 'Abrigo Patas Unidas'), 'Frajola', 'gato', 'Sem raça definida', 60, 'macho', 'medio', 'em_processo', 'Canoas', 'Mathias Velho',
   'Calmo e independente.');

-- Fotos dos animais (URLs externas do Unsplash)
insert into public.foto (id_animal, url, ordem)
select a.id, f.url, 0
from public.animal a
join (values
  ('Luna',    'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800'),
  ('Taison',  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800'),
  ('Max',     'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=800'),
  ('Bela',    'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=800'),
  ('Thor',    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800'),
  ('Mel',     'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800'),
  ('Frajola', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=800')
) as f (nome, url) on f.nome = a.nome;

-- Vagas de voluntariado
insert into public.vaga_voluntariado (id_organizacao, titulo, atividade, descricao, disponibilidade)
select o.id, v.titulo, v.atividade, v.descricao, v.disponibilidade::public.disponibilidade
from public.organizacao o
join (values
  ('Abrigo Patas Unidas', 'Apoio veterinário aos sábados', 'veterinária', 'Auxílio em triagem, curativos e vacinação.', 'finais_de_semana'),
  ('Abrigo Patas Unidas', 'Passeio com os cães', 'cuidados', 'Levar os cães para passear e socializar.', 'flexivel'),
  ('ONG Amigo Fiel', 'Feira de adoção mensal', 'eventos', 'Organização e atendimento ao público nas feiras de adoção.', 'finais_de_semana'),
  ('Lar Temporário Esperança', 'Motorista voluntário', 'transporte', 'Transporte de animais para consultas.', 'dias_uteis')
) as v (org, titulo, atividade, descricao, disponibilidade) on v.org = o.nome;
