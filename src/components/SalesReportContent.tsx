import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, Calendar, RefreshCw, Wallet, DollarSign, TrendingUpIcon, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction, Product, OperationalCost, User } from '@/types';
import { toast } from 'sonner';
import { 
  validateTimestamp, 
  getValidProductName, 
  getValidCostPrice, 
  getValidCashierName,
  getValidTransactionsForReport,
  calculateValidatedCOGS
} from '@/lib/dataValidation';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface SalesData {
  date: string;
  revenue: number;
  profit: number;
  cost: number;
  operationalCost: number;
  netProfit: number;
  orders: number;
}

interface ProductMarginData {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
  unitsSold: number;
  avgProfitPerUnit: number;
  hasEstimatedCost: boolean;
}

interface PeriodComparison {
  current: {
    revenue: number;
    profit: number;
    cost: number;
    operationalCost: number;
    netProfit: number;
    orders: number;
  };
  previous: {
    revenue: number;
    profit: number;
    cost: number;
    operationalCost: number;
    netProfit: number;
    orders: number;
  };
  changes: {
    revenue: number;
    profit: number;
    cost: number;
    operationalCost: number;
    netProfit: number;
    orders: number;
  };
}

interface DataQualityInfo {
  totalTransactions: number;
  validTransactions: number;
  invalidTransactions: number;
  transactionsWithEstimatedCost: number;
  productsWithMissingCost: number;
}

