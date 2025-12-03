// src/pages/Alertas.tsx
import React from "react";
import { useProducts } from "../hooks/useProducts";
import { ProductCard, Product, ProductQuantity } from "../components/ProductCard";

// Você precisa passar o userId como prop
interface AlertasProps {
    userId: string;
}

export const Alertas: React.FC<AlertasProps> = ({ userId }) => {
    const { products } = useProducts(userId); // agora passando userId

    // Função para converter ProductQuantity em Product (adicionando price e unitPrice)
    const mapToProduct = (p: ProductQuantity): Product => ({
        ...p,
        price: (p as any).cost ?? 0, // fallback caso não exista cost
        unitPrice: (p as any).unitPrice ?? (p as any).cost ?? 0,
    });

    // Produtos Zerados
    const zeroProducts: Product[] = products
        .filter((p) => Number(p.quantity ?? 0) === 0)
        .map(mapToProduct);

    // Produtos com estoque baixo
    const lowProducts: Product[] = products
        .filter((p) => {
            const qty = Number(p.quantity ?? 0);
            const minStock = Number(p.minStock ?? 10);
            return qty > 0 && qty <= minStock;
        })
        .map(mapToProduct);

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold mb-4">Alertas de Estoque</h1>

            {/* Produtos Zerados */}
            {zeroProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white px-3 py-1 rounded bg-red-600 inline-block">
                        Produtos Zerados
                    </h2>
                    <ProductCard
                        products={zeroProducts}
                        removeMode={false}
                        onSelect={() => { }}
                        userId={userId} // <- adiciona aqui
                    />
                </div>
            )}

            {/* Produtos Baixos */}
            {lowProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white px-3 py-1 rounded bg-yellow-600 inline-block">
                        Produtos Baixos
                    </h2>
                    <ProductCard
                        products={lowProducts}
                        removeMode={false}
                        onSelect={() => { }}
                        userId={userId} // <- adiciona aqui
                    />
                </div>
            )}

            {zeroProducts.length === 0 && lowProducts.length === 0 && (
                <p className="text-gray-600">
                    Todos os produtos estão acima do estoque mínimo.
                </p>
            )}
        </div>
    );
};
