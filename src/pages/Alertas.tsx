// src/pages/Alertas.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { ProductCard, Product, ProductQuantity } from "../components/ProductCard";

interface AlertasProps {
  userId: string;
}

export const Alertas: React.FC<AlertasProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { products } = useProducts(userId);

  const mapToProduct = (p: ProductQuantity): Product => ({
    ...p,
    price: (p as any).cost ?? 0,
    unitPrice: (p as any).unitPrice ?? (p as any).cost ?? 0,
  });

  const zeroProducts: Product[] = products
    .filter((p) => Number(p.quantity ?? 0) === 0)
    .map(mapToProduct);

  const lowProducts: Product[] = products
    .filter((p) => {
      const qty = Number(p.quantity ?? 0);
      const minStock = Number(p.minStock ?? 10);
      return qty > 0 && qty <= minStock;
    })
    .map(mapToProduct);

  const hasAlerts = zeroProducts.length > 0 || lowProducts.length > 0;

  return (
    <div className="p-6 min-h-screen bg-gray-50 flex flex-col">
      {/* Título alinhado à esquerda */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Alertas de Estoque</h1>

      {/* Produtos Zerados */}
      {zeroProducts.length > 0 && (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white px-3 py-1 rounded bg-red-600 inline-block shadow-sm">
            Produtos Zerados
          </h2>
          <ProductCard
            products={zeroProducts}
            removeMode={false}
            onSelect={() => {}}
            userId={userId}
          />
        </div>
      )}

      {/* Produtos Baixos */}
      {lowProducts.length > 0 && (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white px-3 py-1 rounded bg-yellow-500 inline-block shadow-sm">
            Produtos Baixos
          </h2>
          <ProductCard
            products={lowProducts}
            removeMode={false}
            onSelect={() => {}}
            userId={userId}
          />
        </div>
      )}

      {/* Aviso centralizado 100% da tela quando não há alertas */}
      {!hasAlerts && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Ícone discreto preto e branco */}
          <div className="flex items-center justify-center w-24 h-24 bg-gray-200 text-gray-800 rounded-full mb-4 text-5xl shadow-sm">
            ✅
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Todos os produtos estão acima do estoque mínimo
          </h2>

          <p className="text-gray-500 mb-4 max-w-md">
            Ótimo! Nenhum produto está zerado ou abaixo do estoque mínimo.
            Você pode revisar seu estoque ou adicionar novos produtos.
          </p>

          <button
            onClick={() => navigate("/estoque")}
            className="px-5 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition cursor-pointer"
          >
            Ir para Estoque
          </button>
        </div>
      )}
    </div>
  );
};
