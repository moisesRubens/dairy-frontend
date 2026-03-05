export type SalePoint = {
    id: number;
    name: string;
    email: string | null; 
}

export type LoginResponse = {
    access_token: string;
    token_type: string;
}