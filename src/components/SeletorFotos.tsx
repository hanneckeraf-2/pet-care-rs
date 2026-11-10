import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { MAX_FOTOS, TAMANHO_MAX_MB, TIPOS_IMAGEM, validarImagem } from '../lib/upload';

type Props = {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  max?: number;
};

/** Seleção de fotos com pré-visualização, validação de tipo e tamanho. */
export default function SeletorFotos({ arquivos, onChange, max = MAX_FOTOS }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  const previews = useMemo(() => arquivos.map((a) => URL.createObjectURL(a)), [arquivos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function adicionar(lista: FileList | null) {
    if (!lista) return;
    const novos: File[] = [];
    for (const arquivo of Array.from(lista)) {
      const problema = validarImagem(arquivo);
      if (problema) {
        setErro(problema);
        continue;
      }
      novos.push(arquivo);
    }
    const total = [...arquivos, ...novos];
    if (total.length > max) setErro(`Você pode enviar no máximo ${max} fotos.`);
    else if (novos.length === lista.length) setErro(null);
    onChange(total.slice(0, max));
    if (inputRef.current) inputRef.current.value = '';
  }

  function remover(indice: number) {
    onChange(arquivos.filter((_, i) => i !== indice));
    setErro(null);
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {previews.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
            <img src={url} alt={`Pré-visualização da foto ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[10px] px-1.5 rounded">Principal</span>}
            <button
              type="button"
              onClick={() => remover(i)}
              className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white"
              aria-label={`Remover foto ${i + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {arquivos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition"
          >
            <ImagePlus size={24} aria-hidden="true" />
            <span className="text-xs mt-1">Adicionar</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_IMAGEM.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => adicionar(e.target.files)}
        aria-label="Selecionar fotos"
      />
      <p className="mt-2 text-xs text-gray-500">Até {max} fotos, JPG, PNG ou WEBP, com no máximo {TAMANHO_MAX_MB} MB cada.</p>
      {erro && <p className="mt-1 text-sm text-red-600" role="alert">{erro}</p>}
    </div>
  );
}
