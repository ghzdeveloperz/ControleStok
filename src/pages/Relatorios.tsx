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
  LabelList,
} from "recharts";
import { getMovementsByMonth, StockMovement } from "../db";
import { initialProducts } from "../data/products";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

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

const Relatorios: React.FC = () => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);

  useEffect(() => {
    const loadMovements = async () => {
      setLoading(true);
      const data = await getMovementsByMonth(selectedMonth, selectedYear);
      setMovements(data);
      setLoading(false);
    };
    loadMovements();
  }, [selectedMonth, selectedYear]);

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
      .reduce((sum, m) => sum + m.quantity * (Number(m.price) || 0), 0);

    const saidasQty = movements
      .filter((m) => m.type === "remove")
      .reduce((sum, m) => sum + m.quantity, 0);
    const saidasValue = movements
      .filter((m) => m.type === "remove")
      .reduce((sum, m) => sum + m.quantity * (Number(m.price) || 0), 0);

    const liquidoQty = entradasQty - saidasQty;
    const liquidoValue = entradasValue - saidasValue;

    return {
      entradasQty,
      entradasValue,
      saidasQty,
      saidasValue,
      liquidoQty,
      liquidoValue,
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

      const products: ProductDayMovement[] = initialProducts.map((p) => {
        const addMovements = movements.filter(
          (m) =>
            m.productId === p.id &&
            m.type === "add" &&
            Number(m.date.split("-")[2]) === day
        );
        const removeMovements = movements.filter(
          (m) =>
            m.productId === p.id &&
            m.type === "remove" &&
            Number(m.date.split("-")[2]) === day
        );

        const addQty = addMovements.reduce((sum, m) => sum + m.quantity, 0);
        const removeQty = removeMovements.reduce((sum, m) => sum + m.quantity, 0);
        const addValue = addMovements.reduce((sum, m) => sum + m.quantity * (Number(m.price) || 0), 0);
        const removeValue = removeMovements.reduce((sum, m) => sum + m.quantity * (Number(m.price) || 0), 0);

        return {
          id: p.id,
          name: p.name,
          image: p.image,
          add: addQty,
          remove: removeQty,
          total: addQty + removeQty,
          addValue,
          removeValue,
        };
      });

      daily.push({
        day,
        dateLabel,
        products: products.filter((p) => p.total > 0).sort((a, b) => b.total - a.total),
      });
    }

    return daily;
  }, [movements, selectedMonth, selectedYear]);

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
      setTimeout(() => setHighlightedDay(null), 2000);
    }
  };

  const reportTitle = format(selectedDate, "LLLL yyyy", { locale: ptBR }).toUpperCase();

  return (
    <div ref={containerRef} className="p-6 w-full overflow-auto h-full bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">
        Relatório de Movimentação —{" "}
        <span className="text-lime-900">{reportTitle}</span>
      </h1>

      <div className="flex items-center gap-2 mb-6">
        <label className="text-sm text-gray-600">Mês:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => date && setSelectedDate(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          locale={ptBR}
          className="px-3 py-2 border rounded shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Carregando...</div>
      ) : (
        <>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-green-100 text-green-900 rounded shadow p-4 text-center">
              <div className="text-sm">Entradas</div>
              <div className="font-bold text-xl">
                {monthlySummary.entradasQty} <br />
                <span className="text-base font-semibold">
                  R$ {monthlySummary.entradasValue.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="bg-red-100 text-red-900 rounded shadow p-4 text-center">
              <div className="text-sm">Saídas</div>
              <div className="font-bold text-xl">
                {monthlySummary.saidasQty} <br />
                <span className="text-base font-semibold">
                  R$ {monthlySummary.saidasValue.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="bg-gray-100 text-gray-900 rounded shadow p-4 text-center">
              <div className="text-sm">Líquido</div>
              <div className="font-bold text-xl">
                {monthlySummary.liquidoQty} <br />
                <span className="text-base font-semibold">
                  R$ {monthlySummary.liquidoValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico diário */}
          <div className="mb-8 bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-4 text-gray-700">Movimentações Diárias</h2>
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      scrollToDay(Number(state.activeLabel));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                  <XAxis dataKey="dayLabel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Entradas" fill="#16A34A" />
                  <Bar dataKey="Saidas" fill="#DC2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Produtos por dia */}
          <div className="space-y-8">
            {productMovementsByDay.map(
              (day) =>
                day.products.length > 0 && (
                  <div
                    key={day.day}
                    ref={(el) => {
                      if (el) dayRefs.current[day.day] = el;
                    }}
                    className={`transition-colors duration-500 ${highlightedDay === day.day ? "bg-yellow-100" : ""
                      }`}
                  >
                    <h2 className="text-lg font-semibold mb-2">{day.dateLabel}</h2>
                    <div className="space-y-4">
                      {day.products.map((p) => (
                        <div
                          key={p.id ?? p.name}
                          className="bg-white rounded shadow p-4 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image ?? "/images/default.png"}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <span className="font-semibold text-gray-800">{p.name}</span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-green-600 font-semibold">
                                R$ {p.addValue.toFixed(2)}
                              </span>
                              <span className="text-red-600 font-semibold">
                                R$ {p.removeValue.toFixed(2)}
                              </span>
                              <span className="text-gray-800 font-semibold">
                                R$ {(p.addValue - p.removeValue).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div style={{ width: "100%", height: "70px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                layout="vertical"
                                data={[
                                  { type: "Entradas", value: p.add, fill: "#16A34A" },
                                  { type: "Saídas", value: p.remove, fill: "#DC2626" },
                                ]}
                                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis
                                  type="category"
                                  dataKey="type"
                                  width={60}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white border rounded p-2 text-sm shadow">
                                          {data.type}: {data.value}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" isAnimationActive>
                                  <LabelList
                                    dataKey="value"
                                    position="insideRight"
                                    fill="#fff"
                                    fontWeight="bold"
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
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
