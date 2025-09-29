import { useProductsStore } from '../store/products';

const ProductTable = () => {
  const products = useProductsStore((s) => s.products);
  const removeProduct = useProductsStore((s) => s.removeProduct);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Lista de Produtos</h2>

      {products.length === 0 ? (
        <p className="text-gray-600">Nenhum produto cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b">Nome</th>
                <th className="px-4 py-2 border-b">Unidade</th>
                <th className="px-4 py-2 border-b">Fornecedor</th>
                <th className="px-4 py-2 border-b">Preço</th>
                <th className="px-4 py-2 border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="even:bg-gray-50">
                  <td className="px-4 py-2 border-b">{p.name}</td>
                  <td className="px-4 py-2 border-b">{p.unit}</td>
                  <td className="px-4 py-2 border-b">{p.supplier}</td>
                  <td className="px-4 py-2 border-b">
                    {p.price ? `R$ ${p.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <button
                      onClick={() => removeProduct(p.id as string)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-4 py-1 transition-colors"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
