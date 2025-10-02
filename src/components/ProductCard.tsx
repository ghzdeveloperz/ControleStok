import React from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ProductCardProps {
  products: Product[];
}

export const ProductCard: React.FC<ProductCardProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-600 mt-1">R$ {product.price.toFixed(2)}</p>
            <p
              className={`mt-2 font-medium ${
                product.quantity > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {product.quantity > 0 ? `Em estoque: ${product.quantity}` : "Esgotado"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
