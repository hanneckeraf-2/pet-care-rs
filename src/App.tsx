import React, { useState, useEffect } from 'react';
import { Heart, PawPrint, Search, Phone, Mail, MapPin, Home, Building2, AlertTriangle, Coins } from 'lucide-react';

type Pet = {
  id: number;
  name: string;
  age: string;
  breed: string;
  image: string;
  type: 'cachorro' | 'gato';
};

type SlideContent = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  buttonText: string;
  buttonText2?: string;
};

const pets: Pet[] = [
  {
    id: 1,
    name: "Luna",
    age: "2 anos",
    breed: "Golden Retriever",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=500",
    type: "cachorro"
  },
  {
    id: 2,
    name: "Taison",
    age: "1 ano",
    breed: "Vira-Lata",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500",
    type: "gato"
  },
  {
    id: 3,
    name: "Max",
    age: "3 anos",
    breed: "Pastor Alemão",
    image: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=500",
    type: "cachorro"
  },
  {
    id: 4,
    name: "Bela",
    age: "6 meses",
    breed: "Siamês",
    image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=500",
    type: "gato"
  }
];

const slides: SlideContent[] = [
  {
    id: 1,
    title: "Adote um pet",
    description: "Faça um novo amigo e dê um lar para ele. Encontre-o em um dos abrigos mais próximos de você.",
    icon: <Home className="w-8 h-8 text-white" />,
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=1920",
    buttonText: "Adote Agora"
  },
  {
    id: 2,
    title: "Nossos abrigos",
    description: "Descubra os locais onde os animais em necessidade recebem abrigo e carinho.",
    icon: <Building2 className="w-8 h-8 text-white" />,
    image: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80&w=1920",
    buttonText: "Encontre Abrigos",
    buttonText2: "Oferecer Lar Temporário"
  },
  {
    id: 3,
    title: "Reportar pet perdido",
    description: "Nos ajude a reunir os pets perdidos com suas famílias. Reporte ou procure um animal perdido aqui.",
    icon: <AlertTriangle className="w-8 h-8 text-white" />,
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1920",
    buttonText: "Reportar Desaparecimento",
    buttonText2: "Reportar Pet Encontrado"
  },
  {
    id: 4,
    title: "Ajude a causa animal",
    description: "Sua doação ajuda na manutenção do bem-estar animal. Qualquer ajuda faz a diferença.",
    icon: <Coins className="w-8 h-8 text-white" />,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1920",
    buttonText: "Doe Agora",
    buttonText2: "Seja Voluntário"
  }
];

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Slider Section */}
      <div className="relative h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-4xl px-4">
                  <div className="flex justify-center mb-6">
                    {slide.icon}
                  </div>
                  <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                  <p className="text-xl mb-8">{slide.description}</p>
                  <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition">
                    {slide.buttonText}
                  </button>
                  {slide.buttonText2 !== null && slide.buttonText2 !== undefined ?
                    (<button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition">
                    {slide.buttonText2}
                  </button>) : <p></p>
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pet</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm">
              <option>Todos os pets</option>
              <option>Cachorros</option>
              <option>Gatos</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm">
              <option>Qualquer</option>
              <option>Filhote</option>
              <option>Jovem</option>
              <option>Adulto</option>
              <option>Idoso</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm">
              <option>Todas as cidades</option>
              <option>Porto Alegre</option>
              <option>Canoas</option>
              <option>Esteio</option>
              <option>Sapucaia</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Abrigos</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm">
              <option>Todos os abrigos</option>
              <option>SMBEA</option>
              <option>Ulbra</option>
              <option>Açuçena</option>
              <option>Hospital Veterinário</option>
            </select>
          </div>
          <button className="bg-purple-600 text-white px-8 rounded-md hover:bg-purple-700 self-end">
            <Search className="inline-block mr-2" size={20} />
            Procurar
          </button>
        </div>
      </div>

      {/* Available Pets Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Pets para Adoção</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative h-48">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <button className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <Heart size={20} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{pet.name}</h3>
                <p className="text-gray-600 mb-2">{pet.breed}</p>
                <p className="text-gray-500 text-sm mb-4">{pet.age}</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition">
                  Conheça {pet.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Adopt Section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Por quê devo adotar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Salvar uma Vida</h3>
              <p className="text-gray-600">Dê um lar amoroso para um animal em necessidade e faça a diferença na sua vida.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Companheiro Leal</h3>
              <p className="text-gray-600">Encontre um amigo carinhoso que lhe dará alegria e companhia para a sua vida.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Amor Sem Fim</h3>
              <p className="text-gray-600">Experiencie amor incondicional e crie memórias que durarão a vida toda.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Entre em Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center">
              <Phone className="text-purple-600 mr-3" />
              <span>(555) XXXXX-XXXX</span>
            </div>
            <div className="flex items-center justify-center">
              <Mail className="text-purple-600 mr-3" />
              <span>adote@adocao.com</span>
            </div>
            <div className="flex items-center justify-center">
              <MapPin className="text-purple-600 mr-3" />
              <span>Abrigo de Animais, Canoas/RS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;