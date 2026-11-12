import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Field, Input, Textarea } from '../../components/ui';

type Props = {
  animalId: number;
  animalNome: string;
  organizacaoNome?: string;
  onEnviado: () => void;
  onCancelar: () => void;
};

/** "Quero Mais Informações": pergunta enviada à organização responsável pelo animal. */
export default function PerguntaAnimal({ animalId, animalNome, organizacaoNome, onEnviado, onCancelar }: Props) {
  const { user, perfil } = useAuth();
  const [mensagem, setMensagem] = useState('');
  const [contato, setContato] = useState(perfil?.telefone || user?.email || '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (mensagem.trim().length < 5) return setErro('Escreva sua pergunta (pelo menos 5 caracteres).');
    if (contato.trim().length < 5) return setErro('Informe um telefone ou e-mail para a organização responder.');
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.from('mensagem_animal').insert({
      id_animal: animalId,
      id_remetente: user.id,
      mensagem: mensagem.trim(),
      contato_retorno: contato.trim(),
    });
    setEnviando(false);
    if (error) return setErro(traduzirErro(error));
    onEnviado();
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <h2 className="text-xl font-semibold">Quero mais informações sobre {animalNome}</h2>
      <p className="text-sm text-gray-600">
        Sua pergunta será enviada {organizacaoNome ? `à ${organizacaoNome}` : 'à organização responsável'}, que responderá pelo contato informado.
      </p>
      {erro && <Alert type="error">{erro}</Alert>}
      <Field id="pg-mensagem" label="Sua pergunta">
        <Textarea
          id="pg-mensagem"
          rows={4}
          maxLength={2000}
          placeholder="Ex.: Ele se dá bem com gatos? Já é castrado? Posso visitá-lo antes?"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </Field>
      <Field id="pg-contato" label="Telefone ou e-mail para resposta">
        <Input id="pg-contato" maxLength={120} value={contato} onChange={(e) => setContato(e.target.value)} />
      </Field>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" loading={enviando}>Enviar pergunta</Button>
        <Button type="button" variant="secondary" onClick={onCancelar}>Cancelar</Button>
      </div>
    </form>
  );
}
