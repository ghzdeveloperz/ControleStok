import { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col">
      <div className="h-32 bg-gray-200 rounded mb-4 flex items-center justify-center">
        {/* Se não tiver imagem, podemos mostrar placeholder */}
        <span className="text-gray-500">Sem imagem</span>
      </div>

      <h3 className="font-bold text-lg">{product.name}</h3>
      <p className="text-gray-600">Fornecedor: {product.supplier}</p>
      <p className="text-gray-600">Unidade: {product.unit}</p>
      <p className="text-gray-800 font-semibold">Estoque: {product.stock}</p>
      <p className="text-gray-800 font-semibold">R$ {product.unitPrice?.toFixed(2)}</p>

      <div className="mt-auto flex gap-2">
        <button className="flex-1 bg-blue-500 text-white rounded py-1 hover:bg-blue-600 transition">
          Editar
        </button>
        <button className="flex-1 bg-red-500 text-white rounded py-1 hover:bg-red-600 transition">
          Excluir
        </button>
      </div>
    </div>
  );
}
