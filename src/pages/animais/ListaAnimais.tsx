import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES, ESPECIES, FAIXAS_IDADE } from '../../lib/constants';
import { POR_PAGINA, PORTE_LABEL, SEXO_LABEL, buscarAnimaisParaAdocao, type AnimalCard, type FiltrosAnimais } from '../../lib/animais';
import PetCard, { PetCardSkeleton } from '../../components/PetCard';
import { Alert, Field, Input, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

const CHAVES_FILTRO = ['q', 'especie', 'idade', 'cidade', 'organizacao', 'porte', 'sexo'] as const;

export default function ListaAnimais() {
  const [params, setParams] = useSearchParams();
  const { isAdminOrg } = useAuth();
  const [animais, setAnimais] = useState<AnimalCard[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [organizacoes, setOrganizacoes] = useState<{ id: number; nome: string }[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [termo, setTermo] = useState(params.get('q') ?? '');

  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const filtros: FiltrosAnimais = Object.fromEntries(
    CHAVES_FILTRO.map((k) => [k, params.get(k) ?? undefined])
  );
  const chaveBusca = params.toString();
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const filtrosAtivos = CHAVES_FILTRO.filter((k) => params.get(k)).length;

  useEffect(() => {
    supabase
      .from('organizacao')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => setOrganizacoes(data ?? []));
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    const p = new URLSearchParams(chaveBusca);
    const f = Object.fromEntries(CHAVES_FILTRO.map((k) => [k, p.get(k) ?? undefined]));
    const pg = Math.max(1, Number(p.get('pagina')) || 1);
    buscarAnimaisParaAdocao(f, pg).then(({ data, count, error }) => {
      if (!ativo) return;
      if (error) setErro(traduzirErro(error));
      setAnimais(data ?? []);
      setTotal(count ?? 0);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [chaveBusca]);

  function atualizar(chave: string, valor: string) {
    const novo = new URLSearchParams(params);
    if (valor) novo.set(chave, valor);
    else novo.delete(chave);
    novo.delete('pagina');
    setParams(novo);
  }

  function irParaPagina(p: number) {
    const novo = new URLSearchParams(params);
    if (p > 1) novo.set('pagina', String(p));
    else novo.delete('pagina');
    setParams(novo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buscarTermo(e: FormEvent) {
    e.preventDefault();
    atualizar('q', termo.trim());
  }

  function limpar() {
    setTermo('');
    setParams(new URLSearchParams());
  }

  const painelFiltros = (
    <div className="space-y-4">
      <Field id="f-especie" label="Espécie">
        <Select id="f-especie" value={filtros.especie ?? ''} onChange={(e) => atualizar('especie', e.target.value)}>
          <option value="">Todas</option>
          {ESPECIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </Select>
      </Field>
      <Field id="f-idade" label="Idade">
        <Select id="f-idade" value={filtros.idade ?? ''} onChange={(e) => atualizar('idade', e.target.value)}>
          <option value="">Qualquer</option>
          {FAIXAS_IDADE.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </Field>
      <Field id="f-cidade" label="Cidade">
        <Select id="f-cidade" value={filtros.cidade ?? ''} onChange={(e) => atualizar('cidade', e.target.value)}>
          <option value="">Todas</option>
          {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <Field id="f-org" label="Organização">
        <Select id="f-org" value={filtros.organizacao ?? ''} onChange={(e) => atualizar('organizacao', e.target.value)}>
          <option value="">Todas</option>
          {organizacoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </Select>
      </Field>
      <Field id="f-porte" label="Porte">
        <Select id="f-porte" value={filtros.porte ?? ''} onChange={(e) => atualizar('porte', e.target.value)}>
          <option value="">Qualquer</option>
          {Object.entries(PORTE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <Field id="f-sexo" label="Sexo">
        <Select id="f-sexo" value={filtros.sexo ?? ''} onChange={(e) => atualizar('sexo', e.target.value)}>
          <option value="">Qualquer</option>
          {Object.entries(SEXO_LABEL).filter(([v]) => v !== 'desconhecido').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      {filtrosAtivos > 0 && (
        <button onClick={limpar} className="text-sm text-purple-700 font-semibold hover:underline flex items-center gap-1">
          <X size={14} aria-hidden="true" /> Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Animais para adoção</h1>
          <p className="text-gray-600">Encontre um novo amigo entre os animais das organizações parceiras do Vale do Sinos.</p>
        </div>
        {isAdminOrg && (
          <Link
            to="/admin/animais/novo"
            className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-purple-700 transition shrink-0"
          >
            <Plus size={18} aria-hidden="true" /> Cadastrar animal
          </Link>
        )}
      </div>

      <form onSubmit={buscarTermo} className="flex gap-2 mb-6" role="search">
        <label htmlFor="busca-termo" className="sr-only">Buscar por nome, raça ou descrição</label>
        <Input
          id="busca-termo"
          placeholder="Buscar por nome, raça ou característica..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
        <button type="submit" className="bg-purple-600 text-white px-4 rounded-md hover:bg-purple-700" aria-label="Buscar">
          <Search size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setFiltrosAbertos((v) => !v)}
          className="lg:hidden flex items-center gap-1 border border-gray-300 rounded-md px-3 bg-white"
          aria-expanded={filtrosAbertos}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filtros{filtrosAtivos > 0 && ` (${filtrosAtivos})`}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className={`${filtrosAbertos ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-md p-5 h-fit`} aria-label="Filtros">
          {painelFiltros}
        </aside>

        <section aria-live="polite" aria-busy={carregando}>
          {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

          <p className="text-sm text-gray-600 mb-4">
            {carregando ? 'Buscando...' : `${total} ${total === 1 ? 'animal encontrado' : 'animais encontrados'}`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {carregando
              ? Array.from({ length: 6 }, (_, i) => <PetCardSkeleton key={i} />)
              : animais.map((a) => <PetCard key={a.id} animal={a} />)}
          </div>

          {!carregando && animais.length === 0 && !erro && (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <p className="text-gray-700 font-semibold mb-1">Nenhum animal encontrado com esses filtros.</p>
              <p className="text-gray-500 text-sm mb-4">Tente ampliar a busca ou remover alguns filtros.</p>
              <button onClick={limpar} className="text-purple-700 font-semibold hover:underline">Limpar filtros</button>
            </div>
          )}

          {totalPaginas > 1 && (
            <nav className="flex items-center justify-center gap-4 mt-10" aria-label="Paginação">
              <button
                onClick={() => irParaPagina(pagina - 1)}
                disabled={pagina <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 bg-white disabled:opacity-40"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Anterior
              </button>
              <span className="text-sm text-gray-600">Página {pagina} de {totalPaginas}</span>
              <button
                onClick={() => irParaPagina(pagina + 1)}
                disabled={pagina >= totalPaginas}
                className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 bg-white disabled:opacity-40"
              >
                Próxima <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
