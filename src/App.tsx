import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ComingSoon from './components/ComingSoon';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Rotas do mapa do site (Trabalho Final, etapa 2). Páginas "ComingSoon" serão implementadas nas próximas fases.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />

          {/* Animais */}
          <Route path="animais" element={<ComingSoon title="Animais para adoção" />} />
          <Route path="animais/:id" element={<ComingSoon title="Detalhes do animal" />} />
          <Route path="desaparecidos" element={<ComingSoon title="Animais desaparecidos" />} />
          <Route path="desaparecidos/novo" element={<ComingSoon title="Registrar animal desaparecido" />} />

          {/* Organizações e voluntariado */}
          <Route path="organizacoes" element={<ComingSoon title="Organizações" />} />
          <Route path="organizacoes/:id" element={<ComingSoon title="Página da organização" />} />
          <Route path="voluntariado" element={<ComingSoon title="Vagas de voluntariado" />} />

          {/* Área do usuário */}
          <Route path="entrar" element={<ComingSoon title="Entrar" />} />
          <Route path="cadastro" element={<ComingSoon title="Criar conta" />} />
          <Route path="recuperar-senha" element={<ComingSoon title="Recuperar senha" />} />
          <Route path="perfil" element={<ComingSoon title="Meu perfil" />} />
          <Route path="configuracoes" element={<ComingSoon title="Configurações da conta" />} />
          <Route path="notificacoes" element={<ComingSoon title="Notificações" />} />

          {/* Administração da organização */}
          <Route path="admin" element={<ComingSoon title="Painel da organização" />} />
          <Route path="admin/animais" element={<ComingSoon title="Gerenciar animais" />} />
          <Route path="admin/adocoes" element={<ComingSoon title="Solicitações de adoção" />} />
          <Route path="admin/voluntariado" element={<ComingSoon title="Gerenciar voluntários" />} />
          <Route path="admin/perfil" element={<ComingSoon title="Perfil da organização" />} />
          <Route path="admin/relatorios" element={<ComingSoon title="Relatórios" />} />

          <Route path="contato" element={<ComingSoon title="Contato" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
