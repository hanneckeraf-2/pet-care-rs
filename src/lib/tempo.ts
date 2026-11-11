const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** "há 5 minutos", "ontem", "há 3 dias"... */
export function tempoRelativo(iso: string): string {
  const diffSeg = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeg);
  if (abs < 60) return 'agora';
  if (abs < 3600) return rtf.format(Math.round(diffSeg / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeg / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeg / 86400), 'day');
  return new Date(iso).toLocaleDateString('pt-BR');
}
