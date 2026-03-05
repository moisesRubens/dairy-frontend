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