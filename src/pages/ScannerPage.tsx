// src/pages/ScannerPage.tsx
import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

const ScannerPage: React.FC = () => {
  const scannerRef = useRef<HTMLDivElement | null>(null);

  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [newProductName, setNewProductName] = useState("");
  const [addQty, setAddQty] = useState("");

  // Evita várias detecções do mesmo código
  const lastScanned = useRef("");

  async function onBarcodeDetected(code: string) {
    setBarcode(code);

    const productsRef = collection(db, "products");
    const q = query(productsRef, where("barcode", "==", code));

    const snap = await getDocs(q);

    if (snap.empty) {
      setProduct(null);
      return;
    }

    const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
    setProduct(data);
  }

  async function createProduct() {
    if (!newProductName || !barcode) return;

    const docRef = await addDoc(collection(db, "products"), {
      name: newProductName,
      barcode,
      quantity: 0,
      createdAt: new Date(),
    });

    alert("Produto criado!");

    setProduct({
      id: docRef.id,
      name: newProductName,
      barcode,
      quantity: 0,
    });

    setNewProductName("");
  }

  async function addStock() {
    if (!product || !addQty) return;

    const newValue = Number(product.quantity) + Number(addQty);

    await updateDoc(doc(db, "products", product.id), {
      quantity: newValue,
    });

    alert(`Entrada adicionada! Novo estoque: ${newValue}`);

    setProduct({ ...product, quantity: newValue });
    setAddQty("");
  }

  // Inicializar scanner
  useEffect(() => {
    if (!scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "code_128_reader",
          ],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error("Erro ao iniciar Quagga:", err);
          return;
        }
        Quagga.start();
      }
    );

    const handleDetected = (data: any) => {
      const code = data.codeResult.code;

      if (!code) return;

      if (code !== lastScanned.current) {
        lastScanned.current = code;
        onBarcodeDetected(code);

        // evita spam por alguns segundos
        setTimeout(() => {
          lastScanned.current = "";
        }, 2000);
      }
    };

    Quagga.onDetected(handleDetected);

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Scanner de Código de Barras</h1>

      {/* Scanner */}
      <div
        ref={scannerRef}
        style={{ width: "100%", height: "350px", overflow: "hidden" }}
        className="border rounded mb-6"
      />

      {/* Código detectado */}
      {barcode && (
        <p className="text-lg mb-4">
          <strong>Código detectado:</strong> {barcode}
        </p>
      )}

      {/* Produto encontrado */}
      {product && (
        <div className="p-4 border rounded bg-green-100">
          <h2 className="font-semibold mb-2">Produto encontrado</h2>
          <p>
            <strong>Nome:</strong> {product.name}
          </p>
          <p>
            <strong>Estoque atual:</strong> {product.quantity}
          </p>

          <input
            className="border w-full p-2 rounded mt-3"
            placeholder="Quantidade para entrada"
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
          />

          <button
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addStock}
          >
            Adicionar entrada
          </button>
        </div>
      )}

      {/* Produto não cadastrado */}
      {!product && barcode && (
        <div className="mt-6 p-4 border rounded bg-yellow-100">
          <h2 className="font-semibold mb-2">Produto não cadastrado</h2>

          <input
            className="border w-full p-2 rounded"
            placeholder="Nome do novo produto"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />

          <button
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
            onClick={createProduct}
          >
            Criar produto
          </button>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
