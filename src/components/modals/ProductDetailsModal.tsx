import React, { useState, useEffect } from "react";
import { FaTrash, FaPen } from "react-icons/fa";
import { Product } from "../ProductCard";
import { ModalConfirmRemove } from "./ModalConfirmRemove";
import { getCategoriesForUser } from "../../firebase/firestore/categories";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

interface Props {
  product: Product;
  userId: string;
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
  const [editingCategory, setEditingCategory] = useState(false);
  const [editingMinStock, setEditingMinStock] = useState(false);

  const [localName, setLocalName] = useState(product.name ?? "");
  const [localCategory, setLocalCategory] = useState(product.category);
  const [localMinStock, setLocalMinStock] = useState(Number(product.minStock ?? 10));
  const [localBarcode, setLocalBarcode] = useState(product.barcode ?? "");


  useEffect(() => {
    console.log("Produto recebido no modal:", product);
  }, [product]);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const list = await getCategoriesForUser(userId);
      setCategories(list);
    };
    load();
  }, [userId]);

  useEffect(() => {
    setLocalName(product.name ?? "");
    setLocalCategory(product.category);
    setLocalMinStock(Number(product.minStock ?? 10));
    setLocalBarcode(product.barcode ?? "");
  }, [product]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const safeImage =
    product.image ?? "https://via.placeholder.com/400x300?text=Sem+Imagem";
  const safePrice = Number(product.price);
  const safeQuantity = Number(product.quantity);
  const totalCost = safePrice * safeQuantity;

  const productRef = doc(db, "users", userId, "products", product.id);

  const handleSaveName = async () => {
    await updateDoc(productRef, { name: localName });
    setEditingName(false);
  };

  const handleSaveCategory = async () => {
    await updateDoc(productRef, { category: localCategory });
    setEditingCategory(false);
  };

  const handleSaveMinStock = async () => {
    await updateDoc(productRef, { minStock: Number(localMinStock || 10) });
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

            {/* Nome */}
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

            {/* Código de Barras */}
            {localBarcode ? (
              <p className="text-sm">
                <strong>Código de barras:</strong> {localBarcode}
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Código de barras não informado
              </p>
            )}

            {/* Categoria */}
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

              {/* Quantidade */}
              <p className="text-sm">
                <strong>Quantidade em estoque:</strong> {safeQuantity}
              </p>

              {/* Preço unitário */}
              <p className="text-sm">
                <strong>Preço unitário:</strong> {formatCurrency(product.unitPrice ?? product.price)}
              </p>

              {/* Custo médio */}
              <p className="text-sm">
                <strong>Custo médio:</strong> {formatCurrency(safePrice)}
              </p>

              {/* Estoque mínimo */}
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

              {/* Custo total */}
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
