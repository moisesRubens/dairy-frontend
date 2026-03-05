export type ItemOrder = {
    product_id: number;
    item_price: number;
    amount: number;
    kg: number;
    liters: number;
}

export type Order = {
    id: number;
    status: boolean;
    total_value: number;
    description: string;
    order_date: string;
    item_order: ItemOrder[]
}