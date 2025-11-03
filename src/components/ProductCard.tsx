// src/components/ProductCard.tsx
import React from "react";

export interface Product {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
}

interface ProductCardProps {
  products: Product[];
  removeMode?: boolean;
  onRemove?: (productId: Product["id"]) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  products,
  removeMode = false,
  onRemove,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="h-36 sm:h-40 md:h-48 w-full overflow-hidden bg-gray-100">
            <img
              src={product.image ?? "https://via.placeholder.com/400x300?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform"
            />
          </div>

          <div className="p-3 flex flex-col gap-1 sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                {product.name}
              </h2>
              <span className="text-xs sm:text-sm text-gray-500">{product.category}</span>
            </div>

            <p
              className={`text-xs sm:text-sm font-medium ${
                product.quantity > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {product.quantity > 0 ? `Em estoque: ${product.quantity}` : "Esgotado"}
            </p>
          </div>

          {removeMode && (
            <div className="absolute top-2 right-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(product.id);
                }}
                className="px-2 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Remover
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
