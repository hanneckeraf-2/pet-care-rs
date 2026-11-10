import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-gray-500" role="status">
      <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
