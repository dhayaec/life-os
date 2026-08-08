'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatCurrency } from '@/lib/format';

export type SpendingSlice = { name: string; value: number; fill: string };

export function SpendingChart({ data, locale }: { data: SpendingSlice[]; locale: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
