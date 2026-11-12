import type { ReactNode } from 'react';

type Props = {
  titulo: string;
  atualizadoEm: string;
  children: ReactNode;
};

/** Layout de páginas de texto longo (Política de Privacidade, Termos de Uso). */
export default function PaginaTexto({ titulo, atualizadoEm, children }: Props) {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">{titulo}</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: {atualizadoEm}</p>
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-6 text-gray-800 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-purple-700 [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
