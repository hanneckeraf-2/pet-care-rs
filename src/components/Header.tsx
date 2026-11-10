import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, PawPrint, X } from 'lucide-react';

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

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-purple-700 font-bold text-xl" onClick={() => setOpen(false)}>
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
          <Link
            to="/entrar"
            className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition"
          >
            Entrar
          </Link>
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
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/entrar"
            onClick={() => setOpen(false)}
            className="mt-2 text-center bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition"
          >
            Entrar
          </Link>
        </nav>
      )}
    </header>
  );
}
