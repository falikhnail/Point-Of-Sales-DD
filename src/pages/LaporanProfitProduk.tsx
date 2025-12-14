import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { normalizeCategory } from '@/lib/storage';
import { CartItem } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

// Extended CartItem type to handle both old and new transaction formats
interface ExtendedCartItem extends CartItem {
  productId?: string;
  cost?: number;
  costPrice?: number;
}

export default function LaporanProfitProduk() {
  const { products, transactions, refreshTransactions } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'quantity'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Refresh transactions when component mounts (only once)
  useEffect(() => {
    refreshTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        const normalized = normalizeCategory(product.category);
        if (normalized && typeof normalized === 'string') {
          normalized.split(',').forEach(cat => {
            const trimmed = cat.trim();
            if (trimmed) categorySet.add(trimmed);
          });
        }
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  // Calculate profit metrics for each product
  const productProfitData = useMemo(() => {
    const productMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      quantitySold: number;
      profitMargin: number;
    }>();

    // Process all completed transactions
    const completedTransactions = transactions.filter(t => t.status === 'completed');

    completedTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        // Handle both 'id' and 'productId' fields for backward compatibility
        const extendedItem = item as ExtendedCartItem;
        
        // Try to get productId from multiple possible fields
        const itemProductId = extendedItem.productId || extendedItem.id || item.id;
        
        if (!itemProductId) {
          return;
        }
        
        const product = products.find(p => p.id === itemProductId);
        if (!product) {
          return;
        }

        const revenue = item.price * item.quantity;
        // Use cost from item first (if available), then from product
        const itemCost = extendedItem.cost ?? extendedItem.costPrice ?? product.cost ?? product.costPrice ?? 0;
        const cost = itemCost * item.quantity;
        const profit = revenue - cost;

        if (productMap.has(itemProductId)) {
          const existing = productMap.get(itemProductId)!;
          existing.totalRevenue += revenue;
          existing.totalCost += cost;
          existing.totalProfit += profit;
          existing.quantitySold += item.quantity;
          existing.profitMargin = (existing.totalProfit / existing.totalRevenue) * 100;
        } else {
          productMap.set(itemProductId, {
            id: itemProductId,
            name: product.name,
            category: product.category || 'Uncategorized',
            totalRevenue: revenue,
            totalCost: cost,
            totalProfit: profit,
            quantitySold: item.quantity,
            profitMargin: (profit / revenue) * 100
          });
        }
      });
    });

    return Array.from(productMap.values());
  }, [products, transactions]);

  // Filter by category
  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return productProfitData;
    
    return productProfitData.filter(item => {
      const normalized = normalizeCategory(item.category);
      // Ensure normalized is a string before splitting
      if (!normalized || typeof normalized !== 'string') return false;
      
      const categories = String(normalized).split(',').map(c => c.trim());
      return categories.includes(selectedCategory);
    });
  }, [productProfitData, selectedCategory]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'profit': {
          comparison = a.totalProfit - b.totalProfit;
          break;
        }
        case 'revenue': {
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        }
        case 'quantity': {
          comparison = a.quantitySold - b.quantitySold;
          break;
        }
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCost = filteredData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalProfit = filteredData.reduce((sum, item) => sum + item.totalProfit, 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantitySold, 0);
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalQuantity,
      avgProfitMargin,
      productCount: filteredData.length
    };
  }, [filteredData]);

  // Prepare chart data (top 10 products by profit)
  const chartData = useMemo(() => {
    return sortedData.slice(0, 10).map(item => ({
      name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
      profit: item.totalProfit,
      revenue: item.totalRevenue,
      cost: item.totalCost
    }));
  }, [sortedData]);

  // Prepare pie chart data (profit by category)
  const categoryProfitData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredData.forEach(item => {
      const normalized = normalizeCategory(item.category);
      if (!normalized || typeof normalized !== 'string') {
        const profit = categoryMap.get('Uncategorized') || 0;
        categoryMap.set('Uncategorized', profit + item.totalProfit);
        return;
      }
      
      const categories = String(normalized).split(',').map(c => c.trim());
      categories.forEach(cat => {
        const profit = categoryMap.get(cat) || 0;
        categoryMap.set(cat, profit + item.totalProfit);
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Export to Excel
  const handleExport = () => {
    const exportData = sortedData.map(item => ({
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Jumlah Terjual': item.quantitySold,
      'Total Pendapatan': item.totalRevenue,
      'Total Biaya': item.totalCost,
      'Total Profit': item.totalProfit,
      'Margin Profit (%)': item.profitMargin.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profit per Produk');
    XLSX.writeFile(wb, `Laporan_Profit_Produk_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Profit per Produk</h1>
          <p className="text-muted-foreground">Analisis profitabilitas setiap produk</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Margin: {summaryMetrics.avgProfitMargin.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari {summaryMetrics.productCount} produk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              Biaya produksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terjual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">
              Unit produk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Sorting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Urutkan Berdasarkan</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'profit' | 'revenue' | 'quantity')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="revenue">Pendapatan</SelectItem>
                  <SelectItem value="quantity">Jumlah Terjual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Urutan</label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Tertinggi ke Terendah</SelectItem>
                  <SelectItem value="asc">Terendah ke Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produk Berdasarkan Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="profit" fill="#10b981" name="Profit" />
                <Bar dataKey="revenue" fill="#3b82f6" name="Pendapatan" />
                <Bar dataKey="cost" fill="#ef4444" name="Biaya" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Profit per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryProfitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryProfitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Profit per Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah Terjual</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                  <TableHead className="text-right">Biaya</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Tidak ada data transaksi. Silakan lakukan transaksi terlebih dahulu.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.quantitySold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(item.totalProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.profitMargin > 30 ? 'text-green-600 font-semibold' : ''}>
                          {item.profitMargin.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}