// types/Product.ts - Versão completa
export type Product = {
    id: number;
    name: string;
    price: number;
    amount: number | null;
    kg: number | null;
    liters: number | null;
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

export type RetiradaResponse = {
  id: number;
  product_id: number;
  name: string;
  price?: number; // Opcional porque pode vir da API sem preço
  quantidade_retirada: number;
  unidade_retirada: string;
  data_retirada: string;
  observacao: string | null;
  sale_point_id: number;
};

export type RetirarProdutosResponse = {
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
};

export type SubtrairEstoquePayload = {
  produtos: Array<{
    product_id: number;
    quantidade: number; // Positivo para subtrair, negativo para adicionar
    unidade: string;
  }>;
  observacao?: string;
};

export type SubtrairEstoqueResponse = RetirarProdutosResponse; // Mesma estrutura do retirar