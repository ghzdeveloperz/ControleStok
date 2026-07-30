import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import type { Product } from "../../ProductCard";
import { getCategoriesForUser } from "../../../firebase/firestore/categories";
import { updateProductForUser } from "../../../firebase/firestore/products";
import { ModalConfirmRemove } from "./ModalConfirmRemove";

interface Props {
  product: Product;
  userId: string;
  onClose: () => void;
  onRemove: (productId: Product["id"], removeEntire?: boolean) => Promise<void>;
}

type EditableField = "name" | "category" | "minStock";

export const ProductDetailsModal = ({
  product,
  userId,
  onClose,
  onRemove,
}: Props) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editingMinStock, setEditingMinStock] = useState(false);
  const [localName, setLocalName] = useState(product.name ?? "");
  const [localCategory, setLocalCategory] = useState(product.category);
  const [localMinStock, setLocalMinStock] = useState(Number(product.minStock ?? 10));
  const [savingField, setSavingField] = useState<EditableField | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCategoriesForUser(userId)
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar as categorias.");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    setLocalName(product.name ?? "");
    setLocalCategory(product.category);
    setLocalMinStock(Number(product.minStock ?? 10));
  }, [product]);

  const updateField = async (
    field: EditableField,
    changes: Parameters<typeof updateProductForUser>[2],
  ) => {
    setError(null);
    setSavingField(field);
    try {
      await updateProductForUser(userId, product.id, changes);
      return true;
    } catch {
      setError("Não foi possível atualizar o produto.");
      return false;
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveName = async () => {
    const name = localName.trim();
    if (!name || name.length > 120) {
      setError("Informe um nome entre 1 e 120 caracteres.");
      return;
    }
    if (await updateField("name", { name })) setEditingName(false);
  };

  const handleSaveCategory = async () => {
    const category = localCategory.trim();
    if (!category || category.length > 80) {
      setError("Selecione uma categoria válida.");
      return;
    }
    if (await updateField("category", { category })) setEditingCategory(false);
  };

  const handleSaveMinStock = async () => {
    if (!Number.isSafeInteger(localMinStock) || localMinStock < 0) {
      setError("Informe um estoque mínimo inteiro e não negativo.");
      return;
    }
    if (await updateField("minStock", { minStock: localMinStock })) {
      setEditingMinStock(false);
    }
  };

  const handleConfirmRemove = async () => {
    setError(null);
    try {
      await onRemove(product.id, true);
      setShowConfirmRemove(false);
      onClose();
    } catch {
      setError("Não foi possível arquivar o produto.");
      setShowConfirmRemove(false);
    }
  };

  const formatCurrency = (value: number | undefined) =>
    (Number.isFinite(Number(value)) ? Number(value) : 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const safeImage = product.image?.trim() || "/images/placeholder.svg";
  const safeCost = Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
  const safeQuantity = Number.isFinite(Number(product.quantity))
    ? Number(product.quantity)
    : 0;
  const totalCost = safeCost * safeQuantity;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <button
            type="button"
            onClick={() => setShowConfirmRemove(true)}
            className="absolute right-4 top-4 cursor-pointer text-red-600 hover:text-red-800"
            title="Arquivar produto"
            aria-label="Arquivar produto"
          >
            <FaTrash size={20} />
          </button>

          <h2 className="mb-4 text-xl font-bold">Informações do Produto</h2>
          {error && (
            <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <img
              src={safeImage}
              alt={localName || "Produto"}
              className="h-40 w-full rounded object-cover"
              onError={(event) => {
                event.currentTarget.src = "/images/placeholder.svg";
              }}
            />

            <div className="flex items-center gap-2">
              {!editingName && <p className="text-lg font-semibold">{localName}</p>}
              {!editingName && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="cursor-pointer rounded-full p-1 hover:bg-gray-200"
                  aria-label="Editar nome"
                >
                  <FaPen size={14} className="text-gray-700" />
                </button>
              )}
            </div>

            {editingName && (
              <div className="mt-1 flex items-center gap-2">
                <input
                  className="w-full rounded border p-1"
                  maxLength={120}
                  value={localName}
                  onChange={(event) => setLocalName(event.target.value)}
                />
                <button
                  type="button"
                  disabled={savingField !== null}
                  onClick={() => void handleSaveName()}
                  className="cursor-pointer rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  disabled={savingField !== null}
                  onClick={() => {
                    setLocalName(product.name ?? "");
                    setEditingName(false);
                  }}
                  className="cursor-pointer rounded bg-gray-300 px-3 py-1 text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}

            <p className={product.barcode ? "text-sm" : "text-sm text-gray-400"}>
              <strong>Código de barras:</strong>{" "}
              {product.barcode || "não informado"}
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {!editingCategory && (
                  <p className="text-sm">
                    <strong>Categoria:</strong> {localCategory}
                  </p>
                )}
                {!editingCategory && (
                  <button
                    type="button"
                    onClick={() => setEditingCategory(true)}
                    className="cursor-pointer rounded-full p-1 hover:bg-gray-200"
                    aria-label="Editar categoria"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>

              {editingCategory && (
                <div className="flex items-center gap-2">
                  <select
                    className="cursor-pointer rounded border p-1"
                    value={localCategory}
                    onChange={(event) => setLocalCategory(event.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={savingField !== null}
                    onClick={() => void handleSaveCategory()}
                    className="cursor-pointer rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    disabled={savingField !== null}
                    onClick={() => {
                      setLocalCategory(product.category);
                      setEditingCategory(false);
                    }}
                    className="cursor-pointer rounded bg-gray-300 px-3 py-1 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <p className="text-sm">
                <strong>Quantidade em estoque:</strong> {safeQuantity}
              </p>
              <p className="text-sm">
                <strong>Preço unitário:</strong>{" "}
                {formatCurrency(product.unitPrice ?? product.price)}
              </p>
              <p className="text-sm">
                <strong>Custo médio:</strong> {formatCurrency(safeCost)}
              </p>

              <div className="flex items-center gap-2">
                {!editingMinStock && (
                  <p className="text-sm">
                    <strong>Estoque mínimo:</strong> {localMinStock}
                  </p>
                )}
                {!editingMinStock && (
                  <button
                    type="button"
                    onClick={() => setEditingMinStock(true)}
                    className="cursor-pointer rounded-full p-1 hover:bg-gray-200"
                    aria-label="Editar estoque mínimo"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>

              {editingMinStock && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-24 rounded border p-1"
                    value={localMinStock}
                    onChange={(event) => setLocalMinStock(Number(event.target.value))}
                  />
                  <button
                    type="button"
                    disabled={savingField !== null}
                    onClick={() => void handleSaveMinStock()}
                    className="cursor-pointer rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    disabled={savingField !== null}
                    onClick={() => {
                      setLocalMinStock(product.minStock ?? 10);
                      setEditingMinStock(false);
                    }}
                    className="cursor-pointer rounded bg-gray-300 px-3 py-1 text-sm"
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
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
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
