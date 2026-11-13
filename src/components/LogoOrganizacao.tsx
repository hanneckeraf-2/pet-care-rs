import { Building2 } from 'lucide-react';

type Props = {
  url?: string | null;
  /** classes de tamanho, por exemplo "w-12 h-12" */
  className?: string;
  alt?: string;
};

/** Logo redondo da organização; sem logo, mostra o ícone de prédio. */
export default function LogoOrganizacao({ url, className = 'w-12 h-12', alt = '' }: Props) {
  return (
    <span className={`${className} rounded-full overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center`}>
      {url ? (
        <img src={url} alt={alt} className="w-full h-full object-contain" loading="lazy" />
      ) : (
        <Building2 className="w-1/2 h-1/2 text-purple-400" aria-hidden="true" />
      )}
    </span>
  );
}
