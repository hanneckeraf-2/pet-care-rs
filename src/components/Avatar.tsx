type Props = {
  url?: string | null;
  nome?: string | null;
  /** classes de tamanho e texto, por exemplo "w-10 h-10 text-sm" */
  className?: string;
  /** texto alternativo; vazio quando o nome já aparece ao lado */
  alt?: string;
};

/** Foto de identificação redonda; sem foto, mostra a inicial do nome. */
export default function Avatar({ url, nome, className = 'w-10 h-10 text-sm', alt = '' }: Props) {
  if (url) {
    return <img src={url} alt={alt} className={`${className} rounded-full object-cover bg-gray-100 shrink-0`} loading="lazy" />;
  }
  return (
    <span
      className={`${className} rounded-full bg-purple-600 text-white flex items-center justify-center font-bold uppercase shrink-0`}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      role={alt ? 'img' : undefined}
    >
      {(nome?.trim() || '?').charAt(0)}
    </span>
  );
}
