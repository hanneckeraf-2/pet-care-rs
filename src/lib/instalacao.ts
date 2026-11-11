// Captura o evento de instalação do PWA (Chrome/Edge/Android) assim que a página carrega.
// O evento dispara uma única vez, antes de qualquer componente montar, por isso fica aqui.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let eventoInstalacao: BeforeInstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // mostramos nosso próprio botão em vez do banner do navegador
    eventoInstalacao = e as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    eventoInstalacao = null;
    avisar();
  });
}

export function assinarInstalacao(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

export function podeInstalar() {
  return eventoInstalacao !== null;
}

export async function instalar(): Promise<boolean> {
  if (!eventoInstalacao) return false;
  await eventoInstalacao.prompt();
  const { outcome } = await eventoInstalacao.userChoice;
  eventoInstalacao = null;
  avisar();
  return outcome === 'accepted';
}

/** iPhone/iPad no Safari: não há evento de instalação, só o menu Compartilhar. */
export function ehIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Já está rodando como app instalado? */
export function rodandoInstalado() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
