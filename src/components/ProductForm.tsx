import { useState } from 'react';
import { useProductsStore } from '../store/products';
import { Product } from '../types';

const ProductsForm = () => {
  const addProduct = useProductsStore((s) => s.addProduct);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProduct: Product = {
      id: Date.now(),
      name,
      unit,
      supplier,
      price: parseFloat(price),
    };

    addProduct(newProduct);
    setName('');
    setUnit('');
    setSupplier('');
    setPrice('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Novo Produto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do produto"
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unidade (ex: cx, kg...)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Fornecedor"
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço unitário"
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors"
      >
        Adicionar Produto
      </button>
    </form>
  );
};

export default ProductsForm;