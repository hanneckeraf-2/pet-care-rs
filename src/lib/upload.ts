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

/** Dono de uma foto de identificação: o próprio usuário (perfil) ou uma organização (logo/capa). */
export type DonoFotoIdentificacao =
  | { tipo: 'perfil'; idUsuario: string }
  | { tipo: 'logo' | 'capa'; idOrganizacao: number };

function filtroDono(dono: DonoFotoIdentificacao) {
  return dono.tipo === 'perfil'
    ? { coluna: 'id_usuario' as const, valor: dono.idUsuario, pasta: 'perfil' }
    : { coluna: 'id_organizacao' as const, valor: dono.idOrganizacao, pasta: `organizacao/${dono.idOrganizacao}` };
}

async function fotoAtual(dono: DonoFotoIdentificacao) {
  const { coluna, valor } = filtroDono(dono);
  const { data, error } = await supabase
    .from('foto')
    .select('id, storage_path')
    .eq(coluna, valor)
    .eq('tipo', dono.tipo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Envia (ou troca) a foto de identificação: perfil do usuário, logo ou capa da organização.
 * O arquivo vai para a pasta de quem envia no bucket "fotos" e a linha fica na tabela foto;
 * um trigger no banco atualiza usuario.foto_url, organizacao.foto_url ou organizacao.logo_url.
 * Retorna a URL pública da nova foto.
 */
export async function definirFotoIdentificacao(userId: string, dono: DonoFotoIdentificacao, arquivo: File) {
  const { pasta } = filtroDono(dono);
  const caminho = `${userId}/${pasta}/${dono.tipo}-${crypto.randomUUID()}.${EXTENSOES[arquivo.type] ?? 'jpg'}`;
  const { error: erroUpload } = await supabase.storage.from('fotos').upload(caminho, arquivo, {
    contentType: arquivo.type,
    cacheControl: '31536000',
  });
  if (erroUpload) throw erroUpload;
  const url = supabase.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;

  let anterior: Awaited<ReturnType<typeof fotoAtual>>;
  try {
    anterior = await fotoAtual(dono);
    const { error } = anterior
      ? await supabase.from('foto').update({ url, storage_path: caminho }).eq('id', anterior.id)
      : await supabase.from('foto').insert({
          ...(dono.tipo === 'perfil' ? { id_usuario: dono.idUsuario } : { id_organizacao: dono.idOrganizacao }),
          tipo: dono.tipo,
          url,
          storage_path: caminho,
        });
    if (error) throw error;
  } catch (e) {
    await supabase.storage.from('fotos').remove([caminho]);
    throw e;
  }
  // o arquivo antigo deixa de ser usado; falha ao apagá-lo não impede a troca
  if (anterior?.storage_path) await supabase.storage.from('fotos').remove([anterior.storage_path]).catch(() => undefined);
  return url;
}

/** Remove a foto de identificação (linha e arquivo); o trigger limpa a URL exibida. */
export async function removerFotoIdentificacao(dono: DonoFotoIdentificacao) {
  const anterior = await fotoAtual(dono);
  if (!anterior) return;
  // o arquivo sai primeiro: a regra do Storage que permite a outro administrador da
  // organização apagá-lo depende de a linha em foto ainda existir
  await removerArquivos([anterior.storage_path]);
  const { error } = await supabase.from('foto').delete().eq('id', anterior.id);
  if (error) throw error;
}
