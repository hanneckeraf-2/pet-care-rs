import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AvisoOffline from './AvisoOffline';
import AtualizacaoPWA from './AtualizacaoPWA';

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white px-4 py-2 rounded shadow"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <AvisoOffline />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AtualizacaoPWA />
    </div>
  );
}
