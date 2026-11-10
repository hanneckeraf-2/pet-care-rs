import { z } from 'zod';

export const novaSenhaSchema = z
  .object({
    senha: z.string().min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' }),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { path: ['confirmar'], error: 'As senhas não conferem.' });

export type NovaSenhaData = z.infer<typeof novaSenhaSchema>;
