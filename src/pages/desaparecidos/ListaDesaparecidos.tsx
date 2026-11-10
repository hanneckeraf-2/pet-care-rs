import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { traduzirErro } from '../../lib/erros';
import { CIDADES, ESPECIES } from '../../lib/constants';
import { POR_PAGINA, buscarDesaparecidos, type AnimalCard } from '../../lib/animais';
import PetCard, { PetCardSkeleton } from '../../components/PetCard';
import { Alert, Input, Select } from '../../components/ui';

const CHAVES = ['q', 'tipo', 'especie', 'cidade'] as const;

const ABAS = [
  { valor: '', label: 'Todos' },
  { valor: 'perdido', label: 'Perdidos' },
  { valor: 'encontrado', label: 'Encontrados na rua' },
  { valor: 'resgatado', label: 'Resgatados' },
  { valor: 'reunido', label: 'Voltaram para casa' },
];

export default function ListaDesaparecidos() {
  const [params, setParams] = useSearchParams();
  const [animais, setAnimais] = useState<AnimalCard[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [termo, setTermo] = useState(params.get('q') ?? '');

  const chaveBusca = params.toString();
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const tipo = params.get('tipo') ?? '';

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    const p = new URLSearchParams(chaveBusca);
    const filtros = Object.fromEntries(CHAVES.map((k) => [k, p.get(k) ?? undefined]));
    buscarDesaparecidos(filtros, Math.max(1, Number(p.get('pagina')) || 1)).then(({ data, count, error }) => {
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

  function buscar(e: FormEvent) {
    e.preventDefault();
    atualizar('q', termo.trim());
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" aria-hidden="true" /> Animais desaparecidos
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Ajude a reunir pets perdidos com suas famílias. Se você reconhecer algum animal, entre em contato com quem fez o registro.
          </p>
        </div>
        <Link
          to="/desaparecidos/novo"
          className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-purple-700 transition shrink-0"
        >
          <Plus size={18} aria-hidden="true" /> Registrar animal
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Tipo de registro">
        {ABAS.map((aba) => (
          <button
            key={aba.valor}
            role="tab"
            aria-selected={tipo === aba.valor}
            onClick={() => atualizar('tipo', aba.valor)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tipo === aba.valor ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <form onSubmit={buscar} className="grid grid-cols-1 md:grid-cols-[1fr_180px_200px_auto] gap-3 mb-8" role="search">
        <label htmlFor="d-termo" className="sr-only">Buscar</label>
        <Input
          id="d-termo"
          placeholder="Nome, raça, bairro, características..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
        <label htmlFor="d-especie" className="sr-only">Espécie</label>
        <Select id="d-especie" value={params.get('especie') ?? ''} onChange={(e) => atualizar('especie', e.target.value)}>
          <option value="">Todas as espécies</option>
          {ESPECIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </Select>
        <label htmlFor="d-cidade" className="sr-only">Cidade</label>
        <Select id="d-cidade" value={params.get('cidade') ?? ''} onChange={(e) => atualizar('cidade', e.target.value)}>
          <option value="">Todas as cidades</option>
          {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2">
          <Search size={18} aria-hidden="true" /> Buscar
        </button>
      </form>

      <section aria-live="polite" aria-busy={carregando}>
        {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}
        <p className="text-sm text-gray-600 mb-4">
          {carregando ? 'Buscando...' : `${total} ${total === 1 ? 'registro encontrado' : 'registros encontrados'}`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {carregando
            ? Array.from({ length: 4 }, (_, i) => <PetCardSkeleton key={i} />)
            : animais.map((a) => <PetCard key={a.id} animal={a} to={`/desaparecidos/${a.id}`} acao="Ver detalhes" />)}
        </div>

        {!carregando && animais.length === 0 && !erro && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-700 font-semibold mb-1">Nenhum registro encontrado.</p>
            <p className="text-gray-500 text-sm">Tente outros filtros ou registre um animal desaparecido.</p>
          </div>
        )}

        {totalPaginas > 1 && (
          <nav className="flex items-center justify-center gap-4 mt-10" aria-label="Paginação">
            <button onClick={() => irParaPagina(pagina - 1)} disabled={pagina <= 1} className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 bg-white disabled:opacity-40">
              <ChevronLeft size={16} aria-hidden="true" /> Anterior
            </button>
            <span className="text-sm text-gray-600">Página {pagina} de {totalPaginas}</span>
            <button onClick={() => irParaPagina(pagina + 1)} disabled={pagina >= totalPaginas} className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 bg-white disabled:opacity-40">
              Próxima <ChevronRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
