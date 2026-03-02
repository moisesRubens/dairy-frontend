export type Product = {
    id: number;
    name: string;
    price: number;
    amount: number;
    kg: number;
    liters: number;
}

export type ProductApiResponse = {
  products: Product[];
};