import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

type ComingSoonProps = {
  title: string;
  description?: string;
};

/** Página provisória para rotas do mapa do site ainda não implementadas. */
export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <Construction className="w-14 h-14 text-purple-500 mx-auto mb-6" aria-hidden="true" />
      <h1 className="text-3xl font-bold mb-3">{title}</h1>
      <p className="text-gray-600 max-w-xl mx-auto mb-8">
        {description ?? 'Esta seção está em desenvolvimento e estará disponível em breve.'}
      </p>
      <Link to="/" className="text-purple-700 font-semibold hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
