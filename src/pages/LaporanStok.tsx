import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, AlertTriangle, Package, TrendingDown, Search } from 'lucide-react';
import { getStoredProducts, getStoredTransactions, getStoredPurchases } from '@/lib/storage';
import { KPICard } from '@/components/KPICard';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface TransactionItem {
  productId: string;
  quantity: number;
}

interface Transaction {
  status: string;
  items?: TransactionItem[];
}

interface StockDataItem extends Product {
  sold: number;
  purchased: number;
  stockValue: number;
  turnoverRate: string;
  status: 'low' | 'medium' | 'good';
}

export default function LaporanStok() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const products = getStoredProducts();
  const salesTransactions = getStoredTransactions() as Transaction[];
  const purchaseTransactions = getStoredPurchases() as Transaction[];

  // Calculate stock movements
  const stockData = useMemo(() => {
    return products.map((product: Product) => {
      const sold = salesTransactions
        .filter((t: Transaction) => t.status === 'completed')
        .reduce((sum: number, t: Transaction) => {
          const item = t.items?.find((i: TransactionItem) => i.productId === product.id);
          return sum + (item?.quantity || 0);
        }, 0);

      const purchased = purchaseTransactions.reduce((sum: number, t: Transaction) => {
        const item = t.items?.find((i: TransactionItem) => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);

      const stockValue = product.stock * product.price;
      const turnoverRate = product.stock > 0 ? (sold / (product.stock + sold)) * 100 : 0;

      return {
        ...product,
        sold,
        purchased,
        stockValue,
        turnoverRate: turnoverRate.toFixed(1),
        status: (product.stock <= 10 ? 'low' : product.stock <= 30 ? 'medium' : 'good') as 'low' | 'medium' | 'good'
      };
    });
  }, [products, salesTransactions, purchaseTransactions]);

  // Filter data
  const filteredData = useMemo(() => {
    return stockData.filter((item: StockDataItem) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'low' && item.stock <= 10) ||
        (stockFilter === 'medium' && item.stock > 10 && item.stock <= 30) ||
        (stockFilter === 'good' && item.stock > 30);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [stockData, searchTerm, categoryFilter, stockFilter]);

  // Calculate KPIs
  const totalStockValue = stockData.reduce((sum: number, item: StockDataItem) => sum + item.stockValue, 0);
  const lowStockItems = stockData.filter((item: StockDataItem) => item.stock <= 10).length;
  const totalProducts = stockData.length;
  const avgTurnover = stockData.reduce((sum: number, item: StockDataItem) => sum + parseFloat(item.turnoverRate), 0) / totalProducts;

  // Chart data
  const categoryStockData = useMemo(() => {
    const categories = [...new Set(products.map((p: Product) => p.category))];
    return categories.map(category => {
      const categoryProducts = stockData.filter((p: StockDataItem) => p.category === category);
      return {
        category,
        stock: categoryProducts.reduce((sum: number, p: StockDataItem) => sum + p.stock, 0),
        value: categoryProducts.reduce((sum: number, p: StockDataItem) => sum + p.stockValue, 0)
      };
    });
  }, [stockData, products]);

  const topProductsData = useMemo(() => {
    return [...stockData]
      .sort((a: StockDataItem, b: StockDataItem) => b.sold - a.sold)
      .slice(0, 5)
      .map((p: StockDataItem) => ({
        name: p.name,
        sold: p.sold,
        stock: p.stock
      }));
  }, [stockData]);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredData.map((item: StockDataItem) => ({
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Stok Tersedia': item.stock,
      'Harga': item.price,
      'Nilai Stok': item.stockValue,
      'Terjual': item.sold,
      'Pembelian': item.purchased,
      'Turnover Rate (%)': item.turnoverRate,
      'Status': item.status === 'low' ? 'Stok Rendah' : item.status === 'medium' ? 'Stok Sedang' : 'Stok Baik'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Stok');
    XLSX.writeFile(wb, `laporan-stok-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Laporan Stok</h1>
        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Nilai Stok"
          value={`Rp ${totalStockValue.toLocaleString('id-ID')}`}
          icon={Package}
          trend="0%"
          trendUp={true}
        />
        <KPICard
          title="Stok Rendah"
          value={lowStockItems}
          icon={AlertTriangle}
          trend="0%"
          trendUp={false}
          bgColor="bg-red-50"
        />
        <KPICard
          title="Total Produk"
          value={totalProducts}
          icon={Package}
          trend="0%"
          trendUp={true}
        />
        <KPICard
          title="Rata-rata Turnover"
          value={`${avgTurnover.toFixed(1)}%`}
          icon={TrendingDown}
          trend="0%"
          trendUp={true}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {[...new Set(products.map((p: Product) => p.category))].map((category: string) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="low">Stok Rendah (≤10)</SelectItem>
                <SelectItem value="medium">Stok Sedang (11-30)</SelectItem>
                <SelectItem value="good">Stok Baik (&gt;30)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stok per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#8884d8" name="Jumlah Stok" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nilai Stok per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStockData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value }: { category: string; value: number }) => `${category}: Rp ${(value / 1000).toFixed(0)}k`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryStockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sold" fill="#82ca9d" name="Terjual" />
              <Bar dataKey="stock" fill="#8884d8" name="Stok Tersisa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Stok Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produk</th>
                  <th className="text-left p-2">Kategori</th>
                  <th className="text-right p-2">Stok</th>
                  <th className="text-right p-2">Harga</th>
                  <th className="text-right p-2">Nilai Stok</th>
                  <th className="text-right p-2">Terjual</th>
                  <th className="text-right p-2">Turnover</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item: StockDataItem) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.category}</td>
                    <td className="text-right p-2">{item.stock}</td>
                    <td className="text-right p-2">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="text-right p-2">Rp {item.stockValue.toLocaleString('id-ID')}</td>
                    <td className="text-right p-2">{item.sold}</td>
                    <td className="text-right p-2">{item.turnoverRate}%</td>
                    <td className="text-center p-2">
                      <Badge
                        variant={
                          item.status === 'low' ? 'destructive' :
                          item.status === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {item.status === 'low' ? 'Rendah' :
                         item.status === 'medium' ? 'Sedang' : 'Baik'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}