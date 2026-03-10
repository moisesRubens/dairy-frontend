export type Order = {
  id: number;
  customer_name: string;
  order_date: string;
  total_value: number;
  status: boolean; 
  sale_point_id?: number;
  items?: OrderItem[];
  description?: string;
}

export type OrderItem = {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
}

// CORRIGIDO: Agora corresponde exatamente à API
export type OrderResponseDTO = {
  id: number;
  status: boolean;
  total_value: number;
  description?: string;
  date: string;  // <-- MUDOU de order_date para date
  items: ItemOrderResponseDTO[];  // <-- MUDOU de item_order para items
}

export type ItemOrderResponseDTO = {
  product_id: number;
  price: number;  // <-- MUDOU de item_price para price
  amount?: number;
  kg?: number;
  liters?: number;
}

export type OrderApiResponse = {
  orders: Order[];
  order?: Order;
}