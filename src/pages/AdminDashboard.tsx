import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { DollarSign, ShoppingCart, Package, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { getStoredTransactions, getStoredProducts, getStoredShifts } from "@/lib/storage";
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from "date-fns";
import { Product } from "@/types";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  activeShifts: number;
  todayRevenue: number;
  revenueGrowth: string;
  ordersGrowth: string;
}

interface Transaction {
  id: string;
  date: string;
  total: number;
  items?: TransactionItem[];
}

interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Shift {
  id: string;
  status: string;
  cashierId: string;
  startTime: string;
  endTime?: string;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSalesData {
  name: string;
  quantity: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    activeShifts: 0,
    todayRevenue: 0,
    revenueGrowth: "+0%",
    ordersGrowth: "+0%",
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [productData, setProductData] = useState<ProductSalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    calculateStats();
    prepareChartData();
  }, []);

  const calculateStats = () => {
    const transactions = getStoredTransactions() as Transaction[];
    const products = getStoredProducts();
    const shifts = getStoredShifts() as Shift[];

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));

    // Filter today's and yesterday's transactions
    const todayTransactions = transactions.filter((t: Transaction) => {
      const transactionDate = new Date(t.date);
      return isWithinInterval(transactionDate, { start: todayStart, end: todayEnd });
    });

    const yesterdayTransactions = transactions.filter((t: Transaction) => {
      const transactionDate = new Date(t.date);
      return isWithinInterval(transactionDate, { start: yesterdayStart, end: yesterdayEnd });
    });

    // Calculate totals
    const totalRevenue = transactions.reduce((sum: number, t: Transaction) => sum + (t.total || 0), 0);
    const todayRevenue = todayTransactions.reduce((sum: number, t: Transaction) => sum + (t.total || 0), 0);
    const yesterdayRevenue = yesterdayTransactions.reduce((sum: number, t: Transaction) => sum + (t.total || 0), 0);

    // Calculate growth percentages
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : "0";
    
    const ordersGrowth = yesterdayTransactions.length > 0
      ? ((todayTransactions.length - yesterdayTransactions.length) / yesterdayTransactions.length * 100).toFixed(1)
      : "0";

    // Count active shifts
    const activeShifts = shifts.filter((s: Shift) => s.status === 'active').length;

    setStats({
      totalRevenue,
      totalOrders: transactions.length,
      totalProducts: products.length,
      averageOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      activeShifts,
      todayRevenue,
      revenueGrowth: `${parseFloat(revenueGrowth) > 0 ? '+' : ''}${revenueGrowth}%`,
      ordersGrowth: `${parseFloat(ordersGrowth) > 0 ? '+' : ''}${ordersGrowth}%`,
    });
  };

  const prepareChartData = () => {
    const transactions = getStoredTransactions() as Transaction[];
    const products = getStoredProducts();

    // Prepare daily revenue data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
      };
    });

    const dailyData = last7Days.map(day => {
      const dayStart = startOfDay(day.fullDate);
      const dayEnd = endOfDay(day.fullDate);
      
      const dayTransactions = transactions.filter((t: Transaction) => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, { start: dayStart, end: dayEnd });
      });

      const revenue = dayTransactions.reduce((sum: number, t: Transaction) => sum + (t.total || 0), 0);
      const orders = dayTransactions.length;

      return {
        date: day.date,
        revenue,
        orders,
      };
    });

    setChartData(dailyData);

    // Prepare product sales data (top 5 products)
    const productSales: { [key: string]: ProductSalesData } = {};

    transactions.forEach((transaction: Transaction) => {
      transaction.items?.forEach((item: TransactionItem) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.quantity * item.price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setProductData(topProducts);

    // Prepare category distribution data
    const categoryMap: { [key: string]: number } = {};
    
    products.forEach((product: Product) => {
      const category = product.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    setCategoryData(categoryChartData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant's performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total Revenue"
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
          icon={DollarSign}
          trend={stats.revenueGrowth}
          trendUp={parseFloat(stats.revenueGrowth) >= 0}
          bgColor="bg-green-50"
        />
        <KPICard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          trend={stats.ordersGrowth}
          trendUp={parseFloat(stats.ordersGrowth) >= 0}
          bgColor="bg-blue-50"
        />
        <KPICard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          bgColor="bg-purple-50"
        />
        <KPICard
          title="Avg Order Value"
          value={`Rp ${stats.averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          bgColor="bg-orange-50"
        />
        <KPICard
          title="Today's Revenue"
          value={`Rp ${stats.todayRevenue.toLocaleString('id-ID')}`}
          icon={DollarSign}
          bgColor="bg-emerald-50"
        />
        <KPICard
          title="Active Shifts"
          value={stats.activeShifts}
          icon={Clock}
          bgColor="bg-indigo-50"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue & Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (Rp)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue (Rp)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Product Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-sm font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Today's Revenue</span>
                <span className="text-sm font-bold">Rp {stats.todayRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="text-sm font-bold">{stats.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="text-sm font-bold">Rp {stats.averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Products</span>
                <span className="text-sm font-bold">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Shifts</span>
                <span className="text-sm font-bold">{stats.activeShifts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}