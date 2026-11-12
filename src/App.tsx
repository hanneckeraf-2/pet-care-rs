import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Demais páginas carregadas sob demanda (code splitting): o visitante da home
// não baixa o código do painel administrativo, dos formulários etc.
const ListaAnimais = lazy(() => import('./pages/animais/ListaAnimais'));
const DetalheAnimal = lazy(() => import('./pages/animais/DetalheAnimal'));
const ListaDesaparecidos = lazy(() => import('./pages/desaparecidos/ListaDesaparecidos'));
const NovoDesaparecido = lazy(() => import('./pages/desaparecidos/NovoDesaparecido'));
const DetalheDesaparecido = lazy(() => import('./pages/desaparecidos/DetalheDesaparecido'));
const ListaOrganizacoes = lazy(() => import('./pages/organizacoes/ListaOrganizacoes'));
const PaginaOrganizacao = lazy(() => import('./pages/organizacoes/PaginaOrganizacao'));
const ListaVagas = lazy(() => import('./pages/voluntariado/ListaVagas'));
const Entrar = lazy(() => import('./pages/auth/Entrar'));
const Cadastro = lazy(() => import('./pages/auth/Cadastro'));
const RecuperarSenha = lazy(() => import('./pages/auth/RecuperarSenha'));
const RedefinirSenha = lazy(() => import('./pages/auth/RedefinirSenha'));
const Perfil = lazy(() => import('./pages/usuario/Perfil'));
const Configuracoes = lazy(() => import('./pages/usuario/Configuracoes'));
const Notificacoes = lazy(() => import('./pages/usuario/Notificacoes'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminAnimais = lazy(() => import('./pages/admin/AdminAnimais'));
const AnimalForm = lazy(() => import('./pages/admin/AnimalForm'));
const AdminAdocoes = lazy(() => import('./pages/admin/AdminAdocoes'));
const AdminMensagens = lazy(() => import('./pages/admin/AdminMensagens'));
const SistemaOrganizacoes = lazy(() => import('./pages/admin/SistemaOrganizacoes'));
const SistemaContato = lazy(() => import('./pages/admin/SistemaContato'));
const AdminVoluntariado = lazy(() => import('./pages/admin/AdminVoluntariado'));
const AdminPerfil = lazy(() => import('./pages/admin/AdminPerfil'));
const AdminRelatorios = lazy(() => import('./pages/admin/AdminRelatorios'));
const Contato = lazy(() => import('./pages/Contato'));
const Privacidade = lazy(() => import('./pages/Privacidade'));
const Termos = lazy(() => import('./pages/Termos'));

// Rotas do mapa do site definido no Trabalho Final (Atividade Extensionista II).
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificacoesProvider>
          <Suspense fallback={<Spinner />}>
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
                  <Route path="mensagens" element={<AdminMensagens />} />
                  <Route path="sistema/organizacoes" element={<SistemaOrganizacoes />} />
                  <Route path="sistema/contato" element={<SistemaContato />} />
                  <Route path="voluntariado" element={<AdminVoluntariado />} />
                  <Route path="perfil" element={<AdminPerfil />} />
                  <Route path="relatorios" element={<AdminRelatorios />} />
                </Route>

                <Route path="contato" element={<Contato />} />
                <Route path="privacidade" element={<Privacidade />} />
                <Route path="termos" element={<Termos />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </NotificacoesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
