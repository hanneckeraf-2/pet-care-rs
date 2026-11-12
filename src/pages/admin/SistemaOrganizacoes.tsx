import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Select } from '../../components/ui';
import Spinner from '../../components/Spinner';
import { AcessoSistema } from './SistemaContato';

type Org = { id: number; nome: string; cidade: string };
type Admin = { id: string; nome: string; email: string; id_organizacao: number | null };

/** Administrador do sistema: cadastra organizações e vincula seus administradores. */
export default function SistemaOrganizacoes() {
  const { perfil } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [novoNome, setNovoNome] = useState('');
  const [novaCidade, setNovaCidade] = useState('São Leopoldo');
  const [email, setEmail] = useState('');
  const [orgVinculo, setOrgVinculo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const [o, a] = await Promise.all([
      supabase.from('organizacao').select('id, nome, cidade').order('nome'),
      supabase.from('usuario').select('id, nome, email, id_organizacao').eq('tipo_usuario', 'admin_org').order('nome'),
    ]);
    const falha = o.error ?? a.error;
    if (falha) setMsg({ type: 'error', text: traduzirErro(falha) });
    setOrgs(o.data ?? []);
    setAdmins(a.data ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (perfil?.tipo_usuario !== 'admin_sistema') return <AcessoSistema />;

  async function criarOrganizacao(e: FormEvent) {
    e.preventDefault();
    if (novoNome.trim().length < 2) return setMsg({ type: 'error', text: 'Informe o nome da organização.' });
    setSalvando(true);
    setMsg(null);
    const { error } = await supabase.from('organizacao').insert({ nome: novoNome.trim(), cidade: novaCidade });
    setSalvando(false);
    if (error) return setMsg({ type: 'error', text: traduzirErro(error) });
    setMsg({ type: 'success', text: `Organização "${novoNome.trim()}" criada. Escolha-a no seletor do painel para completar o perfil.` });
    setNovoNome('');
    carregar();
  }

  async function vincularAdmin(e: FormEvent) {
    e.preventDefault();
    if (!orgVinculo) return setMsg({ type: 'error', text: 'Escolha a organização.' });
    setSalvando(true);
    setMsg(null);
    const { data, error } = await supabase
      .from('usuario')
      .update({ tipo_usuario: 'admin_org', id_organizacao: Number(orgVinculo) })
      .eq('email', email.trim().toLowerCase())
      .neq('tipo_usuario', 'admin_sistema')
      .select('id');
    setSalvando(false);
    if (error) return setMsg({ type: 'error', text: traduzirErro(error) });
    if (!data?.length) {
      return setMsg({
        type: 'error',
        text: 'Nenhuma conta encontrada com esse e-mail. A pessoa precisa primeiro criar a conta no site, com este mesmo e-mail.',
      });
    }
    setMsg({ type: 'success', text: `${email.trim()} agora administra a organização.` });
    setEmail('');
    carregar();
  }

  async function removerAdmin(admin: Admin) {
    if (!confirm(`Remover ${admin.nome || admin.email} da administração? A conta continua existindo como usuário comum.`)) return;
    const { error } = await supabase.from('usuario').update({ tipo_usuario: 'comum', id_organizacao: null }).eq('id', admin.id);
    if (error) return setMsg({ type: 'error', text: traduzirErro(error) });
    carregar();
  }

  if (carregando) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="text-purple-600" size={22} aria-hidden="true" /> Organizações e administradores
        </h2>
        <p className="text-sm text-gray-600">Área do administrador do sistema.</p>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card>
        <h3 className="font-semibold mb-3">Organizações cadastradas</h3>
        <ul className="divide-y divide-gray-100">
          {orgs.map((o) => {
            const daOrg = admins.filter((a) => a.id_organizacao === o.id);
            return (
              <li key={o.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/organizacoes/${o.id}`} className="font-semibold hover:text-purple-700 flex items-center gap-2">
                    <Building2 size={16} className="text-purple-600" aria-hidden="true" /> {o.nome}
                  </Link>
                  <span className="text-sm text-gray-500">{o.cidade}</span>
                </div>
                {daOrg.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-1">Sem administrador próprio (gerenciada pelo administrador do sistema).</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {daOrg.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded px-3 py-1.5">
                        <span>{a.nome || '(sem nome)'} · <span className="text-gray-500">{a.email}</span></span>
                        <button onClick={() => removerAdmin(a)} className="text-red-600 hover:underline flex items-center gap-1 text-xs">
                          <UserMinus size={14} aria-hidden="true" /> Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <UserPlus size={18} className="text-purple-600" aria-hidden="true" /> Vincular administrador
          </h3>
          <form onSubmit={vincularAdmin} className="space-y-3" noValidate>
            <Field id="vinc-email" label="E-mail da conta" hint="A pessoa precisa ter criado a conta no site.">
              <Input id="vinc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field id="vinc-org" label="Organização">
              <Select id="vinc-org" value={orgVinculo} onChange={(e) => setOrgVinculo(e.target.value)}>
                <option value="">Selecione</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </Select>
            </Field>
            <Button type="submit" loading={salvando}>Vincular</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-purple-600" aria-hidden="true" /> Nova organização
          </h3>
          <form onSubmit={criarOrganizacao} className="space-y-3" noValidate>
            <Field id="org-nome" label="Nome">
              <Input id="org-nome" maxLength={120} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            </Field>
            <Field id="org-cidade" label="Cidade">
              <Select id="org-cidade" value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)}>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Button type="submit" loading={salvando}>Criar organização</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
