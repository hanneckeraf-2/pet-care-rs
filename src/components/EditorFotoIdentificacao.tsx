import { useRef, useState, type ReactNode } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { TIPOS_IMAGEM, TAMANHO_MAX_MB, validarImagem } from '../lib/upload';
import { traduzirErro } from '../lib/erros';
import { Alert, Button } from './ui';

type Props = {
  /** nome curto da foto, usado nos botões e nos avisos ("foto de perfil", "logo", "capa") */
  rotulo: string;
  /** pré-visualização atual (a foto ou o marcador de "sem foto") */
  previa: ReactNode;
  temFoto: boolean;
  dica?: string;
  onTrocar: (arquivo: File) => Promise<unknown>;
  onRemover: () => Promise<unknown>;
};

/** Escolher, trocar ou remover uma foto de identificação (perfil, logo ou capa). */
export default function EditorFotoIdentificacao({ rotulo, previa, temFoto, dica, onTrocar, onRemover }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState<'trocar' | 'remover' | null>(null);
  const [mensagem, setMensagem] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function executar(acao: 'trocar' | 'remover', fn: () => Promise<unknown>, sucesso: string) {
    setOcupado(acao);
    setMensagem(null);
    try {
      await fn();
      setMensagem({ type: 'success', text: sucesso });
    } catch (e) {
      setMensagem({ type: 'error', text: traduzirErro(e) });
    } finally {
      setOcupado(null);
      if (input.current) input.current.value = '';
    }
  }

  function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    const problema = validarImagem(arquivo);
    if (problema) return setMensagem({ type: 'error', text: problema });
    executar('trocar', () => onTrocar(arquivo), 'Imagem atualizada.');
  }

  function remover() {
    if (!window.confirm(`Remover ${rotulo}?`)) return;
    executar('remover', onRemover, 'Imagem removida.');
  }

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4">
      {previa}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" loading={ocupado === 'trocar'} disabled={!!ocupado} onClick={() => input.current?.click()}>
            <ImagePlus size={18} aria-hidden="true" /> {temFoto ? 'Trocar' : 'Enviar'} {rotulo}
          </Button>
          {temFoto && (
            <Button type="button" variant="secondary" loading={ocupado === 'remover'} disabled={!!ocupado} onClick={remover} className="!text-red-600">
              <Trash2 size={18} aria-hidden="true" /> Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          JPG, PNG ou WEBP de até {TAMANHO_MAX_MB} MB.{dica ? ` ${dica}` : ''}
        </p>
        {mensagem && <Alert type={mensagem.type}>{mensagem.text}</Alert>}
        <input
          ref={input}
          type="file"
          accept={TIPOS_IMAGEM.join(',')}
          className="sr-only"
          onChange={(e) => escolher(e.target.files?.[0])}
          aria-label={`Selecionar ${rotulo}`}
        />
      </div>
    </div>
  );
}
