import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CIDADES, ESPECIES, FAIXAS_IDADE } from '../lib/constants';

const selectClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200';

export default function SearchBar() {
  const navigate = useNavigate();
  const [especie, setEspecie] = useState('');
  const [idade, setIdade] = useState('');
  const [cidade, setCidade] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (especie) params.set('especie', especie);
    if (idade) params.set('idade', idade);
    if (cidade) params.set('cidade', cidade);
    const qs = params.toString();
    navigate(`/animais${qs ? `?${qs}` : ''}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-lg p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="search"
    >
      <div>
        <label htmlFor="busca-especie" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pet</label>
        <select id="busca-especie" className={selectClass} value={especie} onChange={(e) => setEspecie(e.target.value)}>
          <option value="">Todos os pets</option>
          {ESPECIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="busca-idade" className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
        <select id="busca-idade" className={selectClass} value={idade} onChange={(e) => setIdade(e.target.value)}>
          <option value="">Qualquer</option>
          {FAIXAS_IDADE.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="busca-cidade" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
        <select id="busca-cidade" className={selectClass} value={cidade} onChange={(e) => setCidade(e.target.value)}>
          <option value="">Todas as cidades</option>
          {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button
        type="submit"
        className="bg-purple-600 text-white px-8 py-2 rounded-md hover:bg-purple-700 transition self-end flex items-center justify-center gap-2 font-semibold"
      >
        <Search size={20} aria-hidden="true" />
        Procurar
      </button>
    </form>
  );
}
