// src/pages/Relatorios.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { db } from "../firebase/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { ProductQuantity, useProducts } from "../hooks/useProducts";

interface StockMovement {
  id: string;
  userId: string;
  productId: string | number;
  productName: string;
  type: "add" | "remove";
  quantity: number;
  price: number;
  date: string;
}

interface ProductDayMovement {
  id: string | number | undefined;
  name: string;
  image?: string;
  add: number;
  remove: number;
  total: number;
  addValue: number;
  removeValue: number;
}

interface DailyProductMovements {
  day: number;
  dateLabel: string;
  products: ProductDayMovement[];
}

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface RelatoriosProps {
  userId: string;
}

const Relatorios: React.FC<RelatoriosProps> = ({ userId }) => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const { products, loading: loadingProducts } = useProducts(userId);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
  const [bounceDay, setBounceDay] = useState<number | null>(null);

  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();

  // Fetch movements filtrando por userId e mês/ano
  useEffect(() => {
    setLoadingMovements(true);
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const q = query(
      collection(db, "movements"),
      where("userId", "==", userId),
      where("date", ">=", start.toISOString().split("T")[0]),
      where("date", "<=", end.toISOString().split("T")[0]),
      orderBy("date")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const movs: StockMovement[] = snap.docs.map((doc) => {
        const data = doc.data() as Omit<StockMovement, "id">;
        return { id: doc.id, ...data };
      });
      setMovements(movs);
      setLoadingMovements(false);
    });

    return () => unsubscribe();
  }, [userId, selectedMonth, selectedYear]);

  const dailyData = useMemo(() => {
    const days = daysInMonth(selectedMonth, selectedYear);
    const base = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      Entradas: 0,
      Saidas: 0,
    }));

    movements.forEach((m) => {
      const day = Number(m.date.split("-")[2]);
      if (!day || day < 1 || day > days) return;
      const slot = base[day - 1];
      if (m.type === "add") slot.Entradas += m.quantity;
      else slot.Saidas += m.quantity;
    });

    return base.map((d) => ({ ...d, dayLabel: String(d.day) }));
  }, [movements, selectedMonth, selectedYear]);

  const monthlySummary = useMemo(() => {
    const entradasQty = movements
      .filter((m) => m.type === "add")
      .reduce((sum, m) => sum + m.quantity, 0);
    const entradasValue = movements
      .filter((m) => m.type === "add")
      .reduce((sum, m) => sum + m.quantity * (m.price || 0), 0);

    const saidasQty = movements
      .filter((m) => m.type === "remove")
      .reduce((sum, m) => sum + m.quantity, 0);
    const saidasValue = movements
      .filter((m) => m.type === "remove")
      .reduce((sum, m) => sum + m.quantity * (m.price || 0), 0);

    return {
      entradasQty,
      entradasValue,
      saidasQty,
      saidasValue,
      liquidoQty: entradasQty - saidasQty,
      liquidoValue: entradasValue - saidasValue,
    };
  }, [movements]);

  const productMovementsByDay: DailyProductMovements[] = useMemo(() => {
    const days = daysInMonth(selectedMonth, selectedYear);
    const daily: DailyProductMovements[] = [];

    for (let day = 1; day <= days; day++) {
      const dateLabel = format(
        new Date(selectedYear, selectedMonth - 1, day),
        "dd/MM/yyyy"
      );

      const productsDayMap: Record<string, ProductDayMovement> = {};

      movements
        .filter((m) => Number(m.date.split("-")[2]) === day)
        .forEach((m) => {
          if (!productsDayMap[m.productId]) {
            const prod = products.find((p) => p.id === m.productId);

            productsDayMap[m.productId] = {
              id: m.productId,
              name: m.productName,
              image: prod?.image ?? undefined,
              add: 0,
              remove: 0,
              total: 0,
              addValue: 0,
              removeValue: 0,
            };
          }

          const prodDay = productsDayMap[m.productId];
          if (m.type === "add") {
            prodDay.add += m.quantity;
            prodDay.addValue += m.quantity * (m.price || 0);
          } else {
            prodDay.remove += m.quantity;
            prodDay.removeValue += m.quantity * (m.price || 0);
          }
          prodDay.total = prodDay.add + prodDay.remove;
        });

      daily.push({
        day,
        dateLabel,
        products: Object.values(productsDayMap).sort((a, b) => b.total - a.total),
      });
    }

    return daily;
  }, [movements, selectedMonth, selectedYear, products]);

  const scrollToDay = (day: number) => {
    const element = dayRefs.current[day];
    const container = containerRef.current;
    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offset =
        elementRect.top -
        containerRect.top -
        containerRect.height / 2 +
        elementRect.height / 2;

      container.scrollBy({
        top: offset,
        behavior: "smooth",
      });

      setHighlightedDay(day);
      setBounceDay(day);
      setTimeout(() => setBounceDay(null), 600);
      setTimeout(() => setHighlightedDay(null), 2000);
    }
  };

  const reportTitle = format(selectedDate, "LLLL yyyy", { locale: ptBR }).toUpperCase();

  const loading = loadingProducts || loadingMovements;

  return (
    <div ref={containerRef} className="p-6 w-full overflow-auto h-full bg-gray-50">
      {/* animação personalizada */}
      <style>
        {`
          @keyframes dayBounce {
            0% { transform: translateY(-4px); }
            100% { transform: translateY(0); }
          }
          .scroll-anim {
            animation: dayBounce 0.4s ease-out;
          }
        `}
      </style>

      <h1 className="text-base sm:text-lg md:text-xl font-bold mb-6 truncate whitespace-nowrap">
        Relatório de Movimentação —{" "}
        <span className="text-lime-900">{reportTitle}</span>
      </h1>

      <div className="flex items-center gap-1 mb-4">
        <label className="text-xs sm:text-sm text-gray-600">Mês:</label>

        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => date && setSelectedDate(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          locale={ptBR}
          className="px-2 py-1 text-xs sm:text-sm border rounded shadow-sm w-[110px] sm:w-[140px]"
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Carregando...</div>
      ) : (
        <>
          {/* RESUMO */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-green-100 text-green-900 rounded shadow p-4 text-center">
              <div className="text-sm">Entradas</div>
              <div className="font-bold text-xl">
                {monthlySummary.entradasQty}
                <br />
                <span className="text-base font-semibold">
                  {formatBRL(monthlySummary.entradasValue)}
                </span>
              </div>
            </div>

            <div className="bg-red-100 text-red-900 rounded shadow p-4 text-center">
              <div className="text-sm">Saídas</div>
              <div className="font-bold text-xl">
                {monthlySummary.saidasQty}
                <br />
                <span className="text-base font-semibold">
                  {formatBRL(monthlySummary.saidasValue)}
                </span>
              </div>
            </div>

            <div className="bg-gray-100 text-gray-900 rounded shadow p-4 text-center">
              <div className="text-sm">Líquido</div>
              <div className="font-bold text-xl">
                {monthlySummary.liquidoQty}
                <br />
                <span className="text-base font-semibold">
                  {formatBRL(monthlySummary.liquidoValue)}
                </span>
              </div>
            </div>
          </div>

          {/* GRÁFICO PRINCIPAL */}
          <div className="mb-8 bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-4 text-gray-700">Movimentações Diárias</h2>

            <div className="overflow-x-auto">
              <div className="min-w-[700px] h-48 md:h-72 flex justify-start">
                <ResponsiveContainer width="100%" height="100%" className="flex! justify-start!">
                  <BarChart
                    data={dailyData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        scrollToDay(Number(state.activeLabel));
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                    <XAxis dataKey="dayLabel" interval={0} tick={{ dx: 6 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Entradas" fill="#16A34A" />
                    <Bar dataKey="Saidas" fill="#DC2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* LISTAGEM */}
          <div className="space-y-8">
            {productMovementsByDay.map(
              (day) =>
                day.products.length > 0 && (
                  <div
                    key={day.day}
                    ref={(el) => {
                      if (el) dayRefs.current[day.day] = el;
                    }}
                    className={`transition-colors duration-500
                      ${highlightedDay === day.day ? "bg-yellow-100" : ""}
                      ${bounceDay === day.day ? "scroll-anim" : ""}
                    `}
                  >
                    <h2 className="text-lg font-semibold mb-2">{day.dateLabel}</h2>

                    <div className="space-y-4">
                      {day.products.map((p) => {
                        const liquido = p.addValue - p.removeValue;

                        return (
                          <div
                            key={p.id ?? p.name}
                            className="bg-white rounded shadow p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {p.image && (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}

                                <span className="font-semibold text-gray-800">{p.name}</span>
                              </div>

                              <div className="flex gap-4 text-sm font-semibold">
                                <span className="text-green-600">{formatBRL(p.addValue)}</span>
                                <span className="text-red-600">{formatBRL(p.removeValue)}</span>
                                <span className="text-gray-800">{formatBRL(liquido)}</span>
                              </div>
                            </div>

                            <div style={{ width: "100%", height: 60 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={[
                                    {
                                      name: p.name,
                                      Entradas: p.add,
                                      Saidas: p.remove,
                                    },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis type="number" hide />
                                  <YAxis type="category" dataKey="name" hide />
                                  <Tooltip
                                    formatter={(value, name) => [
                                      `${value} unidades`,
                                      name === "Entradas" ? "Entradas" : "Saídas",
                                    ]}
                                  />
                                  <Bar dataKey="Entradas" fill="#16A34A" barSize={14} radius={[8, 8, 8, 8]} />
                                  <Bar dataKey="Saidas" fill="#DC2626" barSize={14} radius={[8, 8, 8, 8]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Relatorios;
