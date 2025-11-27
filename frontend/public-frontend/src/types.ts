export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    stockQuantity: number;
    materialType?: string;
    size?: string;
    color?: string;
    weight?: number;
}
