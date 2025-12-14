import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  transactions: Transaction[];
}

export default function SalesChart({ transactions }: SalesChartProps) {
  // Group transactions by date
  const salesByDate = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    });
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += transaction.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDate)
    .map(([date, total]) => ({
      date,
      total,
    }))
    .slice(-7); // Last 7 days

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Penjualan (7 Hari Terakhir)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <Bar dataKey="total" fill="#ea580c" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}