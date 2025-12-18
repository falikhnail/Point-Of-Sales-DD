import { useState, useMemo } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { getDataByBranch, getAllBranchesData } from '@/lib/branchStorage';
import { STORAGE_KEYS, formatCurrency } from '@/lib/storage';
import { Transaction, Product } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MultiBranchDashboard() {
  const { branches } = useBranch();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const branchPerformance = useMemo(() => {
    const activeBranches = branches.filter(b => b.isActive);
    const allTransactions = getAllBranchesData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const allProducts = getAllBranchesData<Product>(STORAGE_KEYS.PRODUCTS);

    const now = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    return activeBranches.map(branch => {
      const branchTransactions = allTransactions.filter(
        t => t.branchId === branch.id && 
        new Date(t.date) >= startDate &&
        t.status === 'completed'
      );

      const branchProducts = allProducts.filter(p => p.branchId === branch.id);

      const totalSales = branchTransactions.reduce((sum, t) => sum + t.total, 0);
      const totalTransactions = branchTransactions.length;
      const totalProducts = branchProducts.length;
      const lowStockProducts = branchProducts.filter(p => p.stock <= (p.minStock || 0)).length;

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        totalSales,
        totalTransactions,
        totalProducts,
        lowStockProducts,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      };
    });
  }, [branches, selectedPeriod]);

  const totalRevenue = useMemo(() => {
    return branchPerformance.reduce((sum, b) => sum + b.totalSales, 0);
  }, [branchPerformance]);

  const totalTransactions = useMemo(() => {
    return branchPerformance.reduce((sum, b) => sum + b.totalTransactions, 0);
  }, [branchPerformance]);

  const salesChartData = useMemo(() => {
    return branchPerformance.map(b => ({
      name: b.branchCode,
      penjualan: b.totalSales,
      transaksi: b.totalTransactions,
    }));
  }, [branchPerformance]);

  const pieChartData = useMemo(() => {
    return branchPerformance.map(b => ({
      name: b.branchName,
      value: b.totalSales,
    }));
  }, [branchPerformance]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Dashboard Multi Cabang
          </h1>
          <p className="text-muted-foreground mt-1">
            Perbandingan performa semua cabang
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'today' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('today')}
          >
            Hari Ini
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
          >
            7 Hari
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
          >
            30 Hari
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cabang</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter(b => b.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Cabang aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Semua cabang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Transaksi selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTransactions > 0 ? totalRevenue / totalTransactions : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaksi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Penjualan per Cabang</CardTitle>
            <CardDescription>Total penjualan dan jumlah transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="penjualan" fill="#8884d8" name="Penjualan (Rp)" />
                <Bar dataKey="transaksi" fill="#82ca9d" name="Jumlah Transaksi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Penjualan</CardTitle>
            <CardDescription>Kontribusi penjualan per cabang</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Performa per Cabang</CardTitle>
          <CardDescription>Ringkasan metrik untuk setiap cabang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchPerformance.map((branch, index) => (
              <div
                key={branch.branchId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {branch.branchCode}
                  </div>
                  <div>
                    <h3 className="font-semibold">{branch.branchName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {branch.totalTransactions} transaksi
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">Penjualan</p>
                    <p className="font-semibold">{formatCurrency(branch.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata</p>
                    <p className="font-semibold">{formatCurrency(branch.averageTransaction)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produk</p>
                    <p className="font-semibold">
                      {branch.totalProducts}
                      {branch.lowStockProducts > 0 && (
                        <span className="text-red-500 ml-1">
                          ({branch.lowStockProducts} low)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}