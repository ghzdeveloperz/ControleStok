import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaPlus } from "react-icons/fa";
import { AlertBanner } from "../components/AlertBanner";
import { ModalAddCategory } from "../components/modals/categories/ModalAddCategory";
import { ModalScanner } from "../components/modals/scanner/ModalScanner";
import {
  onCategoriesUpdateForUser,
  saveCategoryForUser,
} from "../firebase/firestore/categories";
import {
  saveProductForUser,
  type ProductQuantity,
} from "../firebase/firestore/products";
import { validateAndReadImage } from "../utils/imageValidation";

interface NovoProdutoProps {
  userId: string;
}

const formatCurrency = (value: string) => {
  const cents = Number(value.replace(/\D/g, ""));
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const parseCurrency = (formatted: string) =>
  Number(formatted.replace(/\D/g, "")) / 100;

const capitalize = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase("pt-BR") +
        word.slice(1).toLocaleLowerCase("pt-BR"),
    )
    .join(" ");

const getLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split("T")[0];
};

export const NovoProduto = ({ userId }: NovoProdutoProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [minStock, setMinStock] = useState<number | "">(10);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(
    () =>
      onCategoriesUpdateForUser(
        userId,
        setCategories,
        () => setAlert({ message: "Não foi possível carregar as categorias.", type: "error" }),
      ),
    [userId],
  );

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setPreview(null);
      return;
    }

    try {
      const image = await validateAndReadImage(file, {
        maxBytes: 350 * 1024,
        maxWidth: 2048,
        maxHeight: 2048,
        maxPixels: 4_000_000,
      });
      setPreview(image);
    } catch (error) {
      setPreview(null);
      setAlert({
        message: error instanceof Error ? error.message : "Imagem inválida.",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    const normalizedName = capitalize(name);
    const normalizedCategory = capitalize(category);
    const normalizedBarcode = barcode.trim();
    const parsedQuantity = Number(quantity);
    const parsedPrice = parseCurrency(price);
    const parsedMinStock = Number(minStock);

    if (!normalizedName || !normalizedCategory || !normalizedBarcode || price === "") {
      setAlert({ message: "Preencha todos os campos obrigatórios.", type: "error" });
      return;
    }
    if (
      normalizedName.length > 120 ||
      normalizedCategory.length > 80 ||
      normalizedBarcode.length > 128
    ) {
      setAlert({ message: "Um dos campos excede o tamanho permitido.", type: "error" });
      return;
    }
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 0) {
      setAlert({ message: "Informe uma quantidade inteira válida.", type: "error" });
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setAlert({ message: "Informe um preço válido.", type: "error" });
      return;
    }
    if (!Number.isSafeInteger(parsedMinStock) || parsedMinStock < 0) {
      setAlert({ message: "Informe um estoque mínimo inteiro válido.", type: "error" });
      return;
    }

    const product: Omit<ProductQuantity, "id"> = {
      name: normalizedName,
      category: normalizedCategory,
      quantity: parsedQuantity,
      cost: parsedPrice,
      unitPrice: parsedPrice,
      price: parsedPrice,
      image: preview ?? undefined,
      minStock: parsedMinStock,
      barcode: normalizedBarcode,
    };

    setLoading(true);
    try {
      await saveProductForUser(userId, product, getLocalDate());
      navigate("/estoque");
    } catch {
      setAlert({
        message: "Não foi possível salvar o produto. Revise os dados e tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const formatted = capitalize(categoryName);
    if (!formatted) return;

    try {
      if (!categories.includes(formatted)) {
        await saveCategoryForUser(userId, formatted);
      }
      setCategory(formatted);
      setCategoryModalOpen(false);
    } catch {
      setAlert({ message: "Não foi possível salvar a categoria.", type: "error" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 md:p-8">
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="mb-6 text-2xl font-semibold sm:text-3xl">
        Adicionar Novo Produto
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <div className="flex w-full flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:w-1/2">
          {preview ? (
            <div className="flex w-full max-w-xs flex-col gap-3">
              <img
                src={preview}
                alt="Prévia do produto"
                className="h-52 w-full rounded-xl object-cover shadow-md"
              />
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Remover imagem
              </button>
            </div>
          ) : (
            <label className="flex h-52 w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              <FaPlus className="mb-2 text-4xl text-gray-400" />
              <span className="text-sm text-gray-500">Selecionar imagem</span>
              <span className="mt-1 text-xs text-gray-400">JPEG, PNG ou WebP, até 350 KB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:w-1/2">
          <div className="flex flex-col gap-6">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Nome do produto</span>
              <input
                type="text"
                maxLength={120}
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Código de barras</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={128}
                  autoComplete="off"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none focus:ring-2"
                />
                <button
                  type="button"
                  aria-label="Escanear código de barras"
                  onClick={() => setScannerOpen(true)}
                  className="rounded-xl bg-black p-3 text-white"
                >
                  <FaCamera />
                </button>
              </div>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Categoria</span>
              <div className="flex max-h-40 flex-wrap items-start gap-3 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">
                <button
                  type="button"
                  aria-label="Adicionar categoria"
                  onClick={() => setCategoryModalOpen(true)}
                  className="flex h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300 bg-gray-100 text-xl text-gray-500"
                >
                  +
                </button>
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-xl border px-4 py-2 ${
                      category === item
                        ? "border-lime-900 bg-lime-900 text-white"
                        : "border-gray-300 bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Quantidade inicial</span>
              <input
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value === "" ? "" : Number(event.target.value))
                }
                className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Estoque mínimo</span>
              <input
                type="number"
                min={0}
                step={1}
                value={minStock}
                onChange={(event) =>
                  setMinStock(event.target.value === "" ? "" : Number(event.target.value))
                }
                className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Preço (R$)</span>
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(formatCurrency(event.target.value))}
                className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none focus:ring-2"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading}
              className="rounded-xl bg-lime-900 px-6 py-3 text-white hover:bg-lime-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Adicionar Produto"}
            </button>
          </div>
        </div>
      </div>

      <ModalScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={(code) => {
          setBarcode(code.trim());
          setScannerOpen(false);
        }}
      />
      <ModalAddCategory
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
        existingCategories={categories}
      />
    </div>
  );
};
