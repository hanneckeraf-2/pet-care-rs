import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ImagePlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES } from '../../lib/constants';
import { REGEX_GRUPO_WHATSAPP, lerContatos } from '../../lib/organizacoes';
import { TIPOS_IMAGEM, validarImagem } from '../../lib/upload';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../../components/ui';
import { useAdmin } from './AdminLayout';

const urlOpcional = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), { error: 'Use um link completo começando com https://' });

const schema = z.object({
  nome: z.string().trim().min(2, { error: 'Informe o nome.' }).max(120),
  descricao: z.string().trim().max(3000),
  endereco: z.string().trim().max(200),
  cidade: z.string().min(1, { error: 'Selecione a cidade.' }),
  telefone: z.string().trim().max(20).regex(/^[\d\s()+-]*$/, { error: 'Telefone inválido.' }),
  email: z.union([z.email({ error: 'E-mail inválido.' }), z.literal('')]),
  whatsapp: z.string().trim().max(20).regex(/^[\d\s()+-]*$/, { error: 'Use apenas números (com DDD).' }),
  whatsapp_grupo: z
    .string()
    .trim()
    .refine((v) => v === '' || REGEX_GRUPO_WHATSAPP.test(v), { error: 'Cole o link de convite completo, no formato https://chat.whatsapp.com/...' }),
  instagram: urlOpcional,
  facebook: urlOpcional,
  site: urlOpcional,
  formulario_adocao: urlOpcional,
  pix_doacao: z.string().trim().max(140),
  necessidades: z.string().trim().max(2000),
});
type FormData = z.infer<typeof schema>;

