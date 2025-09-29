export interface Product {
  id?: string | number;
  name: string;
  unit?: string;      // <-- opcional
  supplier?: string;  // <-- opcional
  stock?: number;
  unitPrice?: number;
  price?: number;
}
    