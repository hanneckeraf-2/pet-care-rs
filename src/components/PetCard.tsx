import { Link } from 'react-router-dom';
import { MapPin, PawPrint } from 'lucide-react';
import Badge from './Badge';
import { ESPECIE_LABEL, formatarIdade, fotoPrincipal, type AnimalCard } from '../lib/animais';
import { STATUS_ANIMAL } from '../lib/labels';

type PetCardProps = {
  animal: AnimalCard;
  /** rota de detalhe; padrão /animais/:id */
  to?: string;
  acao?: string;
};

export default function PetCard({ animal, to, acao }: PetCardProps) {
  const imagem = fotoPrincipal(animal.foto);
  const destino = to ?? `/animais/${animal.id}`;
  const mostrarStatus = animal.status !== 'disponivel';

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col">
      <Link to={destino} className="relative h-48 block bg-gray-100" tabIndex={-1} aria-hidden="true">
        {imagem ? (
          <img src={imagem} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <PawPrint className="w-16 h-16" />
          </div>
        )}
        {(mostrarStatus || animal.aceita_lar_temporario) && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {mostrarStatus && <Badge {...STATUS_ANIMAL[animal.status]} />}
            {animal.aceita_lar_temporario && <Badge label="Precisa de lar temporário" cor="bg-teal-100 text-teal-800" />}
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-1">
          <Link to={destino} className="hover:text-purple-700">{animal.nome}</Link>
        </h3>
        <p className="text-gray-600">
          {animal.raca || ESPECIE_LABEL[animal.especie]} · {formatarIdade(animal.idade_meses)}
        </p>
        <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
          <MapPin size={14} aria-hidden="true" />
          {animal.cidade}
          {animal.organizacao && <span className="truncate"> · {animal.organizacao.nome}</span>}
        </p>
        <Link
          to={destino}
          className="mt-auto block text-center w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
        >
          {acao ?? `Conheça ${animal.nome}`}
        </Link>
      </div>
    </article>
  );
}

export function PetCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse" aria-hidden="true">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-9 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
