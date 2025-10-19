import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface TokenData {
  token: string;
  prob: number;
}

interface SamplingChartProps {
  dimension: string;
  tokens: TokenData[];
}

const SamplingCharts: React.FC<SamplingChartProps> = ({ dimension, tokens }) => {
  const data = tokens.map((t) => ({
    token: t.token,
    prob: parseFloat((t.prob * 100).toFixed(2)), // convert to %
  }));

  return (
    <div className="chart-container">
      <h3>{dimension}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="token"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="prob" fill="#3a5ef0" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SamplingCharts;
