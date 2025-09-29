// src/pages/Dashboard.tsx
import { Sidebar } from "../components/Sidebar";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";

export function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Wrapper para a borda direita */}
      <div className="relative flex-1">
        <main className="bg-gray-50 p-6 overflow-auto h-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Estoque</h1>

          {/* Formulário e tabela */}
          <ProductForm />
          <ProductTable />
        </main>

        {/* Borda direita estilizada */}
        <div
          className="absolute top-0 right-0 h-full"
          style={{
            width: "3px",
            background: "#5e5e5e",
            boxShadow: "1px 0 3px rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </div>
  );
}
