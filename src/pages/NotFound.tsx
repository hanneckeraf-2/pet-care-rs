import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <PawPrint className="w-14 h-14 text-purple-500 mx-auto mb-6" aria-hidden="true" />
      <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
      <p className="text-gray-600 mb-8">Parece que este caminho se perdeu. Que tal voltar para o início?</p>
      <Link to="/" className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition">
        Ir para o início
      </Link>
    </div>
  );
}
