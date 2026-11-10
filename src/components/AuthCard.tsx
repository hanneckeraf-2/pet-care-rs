import type { ReactNode } from 'react';
import { PawPrint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { traduzirErro } from '../lib/erros';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center">
            <PawPrint className="w-7 h-7 text-purple-600" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">{title}</h1>
        {subtitle && <p className="text-gray-600 text-center mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function Divisor() {
  return (
    <div className="flex items-center gap-3 my-6 text-sm text-gray-400">
      <div className="h-px bg-gray-200 flex-1" />
      ou
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  );
}

export function GoogleButton({ redirectPath = '/', onError }: { redirectPath?: string; onError: (msg: string) => void }) {
  async function entrarComGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + redirectPath },
    });
    if (error) onError(traduzirErro(error));
  }

  return (
    <button
      type="button"
      onClick={entrarComGoogle}
      className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
    >
      <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continuar com Google
    </button>
  );
}
