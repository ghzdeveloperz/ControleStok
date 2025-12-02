// src/data/categories.ts
export const CATEGORIES_KEY = "app_categories";

// Pega todas as categorias do localStorage
export const getCategories = (): string[] => {
  const data = localStorage.getItem(CATEGORIES_KEY);
  if (!data) {
    const initial = ["Brasileiros", "Asiáticos", "Sushi", "Limpeza", "Frios"];
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

// Adiciona uma nova categoria (ignora duplicadas)
export const addCategory = (name: string): boolean => {
  const categories = getCategories();
  const exists = categories.some(
    (cat) => cat.toLowerCase() === name.toLowerCase()
  );
  if (exists) return false;

  const updated = [...categories, name];
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return true;
};
