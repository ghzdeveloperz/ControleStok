import React, { useState, useEffect } from "react";
import { FaTrash, FaPen } from "react-icons/fa";
import { Product } from "../ProductCard";
import { ModalConfirmRemove } from "./ModalConfirmRemove";
import { getCategoriesForUser } from "../../firebase/firestore/categories";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

interface Props {
  product: Product;
  userId: string; // obrigatória para buscar categorias do usuário
  onClose: () => void;
  onRemove: (productId: Product["id"], removeEntire?: boolean) => Promise<void>;
}

export const ProductDetailsModal: React.FC<Props> = ({
  product,
  userId,
  onClose,
  onRemove,
}) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [editingName, setEditingName] = useState(false);
  const [editingUnitPrice, setEditingUnitPrice] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editingMinStock, setEditingMinStock] = useState(false);

  const [localName, setLocalName] = useState(product.name ?? "");
  const [localUnitPrice, setLocalUnitPrice] = useState(Number(product.unitPrice ?? 0));
  const [localCategory, setLocalCategory] = useState(product.category);
  const [localMinStock, setLocalMinStock] = useState(Number(product.minStock ?? 10));

  // Carregar categorias do usuário
  useEffect(() => {
    const loadCategories = async () => {
      if (!userId) return;
      const list = await getCategoriesForUser(userId);
      setCategories(list);
    };
    loadCategories();
  }, [userId]);

  // Atualizar valores locais quando o produto mudar
  useEffect(() => {
    setLocalName(product.name ?? "");
    setLocalUnitPrice(Number(product.unitPrice ?? 0));
    setLocalCategory(product.category);
    setLocalMinStock(Number(product.minStock ?? 10));
  }, [product]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const safeImage = product.image ?? "https://via.placeholder.com/400x300?text=Sem+Imagem";
  const safePrice = Number(product.price);
  const safeQuantity = Number(product.quantity);
  const totalCost = safePrice * safeQuantity;

  const handleSaveName = async () => {
    await updateDoc(doc(db, "quantities", product.id), { name: localName });
    setEditingName(false);
  };

  const handleSaveUnitPrice = async () => {
    await updateDoc(doc(db, "quantities", product.id), { unitPrice: Number(localUnitPrice) });
    setEditingUnitPrice(false);
  };

  const handleSaveCategory = async () => {
    await updateDoc(doc(db, "quantities", product.id), { category: localCategory });
    setEditingCategory(false);
  };

  const handleSaveMinStock = async () => {
    await updateDoc(doc(db, "quantities", product.id), { minStock: Number(localMinStock || 10) });
    setEditingMinStock(false);
  };

  const handleConfirmRemove = async () => {
    await onRemove(product.id, true);
    setShowConfirmRemove(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">

          {/* Botão Remover */}
          <button
            onClick={() => setShowConfirmRemove(true)}
            className="absolute top-4 right-4 text-red-600 hover:text-red-800 cursor-pointer"
            title="Remover produto"
          >
            <FaTrash size={20} />
          </button>

          <h2 className="text-xl font-bold mb-4">Informações do Produto</h2>

          <div className="flex flex-col gap-3">
            <img
              src={safeImage}
              alt={localName}
              className="w-full h-40 object-cover rounded"
            />

            {/* NOME */}
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{!editingName ? localName : ""}</p>
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
                >
                  <FaPen size={14} className="text-gray-700" />
                </button>
              )}
            </div>

            {editingName && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  className="border p-1 rounded w-full"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-black text-white text-sm rounded cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setLocalName(product.name ?? "");
                    setEditingName(false);
                  }}
                  className="px-3 py-1 bg-gray-300 text-sm rounded cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* CATEGORIA */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  <strong>Categoria:</strong> {!editingCategory ? localCategory : ""}
                </p>
                {!editingCategory && (
                  <button
                    onClick={() => setEditingCategory(true)}
                    className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>

              {editingCategory && (
                <div className="flex items-center gap-2">
                  <select
                    className="border p-1 rounded cursor-pointer"
                    value={localCategory}
                    onChange={(e) => setLocalCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveCategory}
                    className="px-3 py-1 bg-black text-white text-sm rounded cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setLocalCategory(product.category);
                      setEditingCategory(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-sm rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* PREÇO UNITÁRIO */}
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  <strong>Preço unitário:</strong> {!editingUnitPrice ? formatCurrency(localUnitPrice) : ""}
                </p>
                {!editingUnitPrice && (
                  <button
                    onClick={() => setEditingUnitPrice(true)}
                    className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>
              {editingUnitPrice && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="border p-1 w-24 rounded"
                    value={localUnitPrice}
                    onChange={(e) => setLocalUnitPrice(Number(e.target.value))}
                  />
                  <button
                    onClick={handleSaveUnitPrice}
                    className="px-3 py-1 bg-black text-white text-sm rounded cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setLocalUnitPrice(product.unitPrice ?? 0);
                      setEditingUnitPrice(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-sm rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* CUSTO MÉDIO */}
              <p className="text-sm">
                <strong>Custo médio:</strong> {formatCurrency(safePrice)}
              </p>

              {/* QUANTIDADE */}
              <p className="text-sm">
                <strong>Quantidade em estoque:</strong> {safeQuantity}
              </p>

              {/* ESTOQUE MÍNIMO */}
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  <strong>Estoque mínimo:</strong> {!editingMinStock ? localMinStock : ""}
                </p>
                {!editingMinStock && (
                  <button
                    onClick={() => setEditingMinStock(true)}
                    className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>
              {editingMinStock && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="border p-1 w-24 rounded"
                    value={localMinStock}
                    onChange={(e) => setLocalMinStock(Number(e.target.value))}
                  />
                  <button
                    onClick={handleSaveMinStock}
                    className="px-3 py-1 bg-black text-white text-sm rounded cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setLocalMinStock(product.minStock ?? 10);
                      setEditingMinStock(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-sm rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <hr />

              <p className="text-sm font-semibold text-gray-700">
                Custo total em estoque:{" "}
                <span className="text-black">{formatCurrency(totalCost)}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {showConfirmRemove && (
        <ModalConfirmRemove
          isOpen={showConfirmRemove}
          onClose={() => setShowConfirmRemove(false)}
          product={product}
          onConfirmRemove={handleConfirmRemove}
        />
      )}
    </>
  );
};
