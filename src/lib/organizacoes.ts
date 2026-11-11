import type { QueryData } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Json } from '../types/database';

export type Contatos = { instagram?: string; facebook?: string; whatsapp?: string; whatsappGrupo?: string; site?: string };

/** Link de convite de grupo/comunidade do WhatsApp */
export const REGEX_GRUPO_WHATSAPP = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+\/?$/;

/** Lê o JSON de contatos da organização aceitando só valores seguros. */
export function lerContatos(json: Json): Contatos {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  const obj = json as Record<string, Json | undefined>;
  const url = (v: Json | undefined) => (typeof v === 'string' && /^https:\/\//i.test(v) ? v : undefined);
  const whatsapp = typeof obj.whatsapp === 'string' ? obj.whatsapp.replace(/\D/g, '') : '';
  return {
    instagram: url(obj.instagram),
    facebook: url(obj.facebook),
    site: url(obj.site),
    whatsapp: whatsapp.length >= 10 ? whatsapp : undefined,
    whatsappGrupo:
      typeof obj.whatsapp_grupo === 'string' && REGEX_GRUPO_WHATSAPP.test(obj.whatsapp_grupo) ? obj.whatsapp_grupo : undefined,
  };
}

export const VAGA_SELECT =
  'id, titulo, atividade, descricao, disponibilidade, status, criado_em, organizacao!inner(id, nome, cidade)' as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- usado só para inferir o tipo
const vagaQuery = supabase.from('vaga_voluntariado').select(VAGA_SELECT);
export type Vaga = QueryData<typeof vagaQuery>[number];
