import type { QueryData } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Enums } from '../types/database';

export const POR_PAGINA = 12;

export const ESPECIE_LABEL: Record<Enums<'especie'>, string> = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro',
};

export const SEXO_LABEL: Record<Enums<'sexo'>, string> = {
  macho: 'Macho',
  femea: 'Fêmea',
  desconhecido: 'Não informado',
};

export const PORTE_LABEL: Record<Enums<'porte'>, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

/** Faixas etárias da busca, em meses: [mínimo, máximo exclusivo) */
export const FAIXA_IDADE_MESES: Record<string, [number, number | null]> = {
  filhote: [0, 12],
  jovem: [12, 36],
  adulto: [36, 96],
  idoso: [96, null],
};

export function formatarIdade(meses: number | null): string {
  if (meses === null) return 'Idade não informada';
  if (meses < 12) return meses <= 1 ? `${meses} mês` : `${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? '1 ano' : `${anos} anos`;
}

/** Campos usados nos cards de animais */
export const ANIMAL_CARD_SELECT =
  'id, nome, especie, raca, idade_meses, sexo, porte, status, cidade, organizacao(id, nome), foto(url, ordem)' as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- usado só para inferir o tipo
const cardQuery = supabase.from('animal').select(ANIMAL_CARD_SELECT);
export type AnimalCard = QueryData<typeof cardQuery>[number];

export function fotoPrincipal(fotos: { url: string; ordem: number }[] | null | undefined): string | null {
  if (!fotos || fotos.length === 0) return null;
  return [...fotos].sort((a, b) => a.ordem - b.ordem)[0].url;
}

export type FiltrosAnimais = {
  q?: string;
  especie?: string;
  idade?: string;
  cidade?: string;
  organizacao?: string;
  porte?: string;
  sexo?: string;
};

/** Remove caracteres que têm significado especial no filtro `or` do PostgREST. */
function limparTermo(termo: string) {
  return termo.replace(/[%,()*\\]/g, ' ').trim();
}

export async function buscarAnimaisParaAdocao(filtros: FiltrosAnimais, pagina: number) {
  let query = supabase
    .from('animal')
    .select(ANIMAL_CARD_SELECT, { count: 'exact' })
    .in('status', ['disponivel', 'em_processo'])
    .not('id_organizacao', 'is', null);

  if (filtros.especie) query = query.eq('especie', filtros.especie as Enums<'especie'>);
  if (filtros.cidade) query = query.eq('cidade', filtros.cidade);
  if (filtros.organizacao) query = query.eq('id_organizacao', Number(filtros.organizacao));
  if (filtros.porte) query = query.eq('porte', filtros.porte as Enums<'porte'>);
  if (filtros.sexo) query = query.eq('sexo', filtros.sexo as Enums<'sexo'>);

  const faixa = filtros.idade ? FAIXA_IDADE_MESES[filtros.idade] : undefined;
  if (faixa) {
    query = query.gte('idade_meses', faixa[0]);
    if (faixa[1] !== null) query = query.lt('idade_meses', faixa[1]);
  }

  const termo = filtros.q ? limparTermo(filtros.q) : '';
  if (termo) query = query.or(`nome.ilike.%${termo}%,raca.ilike.%${termo}%,descricao.ilike.%${termo}%`);

  const inicio = (pagina - 1) * POR_PAGINA;
  return query
    .order('status', { ascending: true }) // 'disponivel' antes de 'em_processo'
    .order('criado_em', { ascending: false })
    .range(inicio, inicio + POR_PAGINA - 1);
}
