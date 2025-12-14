import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import KPICard from '@/components/KPICard';
import { ReportsLayout } from '@/components/ReportsLayout';
import { STORAGE_KEYS } from '@/lib/storage';

interface Transaction {
  id: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    cost?: number;
  }>;
  total: number;
  paymentMethod: string;
  timestamp: string | number | Date;
  cashierId: string;
  shiftId?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

interface OperationalCost {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string | number | Date;
  createdBy: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Helper function to safely convert various date formats to Date object
const safeParseDate = (dateValue: string | number | Date | undefined | null): Date => {
  if (!dateValue) {
    return new Date();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  if (typeof dateValue === 'string') {
    // Try parsing as ISO string first
    try {
      return parseISO(dateValue);
    } catch {
      // If that fails, try creating a new Date
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
  }
  
  return new Date();
};

export default function LaporanLabaRugi() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const productsData = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const costsData = localStorage.getItem(STORAGE_KEYS.OPERATIONAL_COSTS);

    if (transactionsData) setTransactions(JSON.parse(transactionsData));
    if (productsData) setProducts(JSON.parse(productsData));
    if (costsData) setOperationalCosts(JSON.parse(costsData));
  };

  const filteredData = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = safeParseDate(t.timestamp);
      return isWithinInterval(transactionDate, { start, end });
    });

    const filteredCosts = operationalCosts.filter((c) => {
      const costDate = safeParseDate(c.date);
      return isWithinInterval(costDate, { start, end });
    });

    return { transactions: filteredTransactions, costs: filteredCosts };
  }, [transactions, operationalCosts, startDate, endDate]);

  const profitLossData = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    const categoryRevenue: { [key: string]: number } = {};
    const categoryProfit: { [key: string]: number } = {};

    filteredData.transactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const revenue = item.price * item.quantity;
        const cost = (item.cost || product?.cost || 0) * item.quantity;

        totalRevenue += revenue;
        totalCOGS += cost;

        const category = product?.category || 'Uncategorized';
        categoryRevenue[category] = (categoryRevenue[category] || 0) + revenue;
        categoryProfit[category] = (categoryProfit[category] || 0) + (revenue - cost);
      });
    });

    const totalOperationalCosts = filteredData.costs.reduce((sum, cost) => sum + cost.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalOperationalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalOperationalCosts,
      netProfit,
      profitMargin,
      categoryRevenue,
      categoryProfit,
    };
  }, [filteredData, products]);

  const chartData = useMemo(() => {
    const categories = Object.keys(profitLossData.categoryRevenue);
    const filtered =
      categoryFilter === 'all'
        ? categories
        : categories.filter((cat) => cat.toLowerCase() === categoryFilter.toLowerCase());

    return filtered.map((category) => ({
      category,
      revenue: profitLossData.categoryRevenue[category] || 0,
      profit: profitLossData.categoryProfit[category] || 0,
    }));
  }, [profitLossData, categoryFilter]);

  const pieChartData = useMemo(() => {
    return Object.entries(profitLossData.categoryRevenue).map(([category, value]) => ({
      name: category,
      value,
    }));
  }, [profitLossData]);

  const costBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    filteredData.costs.forEach((cost) => {
      breakdown[cost.category] = (breakdown[cost.category] || 0) + cost.amount;
    });
    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [filteredData.costs]);

  const handleExport = () => {
    const exportData = [
      ['Laporan Laba Rugi'],
      ['Periode', `${format(parseISO(startDate), 'dd MMM yyyy', { locale: id })} - ${format(parseISO(endDate), 'dd MMM yyyy', { locale: id })}`],
      [],
      ['Ringkasan Keuangan'],
      ['Total Pendapatan', profitLossData.totalRevenue.toLocaleString('id-ID')],
      ['HPP (Harga Pokok Penjualan)', profitLossData.totalCOGS.toLocaleString('id-ID')],
      ['Laba Kotor', profitLossData.grossProfit.toLocaleString('id-ID')],
      ['Biaya Operasional', profitLossData.totalOperationalCosts.toLocaleString('id-ID')],
      ['Laba Bersih', profitLossData.netProfit.toLocaleString('id-ID')],
      ['Margin Laba (%)', profitLossData.profitMargin.toFixed(2)],
      [],
      ['Pendapatan per Kategori'],
      ['Kategori', 'Pendapatan', 'Laba'],
      ...chartData.map((item) => [item.category, item.revenue, item.profit]),
      [],
      ['Rincian Biaya Operasional'],
      ['Kategori', 'Jumlah'],
      ...costBreakdown.map((item) => [item.category, item.amount]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi');
    XLSX.writeFile(wb, `Laporan_Laba_Rugi_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  return (
    <ReportsLayout 
      title="Laporan Laba Rugi"
      onDateRangeChange={() => {}}
      onExportPDF={() => {}}
      onExportExcel={handleExport}
      onPrint={() => window.print()}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Tanggal Akhir</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'Semua Kategori' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleExport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Pendapatan"
            value={`Rp ${profitLossData.totalRevenue.toLocaleString('id-ID')}`}
            icon={DollarSign}
            bgColor="bg-green-50"
          />
          <KPICard
            title="Laba Kotor"
            value={`Rp ${profitLossData.grossProfit.toLocaleString('id-ID')}`}
            icon={TrendingUp}
            bgColor="bg-blue-50"
          />
          <KPICard
            title="Laba Bersih"
            value={`Rp ${profitLossData.netProfit.toLocaleString('id-ID')}`}
            icon={profitLossData.netProfit > 0 ? TrendingUp : TrendingDown}
            bgColor={profitLossData.netProfit > 0 ? "bg-green-50" : "bg-red-50"}
          />
          <KPICard
            title="Margin Laba"
            value={`${profitLossData.profitMargin.toFixed(2)}%`}
            icon={ShoppingCart}
            bgColor="bg-purple-50"
          />
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Laba Rugi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Total Pendapatan</span>
                <span className="text-green-600">Rp {profitLossData.totalRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">HPP (Harga Pokok Penjualan)</span>
                <span className="text-red-600">Rp {profitLossData.totalCOGS.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Laba Kotor</span>
                <span className={profitLossData.grossProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                  Rp {profitLossData.grossProfit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Biaya Operasional</span>
                <span className="text-red-600">Rp {profitLossData.totalOperationalCosts.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t-2 pt-2 mt-2">
                <span className="font-bold text-lg">Laba Bersih</span>
                <span className={`font-bold text-lg ${profitLossData.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {profitLossData.netProfit.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan & Laba per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0088FE" name="Pendapatan" />
                  <Bar dataKey="profit" fill="#00C49F" name="Laba" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribusi Pendapatan</CardTitle>
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
                  <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Rincian Biaya Operasional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" />
                  <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Bar dataKey="amount" fill="#FF8042" name="Biaya" />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {costBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span>{item.category}</span>
                    <span className="font-semibold">Rp {item.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t-2 pt-2 mt-2">
                  <span className="font-bold">Total Biaya Operasional</span>
                  <span className="font-bold text-red-600">
                    Rp {profitLossData.totalOperationalCosts.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReportsLayout>
  );
}