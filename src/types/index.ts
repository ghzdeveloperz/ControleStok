// src/types/index.ts
export interface Product {
  id: string | number;
  name: string;
  unit?: string;
  supplier?: string;
  stock: number;
  unitPrice?: number;
  price?: number;
  minStock?: number;
  image?: string;
  category?: string;
}
