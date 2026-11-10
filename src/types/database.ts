// Tipos do banco no formato gerado por `supabase gen types typescript`.
// Escrito à mão a partir de supabase/migrations; quando o projeto estiver ligado ao Supabase,
// regenere com: npx supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { criado_em: string; atualizado_em: string };

export type Database = {
  public: {
    Tables: {
      organizacao: {
        Row: {
          id: number;
          nome: string;
          descricao: string | null;
          endereco: string | null;
          cidade: string;
          telefone: string | null;
          email: string | null;
          contatos: Json;
          pix_doacao: string | null;
          necessidades: string | null;
          foto_url: string | null;
        } & Timestamps;
        Insert: {
          nome: string;
          cidade: string;
          descricao?: string | null;
          endereco?: string | null;
          telefone?: string | null;
          email?: string | null;
          contatos?: Json;
          pix_doacao?: string | null;
          necessidades?: string | null;
          foto_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organizacao']['Insert']>;
        Relationships: [];
      };
      usuario: {
        Row: {
          id: string;
          id_organizacao: number | null;
          nome: string;
          email: string;
          telefone: string | null;
          cidade: string | null;
          tipo_usuario: Database['public']['Enums']['tipo_usuario'];
          alertas_ativos: boolean;
          foto_url: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          email: string;
          nome?: string;
          id_organizacao?: number | null;
          telefone?: string | null;
          cidade?: string | null;
          tipo_usuario?: Database['public']['Enums']['tipo_usuario'];
          alertas_ativos?: boolean;
          foto_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['usuario']['Insert']>;
        Relationships: [
          { foreignKeyName: 'usuario_id_organizacao_fkey'; columns: ['id_organizacao']; isOneToOne: false; referencedRelation: 'organizacao'; referencedColumns: ['id'] },
        ];
      };
      animal: {
        Row: {
          id: number;
          id_usuario: string | null;
          id_organizacao: number | null;
          nome: string;
          especie: Database['public']['Enums']['especie'];
          raca: string | null;
          idade_meses: number | null;
          sexo: Database['public']['Enums']['sexo'];
          porte: Database['public']['Enums']['porte'] | null;
          status: Database['public']['Enums']['status_animal'];
          cidade: string;
          local: string | null;
          descricao: string | null;
          data_desaparecimento: string | null;
          ultimo_local_visto: string | null;
        } & Timestamps;
        Insert: {
          nome: string;
          especie: Database['public']['Enums']['especie'];
          cidade: string;
          id_usuario?: string | null;
          id_organizacao?: number | null;
          raca?: string | null;
          idade_meses?: number | null;
          sexo?: Database['public']['Enums']['sexo'];
          porte?: Database['public']['Enums']['porte'] | null;
          status?: Database['public']['Enums']['status_animal'];
          local?: string | null;
          descricao?: string | null;
          data_desaparecimento?: string | null;
          ultimo_local_visto?: string | null;
        };
        Update: Partial<Database['public']['Tables']['animal']['Insert']>;
        Relationships: [
          { foreignKeyName: 'animal_id_organizacao_fkey'; columns: ['id_organizacao']; isOneToOne: false; referencedRelation: 'organizacao'; referencedColumns: ['id'] },
          { foreignKeyName: 'animal_id_usuario_fkey'; columns: ['id_usuario']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      foto: {
        Row: {
          id: number;
          id_animal: number | null;
          id_usuario: string | null;
          id_organizacao: number | null;
          url: string;
          storage_path: string | null;
          descricao: string | null;
          ordem: number;
          criado_em: string;
        };
        Insert: {
          url: string;
          id_animal?: number | null;
          id_usuario?: string | null;
          id_organizacao?: number | null;
          storage_path?: string | null;
          descricao?: string | null;
          ordem?: number;
        };
        Update: Partial<Database['public']['Tables']['foto']['Insert']>;
        Relationships: [
          { foreignKeyName: 'foto_id_animal_fkey'; columns: ['id_animal']; isOneToOne: false; referencedRelation: 'animal'; referencedColumns: ['id'] },
          { foreignKeyName: 'foto_id_organizacao_fkey'; columns: ['id_organizacao']; isOneToOne: false; referencedRelation: 'organizacao'; referencedColumns: ['id'] },
          { foreignKeyName: 'foto_id_usuario_fkey'; columns: ['id_usuario']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      adocao: {
        Row: {
          id: number;
          id_usuario: string;
          id_animal: number;
          status: Database['public']['Enums']['status_adocao'];
          dados_formulario: Json;
          descricao: string | null;
        } & Timestamps;
        Insert: {
          id_usuario: string;
          id_animal: number;
          status?: Database['public']['Enums']['status_adocao'];
          dados_formulario?: Json;
          descricao?: string | null;
        };
        Update: Partial<Database['public']['Tables']['adocao']['Insert']>;
        Relationships: [
          { foreignKeyName: 'adocao_id_animal_fkey'; columns: ['id_animal']; isOneToOne: false; referencedRelation: 'animal'; referencedColumns: ['id'] },
          { foreignKeyName: 'adocao_id_usuario_fkey'; columns: ['id_usuario']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      vaga_voluntariado: {
        Row: {
          id: number;
          id_organizacao: number;
          titulo: string;
          atividade: string;
          descricao: string | null;
          disponibilidade: Database['public']['Enums']['disponibilidade'];
          status: Database['public']['Enums']['status_vaga'];
        } & Timestamps;
        Insert: {
          id_organizacao: number;
          titulo: string;
          atividade: string;
          descricao?: string | null;
          disponibilidade?: Database['public']['Enums']['disponibilidade'];
          status?: Database['public']['Enums']['status_vaga'];
        };
        Update: Partial<Database['public']['Tables']['vaga_voluntariado']['Insert']>;
        Relationships: [
          { foreignKeyName: 'vaga_voluntariado_id_organizacao_fkey'; columns: ['id_organizacao']; isOneToOne: false; referencedRelation: 'organizacao'; referencedColumns: ['id'] },
        ];
      };
      inscricao_voluntariado: {
        Row: {
          id: number;
          id_vaga: number;
          id_usuario: string;
          status: Database['public']['Enums']['status_inscricao'];
          mensagem: string | null;
        } & Timestamps;
        Insert: {
          id_vaga: number;
          id_usuario: string;
          status?: Database['public']['Enums']['status_inscricao'];
          mensagem?: string | null;
        };
        Update: Partial<Database['public']['Tables']['inscricao_voluntariado']['Insert']>;
        Relationships: [
          { foreignKeyName: 'inscricao_voluntariado_id_vaga_fkey'; columns: ['id_vaga']; isOneToOne: false; referencedRelation: 'vaga_voluntariado'; referencedColumns: ['id'] },
          { foreignKeyName: 'inscricao_voluntariado_id_usuario_fkey'; columns: ['id_usuario']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      mensagem_animal: {
        Row: {
          id: number;
          id_animal: number;
          id_remetente: string;
          mensagem: string;
          contato_retorno: string | null;
          nome_remetente: string;
          criado_em: string;
        };
        Insert: {
          id_animal: number;
          id_remetente: string;
          mensagem: string;
          contato_retorno?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mensagem_animal']['Insert']>;
        Relationships: [
          { foreignKeyName: 'mensagem_animal_id_animal_fkey'; columns: ['id_animal']; isOneToOne: false; referencedRelation: 'animal'; referencedColumns: ['id'] },
          { foreignKeyName: 'mensagem_animal_id_remetente_fkey'; columns: ['id_remetente']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      notificacao: {
        Row: {
          id: number;
          id_usuario: string;
          tipo: string;
          mensagem: string;
          link: string | null;
          lida: boolean;
          criado_em: string;
        };
        Insert: {
          id_usuario: string;
          tipo: string;
          mensagem: string;
          link?: string | null;
          lida?: boolean;
        };
        Update: Partial<Database['public']['Tables']['notificacao']['Insert']>;
        Relationships: [
          { foreignKeyName: 'notificacao_id_usuario_fkey'; columns: ['id_usuario']; isOneToOne: false; referencedRelation: 'usuario'; referencedColumns: ['id'] },
        ];
      };
      mensagem_contato: {
        Row: {
          id: number;
          id_usuario: string | null;
          nome: string;
          email: string;
          assunto: string;
          mensagem: string;
          criado_em: string;
        };
        Insert: {
          nome: string;
          email: string;
          assunto: string;
          mensagem: string;
          id_usuario?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mensagem_contato']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin_sistema: { Args: Record<string, never>; Returns: boolean };
      organizacao_do_usuario: { Args: Record<string, never>; Returns: number };
      is_admin_org: { Args: { org_id: number }; Returns: boolean };
      pode_gerenciar_animal: { Args: { animal_id: number }; Returns: boolean };
      excluir_minha_conta: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      tipo_usuario: 'comum' | 'admin_org' | 'admin_sistema';
      especie: 'cachorro' | 'gato' | 'outro';
      sexo: 'macho' | 'femea' | 'desconhecido';
      porte: 'pequeno' | 'medio' | 'grande';
      status_animal: 'disponivel' | 'em_processo' | 'adotado' | 'perdido' | 'encontrado' | 'resgatado' | 'reunido';
      status_adocao: 'em_analise' | 'aprovada' | 'rejeitada' | 'cancelada';
      disponibilidade: 'dias_uteis' | 'finais_de_semana' | 'flexivel';
      status_vaga: 'aberta' | 'encerrada';
      status_inscricao: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
