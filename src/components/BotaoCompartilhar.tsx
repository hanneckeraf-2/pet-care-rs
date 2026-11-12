import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';

type Props = {
  titulo: string;
  texto: string;
  /** padrão: endereço da página atual */
  url?: string;
  className?: string;
};

/**
 * Compartilhar a página: no celular abre o menu nativo (WhatsApp, Instagram...);
 * no computador mostra opções de WhatsApp e copiar link.
 */
export default function BotaoCompartilhar({ titulo, texto, url, className = '' }: Props) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const link = url ?? window.location.href;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url: link });
        return;
      } catch (e) {
        // o usuário fechou o menu: não faz nada
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    setAberto((v) => !v);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={compartilhar}
        className={`inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 ${className}`}
        aria-haspopup="true"
        aria-expanded={aberto}
      >
        <Share2 size={16} aria-hidden="true" /> Compartilhar
      </button>
      {aberto && (
        <div className="absolute z-30 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1" role="menu">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setAberto(false)}
          >
            <MessageCircle size={16} className="text-green-600" aria-hidden="true" /> Enviar pelo WhatsApp
          </a>
          <button type="button" role="menuitem" onClick={copiar} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {copiado ? <Check size={16} className="text-green-600" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </div>
  );
}
