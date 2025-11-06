import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { ProductCard } from "../components/ProductCard";

const sampleProducts = [
  { id: 1, name: "Produto A", price: 49.9, quantity: 10, image: "https://via.placeholder.com/300x200" },
  { id: 2, name: "Produto B", price: 79.9, quantity: 0, image: "https://via.placeholder.com/300x200" },
  { id: 3, name: "Produto C", price: 19.9, quantity: 5, image: "https://via.placeholder.com/300x200" },
  { id: 4, name: "Produto D", price: 29.9, quantity: 7, image: "https://via.placeholder.com/300x200" },
];

export function Dashboard() {
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");
  const [logoSrc, setLogoSrc] = useState<string | undefined>(undefined); // logo dinâmica

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
        img.onload = () => {
          // validação de tamanho: 612 x 130
          if (img.width === 612 && img.height === 130) {
            setLogoSrc(img.src);
          } else {
            alert("A imagem precisa ter exatamente 612 x 130 px");
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const renderPage = () => {
    switch (activePage) {
      case "Estoque":
        return (
          <main className="bg-gray-50 p-6 overflow-auto h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Estoque</h1>
            <ProductCard products={sampleProducts} />
          </main>
        );
      case "Relatórios":
        return (
          <main className="bg-gray-50 p-6 overflow-auto h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Relatórios</h1>
          </main>
        );
      case "Configurações":
        return (
          <main className="bg-gray-50 p-6 overflow-auto h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Configurações</h1>
            <div className="flex flex-col gap-4">
              <label className="font-semibold">Upload de Logo (612 x 130px)</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </main>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar active={activePage} onNavigate={setActivePage} logoSrc={logoSrc} />
      <div className="flex-1">{renderPage()}</div>
    </div>
  );
}
