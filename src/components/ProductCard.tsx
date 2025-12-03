/* src/components/ProductCard.tsx */
import React from "react";
import {
  ProductQuantity as ProductQuantityFromDB,
  removeProductForUser,
} from "../firebase/firestore/products";

// Tipagem segura no front-end
export interface Product extends ProductQuantityFromDB {
  price: number;      // custo médio obrigatório no front
  unitPrice: number;  // preço unitário obrigatório no front
}

// Re-exportando ProductQuantity
export type ProductQuantity = ProductQuantityFromDB;

interface ProductCardProps {
  products: Product[];
  userId: string;
  removeMode?: boolean;
  onRemove?: (productId: string) => void;
  onSelect?: (product: Product) => void;
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  products,
  userId,
  removeMode = false,
  onRemove,
  onSelect,
  setProducts,
}) => {

  const handleRemove = async (id: string) => {
    try {
      await removeProductForUser(userId, id);

      // Atualiza lista local (evita flicker e mantém UI rápida)
      if (setProducts) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }

      if (onRemove) onRemove(id);
    } catch (err) {
      console.error("Erro ao remover produto:", err);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        // Normalizações defensivas
        const safePrice = Number(product.price) || 0;
        const safeUnitPrice = Number(product.unitPrice) || safePrice;
        const safeQuantity = Number(product.quantity) || 0;
        const safeMinStock = Number(product.minStock) || 10;
        const imageSrc = product.image && product.image.trim() !== ""
          ? product.image
          : "/images/placeholder.png";

        const totalPrice = safeUnitPrice * safeQuantity;

        // Status
        let status: "OK" | "Baixo" | "Zerado" = "OK";
        if (safeQuantity === 0) status = "Zerado";
        else if (safeQuantity <= safeMinStock) status = "Baixo";

        const statusIndicatorClasses: Record<typeof status, string> = {
          OK: "bg-green-600 text-white",
          Baixo: "bg-orange-500 text-white",
          Zerado: "bg-red-600 text-white",
        };

        return (
          <div
            key={product.id}
            className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelect?.(product)}
          >
            {/* Imagem */}
            <div className="h-36 sm:h-40 md:h-48 w-full overflow-hidden bg-gray-100 relative">
              <img
                src={imageSrc}
                alt={product.name ?? "Produto"}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/images/placeholder.png";
                }}
              />
            </div>

            {/* Conteúdo */}
            <div className="p-3 flex flex-col gap-1 sm:p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                  {product.name ?? "Sem nome"}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {product.category ?? "Sem categoria"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {safeQuantity > 0 ? `Em estoque: ${safeQuantity}` : "Esgotado"}
                </p>

                <p
                  className={`text-xs sm:text-sm font-semibold ${
                    safeQuantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {totalPrice.toFixed(2)}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-gray-700">
                Preço médio: R$ {safeUnitPrice.toFixed(2)}
              </p>

              <p className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                Status:{" "}
                <span
                  className={`px-2 py-0.5 rounded text-white text-[0.7rem] ${
                    statusIndicatorClasses[status]
                  }`}
                >
                  {status}
                </span>
              </p>
            </div>

            {/* Botão de Remover */}
            {removeMode && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // impede acionar onSelect ao clicar em remover
                    handleRemove(product.id);
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