const SalesReportContent: React.FC = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [comparisonEnabled, setComparisonEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>([]);
  const [showDataQuality, setShowDataQuality] = useState(false);

  // Load data from localStorage
  const loadData = () => {
    try {
      const transactionsData = localStorage.getItem('dimsum_transactions');
      if (transactionsData) {
        const parsedTransactions = JSON.parse(transactionsData);
        setTransactions(Array.isArray(parsedTransactions) ? parsedTransactions : []);
      }

      const productsData = localStorage.getItem('dimsum_products');
      if (productsData) {
        const parsedProducts = JSON.parse(productsData);
        setProducts(Array.isArray(parsedProducts) ? parsedProducts : []);
      }

      const usersData = localStorage.getItem('dimsum_users');
      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        setUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
      }

      const costsData = localStorage.getItem('dimsum_operational_costs');
      if (costsData) {
        const parsedCosts = JSON.parse(costsData);
        setOperationalCosts(Array.isArray(parsedCosts) ? parsedCosts : []);
      }
      
      toast.success('Data berhasil dimuat dan divalidasi');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter transaksi yang valid
  const validTransactions = useMemo(() => {
    return getValidTransactionsForReport(transactions, products, users);
  }, [transactions, products, users]);

  // Data quality info
  const dataQualityInfo = useMemo((): DataQualityInfo => {
    const totalTransactions = transactions.length;
    const validTransactions = getValidTransactionsForReport(transactions, products, users).length;
    const invalidTransactions = totalTransactions - validTransactions;
    
    let transactionsWithEstimatedCost = 0;
    const productsWithMissingCostSet = new Set<string>();
    
    transactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const { isEstimated } = getValidCostPrice(item, products);
          if (isEstimated) {
            transactionsWithEstimatedCost++;
            productsWithMissingCostSet.add(item.productId);
          }
        });
      }
    });
    
    return {
      totalTransactions,
      validTransactions,
      invalidTransactions,
      transactionsWithEstimatedCost,
      productsWithMissingCost: productsWithMissingCostSet.size
    };
  }, [transactions, products, users]);

  const getDateRange = (type: PeriodType, offset: number = 0) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'daily':
        start = startOfDay(subDays(now, offset));
        end = endOfDay(subDays(now, offset));
        break;
      case 'weekly':
        start = startOfWeek(subWeeks(now, offset), { locale: id });
        end = endOfWeek(subWeeks(now, offset), { locale: id });
        break;
      case 'monthly':
        start = startOfMonth(subMonths(now, offset));
        end = endOfMonth(subMonths(now, offset));
        break;
    }

    return { start, end };
  };

  // Calculate sales data for charts
  const salesChartData = useMemo(() => {
    const data: SalesData[] = [];
    const range = periodType === 'daily' ? 30 : 12;

    for (let i = range - 1; i >= 0; i--) {
      const { start, end } = getDateRange(periodType, i);
      
      const periodTransactions = validTransactions.filter(t => {
        const timestamp = validateTimestamp(t.timestamp);
        const transDate = new Date(timestamp);
        return isWithinInterval(transDate, { start, end });
      });

      const periodOperationalCosts = operationalCosts.filter(c => {
        const timestamp = validateTimestamp(c.timestamp);
        const costDate = new Date(timestamp);
        return isWithinInterval(costDate, { start, end });
      });

      const revenue = periodTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
      
      // Calculate COGS with validation
      let cost = 0;
      periodTransactions.forEach(t => {
        const { cogs } = calculateValidatedCOGS(t, products);
        cost += cogs;
      });

      const operationalCost = periodOperationalCosts.reduce((sum, c) => sum + c.amount, 0);
      const profit = revenue - cost;
      const netProfit = profit - operationalCost;

      let dateLabel: string;
      if (periodType === 'daily') {
        dateLabel = format(start, 'dd MMM', { locale: id });
      } else if (periodType === 'weekly') {
        dateLabel = `W${format(start, 'w', { locale: id })}`;
      } else {
        dateLabel = format(start, 'MMM yyyy', { locale: id });
      }

      data.push({
        date: dateLabel,
        revenue,
        profit,
        cost,
        operationalCost,
        netProfit,
        orders: periodTransactions.length
      });
    }

    return data;
  }, [validTransactions, products, operationalCosts, periodType]);

  // Product margin analysis with validation
  const productMarginData = useMemo(() => {
    const productStats: { 
      [key: string]: { 
        revenue: number; 
        cost: number; 
        quantity: number; 
        name: string;
        hasEstimatedCost: boolean;
      } 
    } = {};

    validTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const { name } = getValidProductName(item, products);
          const { costPrice, isEstimated } = getValidCostPrice(item, products);
          
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              revenue: 0,
              cost: 0,
              quantity: 0,
              name: name,
              hasEstimatedCost: false
            };
          }
          
          const itemCost = costPrice * item.quantity;
          const itemRevenue = item.quantity * item.price;
          
          productStats[item.productId].revenue += itemRevenue;
          productStats[item.productId].cost += itemCost;
          productStats[item.productId].quantity += item.quantity;
          
          if (isEstimated) {
            productStats[item.productId].hasEstimatedCost = true;
          }
        });
      }
    });

    const marginArray: ProductMarginData[] = Object.entries(productStats).map(([id, data]) => {
      const grossProfit = data.revenue - data.cost;
      const marginPercentage = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
      const avgProfitPerUnit = data.quantity > 0 ? grossProfit / data.quantity : 0;
      
      return {
        productId: id,
        productName: data.name,
        totalRevenue: data.revenue,
        totalCost: data.cost,
        grossProfit,
        marginPercentage,
        unitsSold: data.quantity,
        avgProfitPerUnit,
        hasEstimatedCost: data.hasEstimatedCost
      };
    });

    return marginArray.sort((a, b) => b.grossProfit - a.grossProfit);
  }, [validTransactions, products]);

  // Period comparison
  const periodComparison = useMemo((): PeriodComparison => {
    const { start: currentStart, end: currentEnd } = getDateRange(periodType, 0);
    const { start: previousStart, end: previousEnd } = getDateRange(periodType, 1);

    const currentTransactions = validTransactions.filter(t => {
      const timestamp = validateTimestamp(t.timestamp);
      const transDate = new Date(timestamp);
      return isWithinInterval(transDate, { start: currentStart, end: currentEnd });
    });

    const previousTransactions = validTransactions.filter(t => {
      const timestamp = validateTimestamp(t.timestamp);
      const transDate = new Date(timestamp);
      return isWithinInterval(transDate, { start: previousStart, end: previousEnd });
    });

    const currentOperationalCosts = operationalCosts.filter(c => {
      const timestamp = validateTimestamp(c.timestamp);
      const costDate = new Date(timestamp);
      return isWithinInterval(costDate, { start: currentStart, end: currentEnd });
    });

    const previousOperationalCosts = operationalCosts.filter(c => {
      const timestamp = validateTimestamp(c.timestamp);
      const costDate = new Date(timestamp);
      return isWithinInterval(costDate, { start: previousStart, end: previousEnd });
    });

    // Current period
    const currentRevenue = currentTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    let currentCost = 0;
    currentTransactions.forEach(t => {
      const { cogs } = calculateValidatedCOGS(t, products);
      currentCost += cogs;
    });
    const currentOperationalCost = currentOperationalCosts.reduce((sum, c) => sum + c.amount, 0);

    const current = {
      revenue: currentRevenue,
      cost: currentCost,
      profit: currentRevenue - currentCost,
      operationalCost: currentOperationalCost,
      netProfit: currentRevenue - currentCost - currentOperationalCost,
      orders: currentTransactions.length
    };

    // Previous period
    const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    let previousCost = 0;
    previousTransactions.forEach(t => {
      const { cogs } = calculateValidatedCOGS(t, products);
      previousCost += cogs;
    });
    const previousOperationalCost = previousOperationalCosts.reduce((sum, c) => sum + c.amount, 0);

    const previous = {
      revenue: previousRevenue,
      cost: previousCost,
      profit: previousRevenue - previousCost,
      operationalCost: previousOperationalCost,
      netProfit: previousRevenue - previousCost - previousOperationalCost,
      orders: previousTransactions.length
    };

    const changes = {
      revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      profit: previous.profit > 0 ? ((current.profit - previous.profit) / previous.profit) * 100 : 0,
      cost: previous.cost > 0 ? ((current.cost - previous.cost) / previous.cost) * 100 : 0,
      operationalCost: previous.operationalCost > 0 ? ((current.operationalCost - previous.operationalCost) / previous.operationalCost) * 100 : 0,
      netProfit: previous.netProfit !== 0 ? ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100 : 0,
      orders: previous.orders > 0 ? ((current.orders - previous.orders) / previous.orders) * 100 : 0
    };

    return { current, previous, changes };
  }, [validTransactions, products, operationalCosts, periodType]);

  const profitMargin = useMemo(() => {
    const { revenue, netProfit } = periodComparison.current;
    return revenue > 0 ? (netProfit / revenue) * 100 : 0;
  }, [periodComparison]);

  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{value.toFixed(1)}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          {value.toFixed(1)}%
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-gray-600">
          <Minus className="w-4 h-4 mr-1" />
          0%
        </span>
      );
    }
  };

  const handleExportReport = () => {
    setLoading(true);
    try {
      const reportData = {
        period: periodType,
        generatedAt: new Date().toISOString(),
        dataQuality: dataQualityInfo,
        salesData: salesChartData,
        productMargins: productMarginData,
        comparison: comparisonEnabled ? periodComparison : null,
        profitLoss: {
          revenue: periodComparison.current.revenue,
          cogs: periodComparison.current.cost,
          grossProfit: periodComparison.current.profit,
          operationalCosts: periodComparison.current.operationalCost,
          netProfit: periodComparison.current.netProfit,
          profitMargin: profitMargin
        }
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Laporan berhasil diekspor');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Gagal mengekspor laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-600 mt-1">
            {dataQualityInfo.validTransactions} transaksi valid | {products.length} produk
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={comparisonEnabled ? "default" : "outline"}
            onClick={() => setComparisonEnabled(!comparisonEnabled)}
            className="w-full sm:w-auto"
          >
            {comparisonEnabled ? 'Sembunyikan' : 'Tampilkan'} Perbandingan
          </Button>
          <Button variant="outline" onClick={loadData} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport} disabled={loading} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Mengekspor...' : 'Ekspor'}
          </Button>
        </div>
      </div>

      {/* Data Quality Alert */}
      {(dataQualityInfo.invalidTransactions > 0 || dataQualityInfo.transactionsWithEstimatedCost > 0) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Informasi Kualitas Data</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <div className="space-y-1 mt-2">
              {dataQualityInfo.invalidTransactions > 0 && (
                <p>• {dataQualityInfo.invalidTransactions} transaksi tidak valid (tidak ditampilkan dalam laporan)</p>
              )}
              {dataQualityInfo.transactionsWithEstimatedCost > 0 && (
                <p>• {dataQualityInfo.transactionsWithEstimatedCost} item menggunakan estimasi biaya (60% dari harga jual)</p>
              )}
              {dataQualityInfo.productsWithMissingCost > 0 && (
                <p>• {dataQualityInfo.productsWithMissingCost} produk tidak memiliki data costPrice</p>
              )}
            </div>
            <Button 
              variant="link" 
              className="text-yellow-800 p-0 h-auto mt-2"
              onClick={() => setShowDataQuality(!showDataQuality)}
            >
              {showDataQuality ? 'Sembunyikan Detail' : 'Lihat Detail'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {dataQualityInfo.invalidTransactions === 0 && dataQualityInfo.transactionsWithEstimatedCost === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Data Berkualitas Baik</AlertTitle>
          <AlertDescription className="text-green-700">
            Semua transaksi valid dan memiliki data biaya yang lengkap. Laporan ini menampilkan data yang akurat.
          </AlertDescription>
        </Alert>
      )}

      {/* Laporan Laba Rugi */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Laporan Laba Rugi
          </CardTitle>
          <CardDescription>
            Periode {periodType === 'daily' ? 'Hari Ini' : periodType === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendapatan (Revenue)</p>
                <p className="text-xs text-gray-500 mt-1">Total penjualan dari {periodComparison.current.orders} transaksi</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rp {periodComparison.current.revenue.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600">Biaya Pokok Penjualan (COGS)</p>
                <p className="text-xs text-gray-500 mt-1">Dihitung dari costPrice × jumlah terjual</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                Rp {periodComparison.current.cost.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="border-t-2 border-gray-300 my-2"></div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div>
                <p className="text-sm font-semibold text-green-800">Laba Kotor</p>
                <p className="text-xs text-green-600 mt-1">Pendapatan - COGS</p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                Rp {periodComparison.current.profit.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  Biaya Operasional
                </p>
                <p className="text-xs text-gray-500 mt-1">Listrik, gaji, sewa, dll</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                Rp {periodComparison.current.operationalCost.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="border-t-2 border-gray-300 my-2"></div>

            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5" />
                  Laba Bersih
                </p>
                <p className="text-xs text-blue-100 mt-1">Laba Kotor - Biaya Operasional</p>
              </div>
              <p className="text-3xl font-bold text-white">
                Rp {periodComparison.current.netProfit.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div>
                <p className="text-sm font-semibold text-purple-800">Margin Keuntungan</p>
                <p className="text-xs text-purple-600 mt-1">(Laba Bersih / Pendapatan) × 100%</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-700">
                  {profitMargin.toFixed(2)}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {profitMargin > 0 ? 'Menguntungkan' : profitMargin < 0 ? 'Rugi' : 'Break Even'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Cards */}
      {comparisonEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Penjualan</CardDescription>
              <CardTitle className="text-2xl">
                Rp {periodComparison.current.revenue.toLocaleString('id-ID')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">vs periode sebelumnya</span>
                {renderTrendIndicator(periodComparison.changes.revenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Laba Kotor</CardDescription>
              <CardTitle className="text-2xl">
                Rp {periodComparison.current.profit.toLocaleString('id-ID')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">vs periode sebelumnya</span>
                {renderTrendIndicator(periodComparison.changes.profit)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardDescription>Laba Bersih</CardDescription>
              <CardTitle className="text-2xl text-green-700">
                Rp {periodComparison.current.netProfit.toLocaleString('id-ID')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">vs periode sebelumnya</span>
                {renderTrendIndicator(periodComparison.changes.netProfit)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Charts */}
      <Tabs defaultValue="line">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="line">Grafik Garis</TabsTrigger>
          <TabsTrigger value="bar">Grafik Batang</TabsTrigger>
        </TabsList>

        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Tren Penjualan</CardTitle>
              <CardDescription>
                {periodType === 'daily' ? '30 hari' : '12 periode'} terakhir (hanya transaksi valid)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0088FE" name="Penjualan" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#00C49F" name="Laba Kotor" strokeWidth={2} />
                    <Line type="monotone" dataKey="netProfit" stroke="#8B5CF6" name="Laba Bersih" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  Belum ada data transaksi valid
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Grafik Batang Penjualan</CardTitle>
              <CardDescription>Perbandingan per periode (hanya transaksi valid)</CardDescription>
            </CardHeader>
            <CardContent>
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0088FE" name="Penjualan" />
                    <Bar dataKey="profit" fill="#00C49F" name="Laba Kotor" />
                    <Bar dataKey="netProfit" fill="#8B5CF6" name="Laba Bersih" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  Belum ada data transaksi valid
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Margin Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Analisis Margin Per Produk
          </CardTitle>
          <CardDescription>
            Data dari transaksi valid dengan validasi costPrice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {productMarginData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productMarginData.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="productName" type="category" width={150} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Margin (%)') return `${value.toFixed(2)}%`;
                        return `Rp ${value.toLocaleString('id-ID')}`;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="grossProfit" fill="#00C49F" name="Laba Kotor" />
                    <Bar dataKey="marginPercentage" fill="#8B5CF6" name="Margin (%)" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead className="text-right">Terjual</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">COGS</TableHead>
                        <TableHead className="text-right">Laba Kotor</TableHead>
                        <TableHead className="text-right">Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productMarginData.map((product, index) => (
                        <TableRow key={product.productId}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {product.productName}
                              {product.hasEstimatedCost && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800" title="Menggunakan estimasi biaya">
                                  Est.
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{product.unitsSold}</TableCell>
                          <TableCell className="text-right">
                            Rp {product.totalRevenue.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            Rp {product.totalCost.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            Rp {product.grossProfit.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.marginPercentage >= 50 ? 'bg-green-100 text-green-800' :
                              product.marginPercentage >= 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.marginPercentage.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                Belum ada data penjualan produk yang valid
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReportContent;