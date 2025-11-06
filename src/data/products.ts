// src/data/products.ts
export interface Product {
  id?: string | number;
  name: string;
  unit?: string;
  supplier?: string;
  stock?: number;
  unitPrice?: number;
  price?: number;
  quantity?: number;
  category?: string;
  image?: string;
}

export const initialProducts: Product[] = [
  {
    id: 1,
    name: "Niguiri",
    price: 49.8,
    quantity: 20,
    category: "Sushi",
    image: "/images/sushi-especial.jpg",
  },
  {
    id: 2,
    name: "Uramaki Philadelfia",
    price: 49.8,
    quantity: 20,
    category: "Sushi",
    image: "/images/uramaki_philadelfia.png",
  },
  // adicione novos produtos aqui
];
