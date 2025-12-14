import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { User, TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react';
import { getStoredUsers } from '@/lib/storage';
import { getStoredShifts, getShiftsByDateRange, getShiftsByCashier } from '@/lib/shiftStorage';
import { getStoredTransactions } from '@/lib/storage';
import { User as UserType, Shift, Transaction } from '@/types';

const SHIFT_COLORS = {
  pagi: '#fbbf24',
  siang: '#f97316',
  malam: '#3b82f6',
};

interface CashierStats {
  cashierName: string;
  totalSales: number;
  transactionCount: number;
  shiftCount: number;
  avgTransactionValue: number;
  shiftBreakdown: { pagi: number; siang: number; malam: number };
}

interface ReportData {
  cashierStats: CashierStats[];
  cashierChartData: { name: string; penjualan: number; transaksi: number }[];
  shiftChartData: { name: string; value: number }[];
  totalSales: number;
  totalTransactions: number;
  totalShifts: number;
}

export default function CashierReports() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedCashier, setSelectedCashier] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const allUsers = getStoredUsers().filter(u => u.role === 'cashier');
    setUsers(allUsers);
    
    // Set default date range (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [selectedCashier, selectedShift, startDate, endDate]);

  const generateReport = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let shifts = getShiftsByDateRange(start, end);
    const transactions = getStoredTransactions();

    // Filter by cashier
    if (selectedCashier !== 'all') {
      shifts = shifts.filter(s => s.cashierId === selectedCashier);
    }

    // Filter by shift type
    if (selectedShift !== 'all') {
      shifts = shifts.filter(s => s.shiftType === selectedShift);
    }

    // Calculate metrics
    const cashierStats: { [key: string]: CashierStats } = {};

    shifts.forEach(shift => {
      if (!cashierStats[shift.cashierId]) {
        cashierStats[shift.cashierId] = {
          cashierName: shift.cashierName,
          totalSales: 0,
          transactionCount: 0,
          shiftCount: 0,
          avgTransactionValue: 0,
          shiftBreakdown: { pagi: 0, siang: 0, malam: 0 },
        };
      }

      const shiftTransactions = transactions.filter(t => t.shiftId === shift.id);
      const shiftSales = shiftTransactions.reduce((sum, t) => sum + t.total, 0);

      cashierStats[shift.cashierId].totalSales += shiftSales;
      cashierStats[shift.cashierId].transactionCount += shiftTransactions.length;
      cashierStats[shift.cashierId].shiftCount += 1;
      cashierStats[shift.cashierId].shiftBreakdown[shift.shiftType] += 1;
    });

    // Calculate average transaction value
    Object.keys(cashierStats).forEach(cashierId => {
      const stats = cashierStats[cashierId];
      stats.avgTransactionValue = stats.transactionCount > 0 
        ? stats.totalSales / stats.transactionCount 
        : 0;
    });

    // Prepare chart data
    const cashierChartData = Object.values(cashierStats).map((stats) => ({
      name: stats.cashierName,
      penjualan: stats.totalSales,
      transaksi: stats.transactionCount,
    }));

    const shiftDistribution = Object.values(cashierStats).reduce(
      (acc, stats) => {
        acc.pagi += stats.shiftBreakdown.pagi;
        acc.siang += stats.shiftBreakdown.siang;
        acc.malam += stats.shiftBreakdown.malam;
        return acc;
      },
      { pagi: 0, siang: 0, malam: 0 }
    );

    const shiftChartData = [
      { name: 'Pagi', value: shiftDistribution.pagi },
      { name: 'Siang', value: shiftDistribution.siang },
      { name: 'Malam', value: shiftDistribution.malam },
    ];

    setReportData({
      cashierStats: Object.values(cashierStats),
      cashierChartData,
      shiftChartData,
      totalSales: Object.values(cashierStats).reduce((sum, s) => sum + s.totalSales, 0),
      totalTransactions: Object.values(cashierStats).reduce((sum, s) => sum + s.transactionCount, 0),
      totalShifts: shifts.length,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kasir</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Shift</SelectItem>
                  <SelectItem value="pagi">Pagi (06:00-14:00)</SelectItem>
                  <SelectItem value="siang">Siang (14:00-22:00)</SelectItem>
                  <SelectItem value="malam">Malam (22:00-06:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Penjualan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  Rp {(reportData.totalSales / 1000).toFixed(0)}k
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.totalShifts} shift
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {reportData.totalTransactions}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rata-rata: Rp {reportData.totalTransactions > 0 
                    ? (reportData.totalSales / reportData.totalTransactions).toFixed(0) 
                    : 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Shift
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {reportData.totalShifts}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.cashierStats.length} kasir aktif
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Performa per Kasir
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.cashierChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.cashierChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                      <Bar dataKey="penjualan" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">Tidak ada data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Distribusi Shift
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.shiftChartData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.shiftChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.shiftChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={Object.values(SHIFT_COLORS)[index]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">Tidak ada data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Detail Performa Kasir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.cashierStats.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Tidak ada data</p>
                ) : (
                  reportData.cashierStats.map((stats, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{stats.cashierName}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">
                              {stats.shiftCount} shift
                            </Badge>
                            <Badge className="bg-yellow-500">
                              Pagi: {stats.shiftBreakdown.pagi}
                            </Badge>
                            <Badge className="bg-orange-500">
                              Siang: {stats.shiftBreakdown.siang}
                            </Badge>
                            <Badge className="bg-blue-500">
                              Malam: {stats.shiftBreakdown.malam}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Penjualan</p>
                          <p className="font-semibold text-green-600">
                            Rp {stats.totalSales.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Transaksi</p>
                          <p className="font-semibold text-blue-600">
                            {stats.transactionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rata-rata Transaksi</p>
                          <p className="font-semibold text-orange-600">
                            Rp {stats.avgTransactionValue.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}