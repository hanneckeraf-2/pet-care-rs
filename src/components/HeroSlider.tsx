import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, Coins, Home } from 'lucide-react';

type Slide = {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
  image: string;
  actions: { label: string; to: string }[];
};

const slides: Slide[] = [
  {
    id: 1,
    title: 'Adote um pet',
    description: 'Faça um novo amigo e dê um lar para ele. Encontre-o em um dos abrigos mais próximos de você.',
    icon: <Home className="w-8 h-8 text-white" aria-hidden="true" />,
    image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=1920',
    actions: [{ label: 'Adote Agora', to: '/animais' }],
  },
  {
    id: 2,
    title: 'Nossos abrigos',
    description: 'Descubra os locais onde os animais em necessidade recebem abrigo e carinho.',
    icon: <Building2 className="w-8 h-8 text-white" aria-hidden="true" />,
    image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80&w=1920',
    actions: [
      { label: 'Encontre Abrigos', to: '/organizacoes' },
      { label: 'Oferecer Lar Temporário', to: '/organizacoes' },
    ],
  },
  {
    id: 3,
    title: 'Reportar pet perdido',
    description: 'Nos ajude a reunir os pets perdidos com suas famílias. Reporte ou procure um animal perdido aqui.',
    icon: <AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />,
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1920',
    actions: [
      { label: 'Reportar Desaparecimento', to: '/desaparecidos/novo' },
      { label: 'Reportar Pet Encontrado', to: '/desaparecidos/novo?tipo=encontrado' },
    ],
  },
  {
    id: 4,
    title: 'Ajude a causa animal',
    description: 'Sua doação ajuda na manutenção do bem-estar animal. Qualquer ajuda faz a diferença.',
    icon: <Coins className="w-8 h-8 text-white" aria-hidden="true" />,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1920',
    actions: [
      { label: 'Doe Agora', to: '/organizacoes' },
      { label: 'Seja Voluntário', to: '/voluntariado' },
    ],
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  // não troca de slide sozinho para quem pediu menos movimento no sistema
  const [reduzirMovimento] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduzirMovimento) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [paused, reduzirMovimento]);

  return (
    <section
      className="relative h-[520px] md:h-[600px] overflow-hidden"
      aria-roledescription="carrossel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, index) => {
        const active = current === index;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!active}
          >
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white max-w-4xl px-4">
                <div className="flex justify-center mb-6">{slide.icon}</div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                <p className="text-lg md:text-xl mb-8">{slide.description}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {slide.actions.map((action, i) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      tabIndex={active ? 0 : -1}
                      className={
                        i === 0
                          ? 'bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition'
                          : 'bg-white/10 border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition'
                      }
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(index)}
            className={`h-3 rounded-full transition-all ${
              current === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75 w-3'
            }`}
            aria-label={`Ir para o slide ${index + 1}: ${slide.title}`}
            aria-current={current === index}
          />
        ))}
      </div>
    </section>
  );
}
