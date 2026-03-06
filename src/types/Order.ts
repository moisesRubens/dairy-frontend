// types/Order.ts
export type Order = {
  id: number;
  customer_name: string;
  order_date: string;
  total_value: number;
  status: boolean; // true = pendente, false = cancelado (é booleano no banco)
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

export type OrderApiResponse = {
  orders: Order[];
  order?: Order;
}