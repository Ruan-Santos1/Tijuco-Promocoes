export type Role = 'cliente' | 'lojista';
export type Tab = 'Inicio' | 'Buscar' | 'Favoritos' | 'Perfil' | 'Loja';
export type Sort = 'recentes' | 'desconto' | 'menor-preco' | 'vence-logo';

export type Loja = {
  id?: string;
  nome_loja?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  endereco?: string | null;
  categoria_loja?: string | null;
  horario?: string | null;
  instagram?: string | null;
};

export type Promo = {
  id: string;
  loja_id: string;
  titulo: string;
  descricao?: string | null;
  preco: number | string;
  preco_original?: number | string | null;
  imagem_url?: string | null;
  categoria?: string | null;
  validade?: string | null;
  ativa: boolean;
  created_at?: string;
  lojas?: Loja | Loja[] | null;
};
