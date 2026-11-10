import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

type PetCardProps = {
  to: string;
  nome: string;
  subtitulo: string;
  detalhe: string;
  imagem: string;
};

export default function PetCard({ to, nome, subtitulo, detalhe, imagem }: PetCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col">
      <div className="relative h-48">
        <img src={imagem} alt={`Foto de ${nome}`} className="w-full h-full object-cover" loading="lazy" />
        <button
          type="button"
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
          aria-label={`Favoritar ${nome}`}
        >
          <Heart size={20} className="text-red-500" />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-1">{nome}</h3>
        <p className="text-gray-600">{subtitulo}</p>
        <p className="text-gray-500 text-sm mb-4">{detalhe}</p>
        <Link
          to={to}
          className="mt-auto block text-center w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
        >
          Conheça {nome}
        </Link>
      </div>
    </article>
  );
}
