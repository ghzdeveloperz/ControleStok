// src/components/ProductCard.tsx
import React from "react";

export interface Product {
  id: number | string;
  name: string;
  price: number; // preço médio
  unitPrice?: number;  // preço unitário (novo)
  quantity: number;
  minStock?: number;
  category?: string;
  image?: string;
}

interface ProductCardProps {
  products: Product[];
  removeMode?: boolean;
  onRemove?: (productId: Product["id"]) => void;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  products,
  removeMode = false,
  onRemove,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const totalPrice = product.price * product.quantity;

        // Status de estoque
        let status = "OK";
        if (product.quantity === 0) status = "Zerado";
        else if (product.minStock !== undefined && product.quantity <= product.minStock)
          status = "Baixo";

        return (
          <div
            key={product.id}
            className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelect?.(product)}
          >
            <div className="h-36 sm:h-40 md:h-48 w-full overflow-hidden bg-gray-100">
              <img
                src={
                  product.image ??
                  "https://via.placeholder.com/400x300?text=Sem+Imagem"
                }
                alt={product.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform"
              />
            </div>

            <div className="p-3 flex flex-col gap-1 sm:p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                  {product.name}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {product.category}
                </span>
              </div>

              {/* Estoque + Custo total */}
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {product.quantity > 0
                    ? `Em estoque: ${product.quantity}`
                    : "Esgotado"}
                </p>

                <p
                  className={`text-xs sm:text-sm font-semibold ${
                    product.quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Preço médio */}
              <p className="text-xs sm:text-sm text-gray-700">
                Preço médio: R$ {product.price.toFixed(2)}
              </p>

              {/* Status */}
              <p
                className={`text-xs sm:text-sm font-semibold ${
                  status === "OK"
                    ? "text-green-600"
                    : status === "Baixo"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                Status: {status}
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
        );
      })}
    </div>
  );
};
