import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
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
import Notificacoes from './pages/usuario/Notificacoes';
import ListaAnimais from './pages/animais/ListaAnimais';
import DetalheAnimal from './pages/animais/DetalheAnimal';
import ListaDesaparecidos from './pages/desaparecidos/ListaDesaparecidos';
import NovoDesaparecido from './pages/desaparecidos/NovoDesaparecido';
import DetalheDesaparecido from './pages/desaparecidos/DetalheDesaparecido';
import ListaOrganizacoes from './pages/organizacoes/ListaOrganizacoes';
import PaginaOrganizacao from './pages/organizacoes/PaginaOrganizacao';
import ListaVagas from './pages/voluntariado/ListaVagas';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminAnimais from './pages/admin/AdminAnimais';
import AnimalForm from './pages/admin/AnimalForm';
import AdminAdocoes from './pages/admin/AdminAdocoes';
import AdminVoluntariado from './pages/admin/AdminVoluntariado';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminRelatorios from './pages/admin/AdminRelatorios';

// Rotas do mapa do site (Trabalho Final, etapa 2). Páginas "ComingSoon" serão implementadas nas próximas fases.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificacoesProvider>
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
              <Route path="notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />

              {/* Administração da organização */}
              <Route path="admin" element={<ProtectedRoute admin><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="animais" element={<AdminAnimais />} />
                <Route path="animais/novo" element={<AnimalForm />} />
                <Route path="animais/:id/editar" element={<AnimalForm />} />
                <Route path="adocoes" element={<AdminAdocoes />} />
                <Route path="voluntariado" element={<AdminVoluntariado />} />
                <Route path="perfil" element={<AdminPerfil />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
              </Route>

              <Route path="contato" element={<ComingSoon title="Contato" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </NotificacoesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
