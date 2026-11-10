import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ComingSoon from './components/ComingSoon';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Entrar from './pages/auth/Entrar';
import Cadastro from './pages/auth/Cadastro';
import RecuperarSenha from './pages/auth/RecuperarSenha';
import RedefinirSenha from './pages/auth/RedefinirSenha';
import Perfil from './pages/usuario/Perfil';
import Configuracoes from './pages/usuario/Configuracoes';
import ListaAnimais from './pages/animais/ListaAnimais';
import DetalheAnimal from './pages/animais/DetalheAnimal';
import ListaDesaparecidos from './pages/desaparecidos/ListaDesaparecidos';
import NovoDesaparecido from './pages/desaparecidos/NovoDesaparecido';
import DetalheDesaparecido from './pages/desaparecidos/DetalheDesaparecido';
import ListaOrganizacoes from './pages/organizacoes/ListaOrganizacoes';
import PaginaOrganizacao from './pages/organizacoes/PaginaOrganizacao';
import ListaVagas from './pages/voluntariado/ListaVagas';

// Rotas do mapa do site (Trabalho Final, etapa 2). Páginas "ComingSoon" serão implementadas nas próximas fases.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />

            {/* Animais */}
            <Route path="animais" element={<ListaAnimais />} />
            <Route path="animais/:id" element={<DetalheAnimal />} />
            <Route path="desaparecidos" element={<ListaDesaparecidos />} />
            <Route path="desaparecidos/novo" element={<ProtectedRoute><NovoDesaparecido /></ProtectedRoute>} />
            <Route path="desaparecidos/:id" element={<DetalheDesaparecido />} />

            {/* Organizações e voluntariado */}
            <Route path="organizacoes" element={<ListaOrganizacoes />} />
            <Route path="organizacoes/:id" element={<PaginaOrganizacao />} />
            <Route path="voluntariado" element={<ListaVagas />} />

            {/* Área do usuário */}
            <Route path="entrar" element={<Entrar />} />
            <Route path="cadastro" element={<Cadastro />} />
            <Route path="recuperar-senha" element={<RecuperarSenha />} />
            <Route path="redefinir-senha" element={<RedefinirSenha />} />
            <Route path="perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="notificacoes" element={<ProtectedRoute><ComingSoon title="Notificações" /></ProtectedRoute>} />

            {/* Administração da organização */}
            <Route path="admin" element={<ProtectedRoute admin><ComingSoon title="Painel da organização" /></ProtectedRoute>} />
            <Route path="admin/animais" element={<ProtectedRoute admin><ComingSoon title="Gerenciar animais" /></ProtectedRoute>} />
            <Route path="admin/adocoes" element={<ProtectedRoute admin><ComingSoon title="Solicitações de adoção" /></ProtectedRoute>} />
            <Route path="admin/voluntariado" element={<ProtectedRoute admin><ComingSoon title="Gerenciar voluntários" /></ProtectedRoute>} />
            <Route path="admin/perfil" element={<ProtectedRoute admin><ComingSoon title="Perfil da organização" /></ProtectedRoute>} />
            <Route path="admin/relatorios" element={<ProtectedRoute admin><ComingSoon title="Relatórios" /></ProtectedRoute>} />

            <Route path="contato" element={<ComingSoon title="Contato" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
