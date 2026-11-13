import type { QueryData } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Json } from '../types/database';

export type Contatos = {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  whatsappGrupo?: string;
  site?: string;
  /** formulário de adoção próprio da organização (ex.: Google Forms) */
  formularioAdocao?: string;
  /** canal pelo qual a organização prefere atender adoção e dúvidas */
  contatoPreferencial?: CanalPreferencial;
};

export type CanalPreferencial = 'whatsapp' | 'instagram';

export const CANAIS_PREFERENCIAIS: Record<CanalPreferencial, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
};

/** Link de convite de grupo/comunidade do WhatsApp */
export const REGEX_GRUPO_WHATSAPP = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+\/?$/;

/** Lê o JSON de contatos da organização aceitando só valores seguros. */
export function lerContatos(json: Json): Contatos {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  const obj = json as Record<string, Json | undefined>;
  const url = (v: Json | undefined) => (typeof v === 'string' && /^https:\/\//i.test(v) ? v : undefined);
  const whatsapp = typeof obj.whatsapp === 'string' ? obj.whatsapp.replace(/\D/g, '') : '';
  const contatos: Contatos = {
    instagram: url(obj.instagram),
    facebook: url(obj.facebook),
    site: url(obj.site),
    formularioAdocao: url(obj.formulario_adocao),
    whatsapp: whatsapp.length >= 10 ? whatsapp : undefined,
    whatsappGrupo:
      typeof obj.whatsapp_grupo === 'string' && REGEX_GRUPO_WHATSAPP.test(obj.whatsapp_grupo) ? obj.whatsapp_grupo : undefined,
  };
  // a preferência só vale se o canal escolhido estiver preenchido
  if (obj.contato_preferencial === 'whatsapp' && (contatos.whatsapp || contatos.whatsappGrupo)) contatos.contatoPreferencial = 'whatsapp';
  if (obj.contato_preferencial === 'instagram' && contatos.instagram) contatos.contatoPreferencial = 'instagram';
  return contatos;
}

/** Extrai o nome de usuário de um link de perfil do Instagram (instagram.com/usuario). */
export function usuarioInstagram(link: string): string | undefined {
  const m = link.match(/^https:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i);
  return m?.[1];
}

export type LinkContato = {
  canal: CanalPreferencial;
  href: string;
  /** texto do botão */
  rotulo: string;
  /** o link já abre a conversa com a mensagem preenchida */
  mensagemPronta: boolean;
};

/** Link para o canal preferencial da organização, com a mensagem sugerida quando o canal permite. */
export function linkContatoPreferencial(contatos: Contatos, mensagem: string): LinkContato | undefined {
  if (contatos.contatoPreferencial === 'whatsapp') {
    if (contatos.whatsapp) {
      return {
        canal: 'whatsapp',
        href: `https://wa.me/${contatos.whatsapp}?text=${encodeURIComponent(mensagem)}`,
        rotulo: 'Conversar no WhatsApp',
        mensagemPronta: true,
      };
    }
    if (contatos.whatsappGrupo) {
      return { canal: 'whatsapp', href: contatos.whatsappGrupo, rotulo: 'Entrar no grupo do WhatsApp', mensagemPronta: false };
    }
  }
  if (contatos.contatoPreferencial === 'instagram' && contatos.instagram) {
    const usuario = usuarioInstagram(contatos.instagram);
    return {
      canal: 'instagram',
      // ig.me/m/usuario abre direto a conversa no Direct
      href: usuario ? `https://ig.me/m/${usuario}` : contatos.instagram,
      rotulo: usuario ? 'Enviar mensagem no Instagram' : 'Abrir o Instagram',
      mensagemPronta: false,
    };
  }
  return undefined;
}

export const VAGA_SELECT =
  'id, titulo, atividade, descricao, disponibilidade, status, criado_em, organizacao!inner(id, nome, cidade)' as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- usado só para inferir o tipo
const vagaQuery = supabase.from('vaga_voluntariado').select(VAGA_SELECT);
export type Vaga = QueryData<typeof vagaQuery>[number];
