    import React from "react";
    import { useProducts } from "../hooks/useProducts";
    import { ProductCard, Product } from "../components/ProductCard";

    export const Alertas: React.FC = () => {
    const { products } = useProducts();

    // Produtos Zerados
    const zeroProducts: Product[] = products
        .filter((p) => Number(p.quantity ?? 0) === 0)
        .map((p) => ({
        ...p,
        price: p.cost ?? 0,
        unitPrice: p.unitPrice ?? p.cost ?? 0,
        }));

    // Produtos com estoque baixo (≤10, mas >0)
    const lowProducts: Product[] = products
        .filter((p) => {
        const qty = Number(p.quantity ?? 0);
        return qty > 0 && qty <= 10;
        })
        .map((p) => ({
        ...p,
        price: p.cost ?? 0,
        unitPrice: p.unitPrice ?? p.cost ?? 0,
        }));

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
                onSelect={() => {}}
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
                onSelect={() => {}}
            />
            </div>
        )}

        {zeroProducts.length === 0 && lowProducts.length === 0 && (
            <p className="text-gray-600">Todos os produtos estão acima do estoque mínimo.</p>
        )}
        </div>
    );
    };
