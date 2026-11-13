import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, PawPrint, Settings, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SinoNotificacoes from './SinoNotificacoes';
import Avatar from './Avatar';
import InstalarApp from './InstalarApp';

const navItems = [
  { to: '/animais', label: 'Adotar' },
  { to: '/desaparecidos', label: 'Desaparecidos' },
  { to: '/organizacoes', label: 'Organizações' },
  { to: '/voluntariado', label: 'Voluntariado' },
  { to: '/contato', label: 'Contato' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:text-purple-700 hover:bg-gray-100'
  }`;

function primeiroNome(nome: string | undefined, email: string | undefined) {
  return nome?.trim().split(' ')[0] || email?.split('@')[0] || 'Conta';
}

export default function Header() {
  const { user, perfil, isAdminOrg, sair } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // fecha menus ao navegar
  useEffect(() => {
    setOpen(false);
    setMenuUsuario(false);
  }, [pathname]);

  // fecha o menu do usuário ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!menuUsuario) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuUsuario(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuUsuario(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuUsuario]);

  async function handleSair() {
    await sair();
    navigate('/');
  }

  const nome = primeiroNome(perfil?.nome, user?.email);

  const itensUsuario = [
    { to: '/perfil', label: 'Meu perfil', icon: User },
    ...(isAdminOrg ? [{ to: '/admin', label: 'Painel da organização', icon: LayoutDashboard }] : []),
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-purple-700 font-bold text-xl">
          <PawPrint className="w-7 h-7" aria-hidden="true" />
          Pet Care RS
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user && <SinoNotificacoes />}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuUsuario((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-medium"
                aria-haspopup="menu"
                aria-expanded={menuUsuario}
              >
                <Avatar url={perfil?.foto_url} nome={nome} className="w-7 h-7 text-xs" />
                {nome}
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {menuUsuario && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1" role="menu">
                  {itensUsuario.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Icon size={16} aria-hidden="true" /> {label}
                    </Link>
                  ))}
                  <button
                    onClick={handleSair}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t border-gray-100"
                  >
                    <LogOut size={16} aria-hidden="true" /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/entrar"
              state={{ from: pathname }}
              className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition"
            >
              Entrar
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
        {user && <SinoNotificacoes />}
        <button
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1" aria-label="Navegação móvel">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <div className="px-3 py-2">
            <InstalarApp className="text-purple-700" />
          </div>
          <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-800">
                  <Avatar url={perfil?.foto_url} nome={nome} className="w-8 h-8 text-xs" /> {nome}
                </div>
                {itensUsuario.map(({ to, label }) => (
                  <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
                ))}
                <button onClick={handleSair} className="text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100">
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                state={{ from: pathname }}
                className="text-center bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition"
              >
                Entrar
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
