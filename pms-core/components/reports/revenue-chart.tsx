"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RevenueChart({ data }: { data: { date: string; revenue: number; occupancy: number }[] }) {
  return (
    <section className="pms-card p-5">
      <h2 className="mb-4 text-sm text-[var(--pms-muted)]">Revenue e occupazione</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgb(37 39 33 / 0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#263229" fill="#dce8dc" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
