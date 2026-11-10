import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, PawPrint, Settings, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

        <div className="hidden md:block">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuUsuario((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-medium"
                aria-haspopup="menu"
                aria-expanded={menuUsuario}
              >
                <span className="bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                  {nome.charAt(0)}
                </span>
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

        <button
          className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1" aria-label="Navegação móvel">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-1">
            {user ? (
              <>
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
