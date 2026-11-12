import type { Enums } from '../types/database';

export const STATUS_ADOCAO: Record<Enums<'status_adocao'>, { label: string; cor: string }> = {
  em_analise: { label: 'Em análise', cor: 'bg-yellow-100 text-yellow-800' },
  aprovada: { label: 'Aprovada', cor: 'bg-green-100 text-green-800' },
  rejeitada: { label: 'Não aprovada', cor: 'bg-red-100 text-red-800' },
  cancelada: { label: 'Cancelada', cor: 'bg-gray-100 text-gray-700' },
};

export const STATUS_INSCRICAO: Record<Enums<'status_inscricao'>, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-yellow-100 text-yellow-800' },
  aprovada: { label: 'Aprovada', cor: 'bg-green-100 text-green-800' },
  rejeitada: { label: 'Não aprovada', cor: 'bg-red-100 text-red-800' },
  cancelada: { label: 'Cancelada', cor: 'bg-gray-100 text-gray-700' },
};

export const STATUS_ANIMAL: Record<Enums<'status_animal'>, { label: string; cor: string }> = {
  disponivel: { label: 'Disponível', cor: 'bg-green-100 text-green-800' },
  em_processo: { label: 'Em processo de adoção', cor: 'bg-yellow-100 text-yellow-800' },
  em_lar_temporario: { label: 'Em lar temporário', cor: 'bg-cyan-100 text-cyan-800' },
  adotado: { label: 'Adotado', cor: 'bg-purple-100 text-purple-800' },
  perdido: { label: 'Perdido', cor: 'bg-red-100 text-red-800' },
  encontrado: { label: 'Encontrado', cor: 'bg-blue-100 text-blue-800' },
  resgatado: { label: 'Resgatado', cor: 'bg-orange-100 text-orange-800' },
  reunido: { label: 'Voltou para casa', cor: 'bg-emerald-100 text-emerald-800' },
};

export const DISPONIBILIDADE: Record<Enums<'disponibilidade'>, string> = {
  dias_uteis: 'Dias úteis',
  finais_de_semana: 'Finais de semana',
  flexivel: 'Flexível',
};

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
