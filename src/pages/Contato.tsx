import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, HelpCircle, Instagram, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { traduzirErro } from '../lib/erros';
import { useAuth } from '../contexts/AuthContext';
import { CONTATO } from '../lib/constants';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../components/ui';

const ASSUNTOS = [
  'Dúvida sobre adoção',
  'Animal desaparecido',
  'Quero cadastrar minha organização',
  'Problema no site',
  'Sugestão',
  'Outro',
];

const schema = z.object({
  nome: z.string().trim().min(2, { error: 'Informe seu nome.' }).max(120),
  email: z.email({ error: 'Informe um e-mail válido.' }).max(200),
  assunto: z.string().min(1, { error: 'Selecione um assunto.' }),
  mensagem: z.string().trim().min(10, { error: 'Escreva pelo menos 10 caracteres.' }).max(5000),
  // campo invisível: pessoas não preenchem, robôs de spam costumam preencher
  site: z.string().max(0),
});
type FormData = z.infer<typeof schema>;

const FAQ = [
  {
    pergunta: 'Como funciona a adoção?',
    resposta: 'Escolha um animal, clique em "Solicitar Adoção" e preencha o formulário. A organização responsável analisa e entra em contato com você.',
  },
  {
    pergunta: 'O site recebe as doações?',
    resposta: 'Não. As doações são feitas diretamente para cada organização, pela chave Pix exibida na página dela.',
  },
  {
    pergunta: 'Represento uma ONG. Como entro no site?',
    resposta: 'Crie sua conta e nos envie uma mensagem com o assunto "Quero cadastrar minha organização". Após a verificação, liberamos o painel para você.',
  },
];

export default function Contato() {
  const { user, perfil } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { nome: perfil?.nome ?? '', email: user?.email ?? '', assunto: '', mensagem: '', site: '' },
    resetOptions: { keepDirtyValues: true },
  });

  async function onSubmit(d: FormData) {
    setErro(null);
    const { error } = await supabase.from('mensagem_contato').insert({
      nome: d.nome,
      email: d.email,
      assunto: d.assunto,
      mensagem: d.mensagem,
      id_usuario: user?.id ?? null,
    });
    if (error) return setErro(traduzirErro(error));
    setEnviado(true);
    reset();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Entre em Contato</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Dúvidas, sugestões ou quer trazer sua organização para o Pet Care RS? Fale com a gente.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <Card>
          {enviado ? (
            <div className="text-center py-10">
              <Send className="w-12 h-12 text-purple-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">Mensagem enviada!</h2>
              <p className="text-gray-600 mb-6">Obrigado pelo contato. Responderemos pelo e-mail informado.</p>
              <Button variant="secondary" onClick={() => setEnviado(false)}>Enviar outra mensagem</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {erro && <Alert type="error">{erro}</Alert>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="c-nome" label="Nome" error={errors.nome?.message}>
                  <Input id="c-nome" autoComplete="name" invalid={!!errors.nome} {...register('nome')} />
                </Field>
                <Field id="c-email" label="E-mail" error={errors.email?.message}>
                  <Input id="c-email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
                </Field>
              </div>
              <Field id="c-assunto" label="Assunto" error={errors.assunto?.message}>
                <Select id="c-assunto" invalid={!!errors.assunto} {...register('assunto')}>
                  <option value="">Selecione</option>
                  {ASSUNTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
              <Field id="c-mensagem" label="Mensagem" error={errors.mensagem?.message}>
                <Textarea id="c-mensagem" rows={6} invalid={!!errors.mensagem} {...register('mensagem')} />
              </Field>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="c-site">Não preencha este campo</label>
                <input id="c-site" tabIndex={-1} autoComplete="off" {...register('site')} />
              </div>
              <Button type="submit" loading={isSubmitting}>
                <Send size={18} aria-hidden="true" /> Enviar mensagem
              </Button>
            </form>
          )}
        </Card>

        <aside className="space-y-6">
          <Card className="!p-5">
            <h2 className="font-semibold text-lg mb-3">Outros canais</h2>
            <ul className="space-y-3 text-gray-700">
              <li>
                <a href={`mailto:${CONTATO.email}`} className="flex items-center gap-3 hover:text-purple-700 break-all">
                  <Mail size={18} className="text-purple-600 shrink-0" aria-hidden="true" /> {CONTATO.email}
                </a>
              </li>
              <li>
                <a href={CONTATO.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-purple-700">
                  <MessageCircle size={18} className="text-purple-600" aria-hidden="true" /> WhatsApp: {CONTATO.telefone}
                </a>
              </li>
              <li>
                <a href={CONTATO.instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-purple-700">
                  <Instagram size={18} className="text-purple-600" aria-hidden="true" /> {CONTATO.instagram}
                </a>
              </li>
              <li className="flex items-center gap-3"><MapPin size={18} className="text-purple-600" aria-hidden="true" /> Canoas e São Leopoldo/RS</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4">
              Para falar com um abrigo ou ONG específica, use os contatos na{' '}
              <Link to="/organizacoes" className="text-purple-700 font-semibold hover:underline">página da organização</Link>.
            </p>
          </Card>

          <Card className="!p-5">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <HelpCircle size={20} className="text-purple-600" aria-hidden="true" /> Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {FAQ.map((f) => (
                <details key={f.pergunta} className="group border-b border-gray-100 pb-2">
                  <summary className="cursor-pointer font-medium text-gray-800 list-none flex justify-between gap-2">
                    {f.pergunta}
                    <span className="text-purple-600 group-open:rotate-45 transition" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-sm text-gray-600 mt-2">{f.resposta}</p>
                </details>
              ))}
            </div>
          </Card>

          <Card className="!p-5 bg-purple-50">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Building2 size={18} className="text-purple-600" aria-hidden="true" /> É uma ONG ou abrigo?
            </h2>
            <p className="text-sm text-gray-700">
              Cadastre seus animais, receba pedidos de adoção e voluntários, e divulgue suas necessidades. É gratuito.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
