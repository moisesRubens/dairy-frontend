export type Product = {
    id: number;
    name: string;
    price: number;
    amount: number;
    kg: number;
    liters: number;
}

export type ProductWithUnit = Product & {
  unitValue: number;
  unitType: string;
  unitIcon: string;
  unitLabel: string;
};

export type ProductApiResponse = {
  products: Product[];
};

// 🔥 Tipo para retiradas por ponto de venda (agora com sale_point_id)
export interface RetiradaPorPonto {
  id: number;
  name: string;
  price: number;
  amount: number | null;
  kg: number | null;
  liters: number | null;
  quantidade_retirada: number;
  unidade_retirada: string;
  data_retirada: string;
  observacao: string | null;
  sale_point_id: number;  // ✅ AGORA TEMOS ISSO
}

// Tipo para resposta de retirada
export interface RetirarProdutosResponse {
  sucesso: boolean;
  mensagem: string;
  detalhes: {
    sucessos: Array<{
      product_id: number;
      nome: string;
      quantidade: number;
      unidade: string;
      estoque_restante: number;
    }>;
    erros: Array<{
      product_id: number;
      nome?: string;
      erro: string;
    }>;
    total_sucessos: number;
    total_erros: number;
  };
}
 
export type RetiradaResponse = {
  id: number;
  name: string;
  price: number;
  amount: number | null;
  kg: number | null;
  liters: number | null;
  quantidade_retirada: number;
  unidade_retirada: string;
  data_retirada: string;
  observacao: string | null;
  sale_point_id: number;
};

export type RetiradasApiResponse = {
  retiradas: RetiradaResponse[];
};
