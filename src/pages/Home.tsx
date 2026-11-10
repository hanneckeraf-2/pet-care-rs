import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, HandHeart, Heart, HeartHandshake, PawPrint, Search, ShieldCheck } from 'lucide-react';
import HeroSlider from '../components/HeroSlider';
import SearchBar from '../components/SearchBar';
import PetCard, { PetCardSkeleton } from '../components/PetCard';
import { supabase } from '../lib/supabase';
import { ANIMAL_CARD_SELECT, type AnimalCard } from '../lib/animais';

const quickLinks = [
  {
    to: '/animais',
    title: 'Procurar animais',
    text: 'Encontre cães e gatos disponíveis para adoção perto de você.',
    icon: Search,
  },
  {
    to: '/desaparecidos/novo',
    title: 'Registrar desaparecido',
    text: 'Perdeu seu pet? Cadastre o desaparecimento e receba avisos.',
    icon: AlertTriangle,
  },
  {
    to: '/voluntariado',
    title: 'Seja voluntário',
    text: 'Doe seu tempo e ajude abrigos e ONGs da região.',
    icon: HandHeart,
  },
  {
    to: '/organizacoes',
    title: 'Seja doador',
    text: 'Conheça as organizações e contribua diretamente via Pix.',
    icon: HeartHandshake,
  },
];

const motivos = [
  { icon: Heart, title: 'Salvar uma Vida', text: 'Dê um lar amoroso para um animal em necessidade e faça a diferença na vida dele.' },
  { icon: PawPrint, title: 'Companheiro Leal', text: 'Encontre um amigo carinhoso que trará alegria e companhia para a sua vida.' },
  { icon: ShieldCheck, title: 'Adoção Responsável', text: 'Animais vacinados e acompanhados pelas organizações parceiras durante todo o processo.' },
];

export default function Home() {
  const [destaques, setDestaques] = useState<AnimalCard[] | null>(null);

  useEffect(() => {
    supabase
      .from('animal')
      .select(ANIMAL_CARD_SELECT)
      .eq('status', 'disponivel')
      .not('id_organizacao', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(4)
      .then(({ data }) => setDestaques(data ?? []));
  }, []);

  return (
    <>
      <HeroSlider />

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <SearchBar />
      </div>

      {/* Links rápidos */}
      <section className="container mx-auto px-4 pt-16" aria-labelledby="links-rapidos">
        <h2 id="links-rapidos" className="sr-only">Links rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map(({ to, title, text, icon: Icon }) => (
            <Link
              key={title}
              to={to}
              className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Icon className="text-purple-600" size={24} aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-1">
                {title}
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" aria-hidden="true" />
              </h3>
              <p className="text-gray-600 text-sm">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="container mx-auto px-4 py-16" aria-labelledby="destaques">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-10">
          <h2 id="destaques" className="text-3xl font-bold">Pets para Adoção</h2>
          <Link to="/animais" className="text-purple-700 font-semibold hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destaques === null
            ? Array.from({ length: 4 }, (_, i) => <PetCardSkeleton key={i} />)
            : destaques.map((animal) => <PetCard key={animal.id} animal={animal} />)}
        </div>
      </section>

      {/* Adoção responsável */}
      <section className="bg-gray-100 py-16" aria-labelledby="por-que-adotar">
        <div className="container mx-auto px-4">
          <h2 id="por-que-adotar" className="text-3xl font-bold text-center mb-12">Por que devo adotar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {motivos.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-purple-600" size={32} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
