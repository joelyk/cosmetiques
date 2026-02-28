"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsPoint, ProductPerformance, UserRole } from "@/types/catalog";

const colors = ["#c96f3d", "#d68a55", "#e5b696", "#a95c34"];

export function DashboardCharts({
  traffic,
  performance,
  role,
}: {
  traffic: AnalyticsPoint[];
  performance: ProductPerformance[];
  role: UserRole;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-5">
        <div className="mb-4">
          <p className="eyebrow">
            {role === "super_admin" ? "Trafic entrants" : "Clics et demandes"}
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Vue hebdomadaire du site
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={traffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6d6cb" />
              <XAxis dataKey="label" stroke="#8f7467" />
              <YAxis stroke="#8f7467" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={role === "super_admin" ? "visitors" : "productClicks"}
                stroke="#bf6b3f"
                strokeWidth={3}
                dot={{ fill: "#bf6b3f" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-4">
          <p className="eyebrow">Produits marquants</p>
          <h2 className="mt-2 text-xl font-semibold">
            Produits à surveiller côté admin
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6d6cb" />
              <XAxis dataKey="productName" stroke="#8f7467" hide />
              <YAxis stroke="#8f7467" />
              <Tooltip />
              <Bar dataKey="clicks" radius={[12, 12, 0, 0]}>
                {performance.map((entry, index) => (
                  <Cell
                    key={`${entry.productId}-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
