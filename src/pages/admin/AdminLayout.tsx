import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useOutletContext, useSearchParams } from 'react-router-dom';
import { BarChart3, Building2, ExternalLink, HandHeart, Heart, Inbox, LayoutDashboard, MessageCircle, PawPrint, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Tables } from '../../types/database';
import Spinner from '../../components/Spinner';

const CHAVE_ORG = 'petcare:admin-organizacao';

export type AdminContext = {
  org: Tables<'organizacao'>;
  recarregarOrg: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  return useOutletContext<AdminContext>();
}

const itens = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/animais', label: 'Animais', icon: PawPrint },
  { to: '/admin/adocoes', label: 'Solicitações', icon: Heart },
  { to: '/admin/mensagens', label: 'Mensagens', icon: MessageCircle },
  { to: '/admin/voluntariado', label: 'Voluntariado', icon: HandHeart },
  { to: '/admin/perfil', label: 'Perfil da organização', icon: Building2 },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
];

// itens exclusivos do administrador do sistema
const itensSistema = [
  { to: '/admin/sistema/organizacoes', label: 'Organizações e admins', icon: ShieldCheck, end: false },
  { to: '/admin/sistema/contato', label: 'Mensagens do site', icon: Inbox, end: false },
];

export default function AdminLayout() {
  const { perfil } = useAuth();
  const [org, setOrg] = useState<Tables<'organizacao'> | null>(null);
  const [carregando, setCarregando] = useState(true);

  // O administrador do sistema gerencia qualquer organização e escolhe qual no seletor;
  // o administrador de organização fica sempre na sua.
  const sistema = perfil?.tipo_usuario === 'admin_sistema';
  const [organizacoes, setOrganizacoes] = useState<{ id: number; nome: string }[]>([]);
  const [escolhida, setEscolhida] = useState<number | null>(() => {
    try {
      const salvo = Number(localStorage.getItem(CHAVE_ORG));
      return Number.isInteger(salvo) && salvo > 0 ? salvo : null;
    } catch {
      return null;
    }
  });

  // links como /admin/animais/5/editar?org=2 abrem o painel já na organização certa
  const [params] = useSearchParams();
  const orgDaUrl = Number(params.get('org'));
  useEffect(() => {
    if (sistema && Number.isInteger(orgDaUrl) && orgDaUrl > 0) setEscolhida(orgDaUrl);
  }, [sistema, orgDaUrl]);

  useEffect(() => {
    if (!sistema) return;
    supabase
      .from('organizacao')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => {
        setOrganizacoes(data ?? []);
        if (!data?.length) setCarregando(false);
      });
  }, [sistema]);

  const orgId = sistema
    ? organizacoes.find((o) => o.id === escolhida)?.id ?? organizacoes[0]?.id ?? null
    : perfil?.id_organizacao ?? null;

  function trocarOrganizacao(id: number) {
    setEscolhida(id);
    try {
      localStorage.setItem(CHAVE_ORG, String(id));
    } catch {
      // sem localStorage: a escolha vale só nesta visita
    }
  }

  const recarregarOrg = useCallback(async () => {
    if (!orgId) {
      // admin do sistema: espera a lista de organizações carregar
      if (!sistema) setCarregando(false);
      return;
    }
    const { data } = await supabase.from('organizacao').select('*').eq('id', orgId).maybeSingle();
    setOrg(data);
    setCarregando(false);
  }, [orgId, sistema]);

  useEffect(() => {
    recarregarOrg();
  }, [recarregarOrg]);

  if (carregando) return <Spinner />;

  if (!org) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2">Nenhuma organização vinculada</h1>
        <p className="text-gray-600">Sua conta ainda não está vinculada a uma organização. Peça ao administrador do sistema para fazer o vínculo.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Painel da organização</p>
          {sistema && organizacoes.length > 1 ? (
            <>
              <label htmlFor="org-ativa" className="sr-only">Organização</label>
              <select
                id="org-ativa"
                value={org.id}
                onChange={(e) => trocarOrganizacao(Number(e.target.value))}
                className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none pr-2 cursor-pointer"
              >
                {organizacoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </>
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold">{org.nome}</h1>
          )}
        </div>
        <Link to={`/organizacoes/${org.id}`} className="inline-flex items-center gap-1 text-purple-700 hover:underline text-sm font-semibold">
          Ver página pública <ExternalLink size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible bg-white rounded-lg shadow-sm p-2 h-fit" aria-label="Painel">
          {[...itens, ...(sistema ? itensSistema : [])].map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet context={{ org, recarregarOrg } satisfies AdminContext} />
        </div>
      </div>
    </div>
  );
}
