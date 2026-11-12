import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { CONTATO } from '../lib/constants';
import InstalarApp from './InstalarApp';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <PawPrint className="w-6 h-6 text-purple-400" aria-hidden="true" />
            Pet Care RS
          </div>
          <p className="text-sm text-gray-400">
            Conectando protetores, organizações e adotantes no Vale do Sinos/RS.
          </p>
          <div className="mt-4">
            <InstalarApp className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full" />
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Animais</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/animais" className="hover:text-white">Adotar um pet</Link></li>
            <li><Link to="/desaparecidos" className="hover:text-white">Animais desaparecidos</Link></li>
            <li><Link to="/desaparecidos/novo" className="hover:text-white">Registrar desaparecimento</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Ajude</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/organizacoes" className="hover:text-white">Organizações</Link></li>
            <li><Link to="/voluntariado" className="hover:text-white">Seja voluntário</Link></li>
            <li><Link to="/organizacoes" className="hover:text-white">Seja doador</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Contato</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={CONTATO.telefoneLink} className="flex items-center gap-2 hover:text-white">
                <Phone className="w-4 h-4 text-purple-400" aria-hidden="true" /> {CONTATO.telefone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTATO.email}`} className="flex items-center gap-2 hover:text-white break-all">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" /> {CONTATO.email}
              </a>
            </li>
            <li>
              <a href={CONTATO.instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                <Instagram className="w-4 h-4 text-purple-400" aria-hidden="true" /> {CONTATO.instagram}
              </a>
            </li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" aria-hidden="true" /> Canoas e São Leopoldo/RS</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Pet Care RS · Projeto de Atividade Extensionista UNINTER ·{' '}
        <Link to="/privacidade" className="hover:text-white underline">Política de Privacidade</Link> ·{' '}
        <Link to="/termos" className="hover:text-white underline">Termos de Uso</Link>
      </div>
    </footer>
  );
}
