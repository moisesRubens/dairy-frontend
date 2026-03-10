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

export type OrderResponseDTO = {
  id: number;
  status: boolean;
  total_value: number;
  description?: string;
  order_date: string;
  items_order: ItemOrderResponseDTO[];
}

export type ItemOrderResponseDTO = {
  product_id: number;
  item_price: number;
  amount?: number;
  kg?: number;
  liters?: number;
}

export type OrderApiResponse = {
  orders: Order[];
  order?: Order;
}