export default function AdminPerfil() {
  const { org, recarregarOrg } = useAdmin();
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const c = lerContatos(org.contatos);
    reset({
      nome: org.nome,
      descricao: org.descricao ?? '',
      endereco: org.endereco ?? '',
      cidade: org.cidade,
      telefone: org.telefone ?? '',
      email: org.email ?? '',
      whatsapp: c.whatsapp ?? '',
      whatsapp_grupo: c.whatsappGrupo ?? '',
      instagram: c.instagram ?? '',
      facebook: c.facebook ?? '',
      site: c.site ?? '',
      formulario_adocao: c.formularioAdocao ?? '',
      pix_doacao: org.pix_doacao ?? '',
      necessidades: org.necessidades ?? '',
    });
  }, [org, reset]);

  async function salvar(d: FormData) {
    setMensagem(null);
    const contatos: Record<string, string> = {};
    const whats = d.whatsapp.replace(/\D/g, '');
    if (whats) contatos.whatsapp = whats.length <= 11 ? `55${whats}` : whats;
    if (d.whatsapp_grupo) contatos.whatsapp_grupo = d.whatsapp_grupo;
    if (d.instagram) contatos.instagram = d.instagram;
    if (d.facebook) contatos.facebook = d.facebook;
    if (d.site) contatos.site = d.site;
    if (d.formulario_adocao) contatos.formulario_adocao = d.formulario_adocao;

    const { error } = await supabase
      .from('organizacao')
      .update({
        nome: d.nome,
        descricao: d.descricao || null,
        endereco: d.endereco || null,
        cidade: d.cidade,
        telefone: d.telefone || null,
        email: d.email || null,
        contatos,
        pix_doacao: d.pix_doacao || null,
        necessidades: d.necessidades || null,
      })
      .eq('id', org.id);
    if (error) return setMensagem({ type: 'error', text: traduzirErro(error) });
    await recarregarOrg();
    setMensagem({ type: 'success', text: 'Perfil da organização atualizado.' });
  }

  async function trocarFoto(arquivo: File | undefined) {
    if (!arquivo || !user) return;
    const problema = validarImagem(arquivo);
    if (problema) return setMensagem({ type: 'error', text: problema });
    setEnviandoFoto(true);
    setMensagem(null);
    const ext = arquivo.type.split('/')[1].replace('jpeg', 'jpg');
    const caminho = `${user.id}/organizacao/${org.id}/${crypto.randomUUID()}.${ext}`;
    const { error: erroUpload } = await supabase.storage.from('fotos').upload(caminho, arquivo, { contentType: arquivo.type });
    if (erroUpload) {
      setEnviandoFoto(false);
      return setMensagem({ type: 'error', text: traduzirErro(erroUpload) });
    }
    const url = supabase.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
    const { error } = await supabase.from('organizacao').update({ foto_url: url }).eq('id', org.id);
    setEnviandoFoto(false);
    if (inputFoto.current) inputFoto.current.value = '';
    if (error) return setMensagem({ type: 'error', text: traduzirErro(error) });
    await recarregarOrg();
    setMensagem({ type: 'success', text: 'Foto atualizada.' });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Perfil da organização</h2>
      {mensagem && <div className="mb-4"><Alert type={mensagem.type}>{mensagem.text}</Alert></div>}

      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Foto de capa</h3>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-64 h-36 rounded-md overflow-hidden bg-purple-50 shrink-0">
            {org.foto_url ? (
              <img src={org.foto_url} alt="Capa da organização" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-full h-full p-10 text-purple-200" aria-hidden="true" />
            )}
          </div>
          <div>
            <Button type="button" variant="secondary" loading={enviandoFoto} onClick={() => inputFoto.current?.click()}>
              <ImagePlus size={18} aria-hidden="true" /> Trocar foto
            </Button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG ou WEBP de até 5 MB. Formato horizontal fica melhor.</p>
            <input ref={inputFoto} type="file" accept={TIPOS_IMAGEM.join(',')} className="sr-only" onChange={(e) => trocarFoto(e.target.files?.[0])} aria-label="Selecionar foto de capa" />
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit(salvar)} className="space-y-6" noValidate>
        <Card>
          <h3 className="font-semibold mb-3">Informações gerais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="nome" label="Nome" error={errors.nome?.message}>
              <Input id="nome" invalid={!!errors.nome} {...register('nome')} />
            </Field>
            <Field id="cidade" label="Cidade" error={errors.cidade?.message}>
              <Select id="cidade" invalid={!!errors.cidade} {...register('cidade')}>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field id="endereco" label="Endereço">
                <Input id="endereco" {...register('endereco')} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="descricao" label="Sobre a organização">
                <Textarea id="descricao" rows={4} {...register('descricao')} />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Contato e redes sociais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="telefone" label="Telefone" error={errors.telefone?.message}>
              <Input id="telefone" type="tel" invalid={!!errors.telefone} {...register('telefone')} />
            </Field>
            <Field id="email" label="E-mail" error={errors.email?.message}>
              <Input id="email" type="email" invalid={!!errors.email} {...register('email')} />
            </Field>
            <Field id="whatsapp" label="WhatsApp (com DDD)" error={errors.whatsapp?.message}>
              <Input id="whatsapp" type="tel" placeholder="51 99999-9999" invalid={!!errors.whatsapp} {...register('whatsapp')} />
            </Field>
            <Field
              id="whatsapp-grupo"
              label="Grupo do WhatsApp (link de convite)"
              hint="No WhatsApp: abra o grupo → nome do grupo → Convidar via link → Copiar link."
              error={errors.whatsapp_grupo?.message}
            >
              <Input id="whatsapp-grupo" placeholder="https://chat.whatsapp.com/..." invalid={!!errors.whatsapp_grupo} {...register('whatsapp_grupo')} />
            </Field>
            <Field id="instagram" label="Instagram (link)" error={errors.instagram?.message}>
              <Input id="instagram" placeholder="https://instagram.com/..." invalid={!!errors.instagram} {...register('instagram')} />
            </Field>
            <Field id="facebook" label="Facebook (link)" error={errors.facebook?.message}>
              <Input id="facebook" placeholder="https://facebook.com/..." invalid={!!errors.facebook} {...register('facebook')} />
            </Field>
            <Field id="site" label="Site (link)" error={errors.site?.message}>
              <Input id="site" placeholder="https://..." invalid={!!errors.site} {...register('site')} />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Doações e necessidades</h3>
          <div className="space-y-4">
            <Field
              id="formulario-adocao"
              label="Formulário de adoção (link, opcional)"
              hint="Se preenchido, o botão Quero Adotar leva a pessoa para este formulário em vez do formulário do site. No Google Forms, use Enviar → ícone de link (endereço .../viewform)."
              error={errors.formulario_adocao?.message}
            >
              <Input
                id="formulario-adocao"
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                invalid={!!errors.formulario_adocao}
                {...register('formulario_adocao')}
              />
            </Field>
            {/\/edit(\?.*)?$/.test(watch('formulario_adocao') ?? '') && (
              <p className="-mt-2 text-sm text-amber-700" role="alert">
                Este parece ser o link de <strong>edição</strong> do formulário, que o público não consegue abrir. No Google Forms, clique em
                Enviar → ícone de link e copie o endereço que termina em /viewform.
              </p>
            )}
            <Field id="pix" label="Chave Pix para doações" hint="Aparece no botão Quero Doar da página pública.">
              <Input id="pix" {...register('pix_doacao')} />
            </Field>
            <Field id="necessidades" label="Do que vocês estão precisando?" hint="Ração, medicamentos, cobertores, voluntários, lares temporários...">
              <Textarea id="necessidades" rows={4} {...register('necessidades')} />
            </Field>
          </div>
        </Card>

        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Salvar alterações</Button>
      </form>
    </div>
  );
}
