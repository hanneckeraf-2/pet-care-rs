// Dados provisórios usados na Home até a Fase 3, quando os destaques passam a vir do Supabase.
export type MockPet = {
  id: number;
  nome: string;
  idade: string;
  raca: string;
  imagem: string;
  especie: 'cachorro' | 'gato';
};

export const mockPets: MockPet[] = [
  {
    id: 1,
    nome: 'Luna',
    idade: '2 anos',
    raca: 'Golden Retriever',
    imagem: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=500',
    especie: 'cachorro',
  },
  {
    id: 2,
    nome: 'Taison',
    idade: '1 ano',
    raca: 'Vira-Lata',
    imagem: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500',
    especie: 'gato',
  },
  {
    id: 3,
    nome: 'Max',
    idade: '3 anos',
    raca: 'Pastor Alemão',
    imagem: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=500',
    especie: 'cachorro',
  },
  {
    id: 4,
    nome: 'Bela',
    idade: '6 meses',
    raca: 'Siamês',
    imagem: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=500',
    especie: 'gato',
  },
];
