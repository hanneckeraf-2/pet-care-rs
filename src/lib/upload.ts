import { supabase } from './supabase';

export const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAX_MB = 5;
export const MAX_FOTOS = 5;

/** Retorna uma mensagem de erro se o arquivo não for aceito; null se estiver ok. */
export function validarImagem(arquivo: File): string | null {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return `"${arquivo.name}": use imagens JPG, PNG ou WEBP.`;
  if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) return `"${arquivo.name}": o tamanho máximo é ${TAMANHO_MAX_MB} MB.`;
  return null;
}

const EXTENSOES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Envia as fotos de um animal para o bucket "fotos" (pasta do próprio usuário,
 * exigida pela política do Storage) e registra cada uma na tabela foto.
 */
export async function enviarFotosAnimal(userId: string, animalId: number, arquivos: File[], ordemInicial = 0) {
  for (const [i, arquivo] of arquivos.entries()) {
    const caminho = `${userId}/animais/${animalId}/${crypto.randomUUID()}.${EXTENSOES[arquivo.type] ?? 'jpg'}`;
    const { error: erroUpload } = await supabase.storage.from('fotos').upload(caminho, arquivo, {
      contentType: arquivo.type,
      cacheControl: '31536000',
    });
    if (erroUpload) throw erroUpload;

    const { data } = supabase.storage.from('fotos').getPublicUrl(caminho);
    const { error: erroFoto } = await supabase.from('foto').insert({
      id_animal: animalId,
      url: data.publicUrl,
      storage_path: caminho,
      ordem: ordemInicial + i,
    });
    if (erroFoto) {
      await supabase.storage.from('fotos').remove([caminho]);
      throw erroFoto;
    }
  }
}

/** Remove do Storage os arquivos das fotos (as linhas da tabela caem em cascata com o animal). */
export async function removerArquivos(caminhos: (string | null)[]) {
  const validos = caminhos.filter((c): c is string => !!c);
  if (validos.length > 0) await supabase.storage.from('fotos').remove(validos);
}
