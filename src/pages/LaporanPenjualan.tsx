import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, Printer, FileSpreadsheet, TrendingUp, ShoppingCart, DollarSign, CreditCard, Smartphone, Building2, Wallet, ArrowUpDown, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getStoredTransactions } from '@/lib/storage';
import { Transaction } from '@/types';

type SortField = 'date' | 'total' | 'paymentMethod' | 'cashierName';
type SortOrder = 'asc' | 'desc';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
const PAYMENT_COLORS = {
  'Cash': '#10b981',
  'QRIS': '#3b82f6',
  'E-Wallet': '#a855f7',
  'Transfer Bank': '#f97316'
};

export default function LaporanPenjualan() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Load transactions from centralized storage utility
  const allTransactions: Transaction[] = useMemo(() => {
    try {
      return getStoredTransactions() as Transaction[];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }, []);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date || transaction.timestamp);
      if (dateFrom && transactionDate < dateFrom) return false;
      if (dateTo && transactionDate > dateTo) return false;
      return true;
    });
  }, [allTransactions, dateFrom, dateTo]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      let aValue: string | number = a[sortField] || '';
      let bValue: string | number = b[sortField] || '';

      if (sortField === 'date') {
        aValue = new Date(a.date || a.timestamp).getTime();
        bValue = new Date(b.date || b.timestamp).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredTransactions, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedTransactions, currentPage, rowsPerPage]);

  // Calculate KPIs
  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Payment method breakdown
  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      'Cash': { count: 0, total: 0 },
      'QRIS': { count: 0, total: 0 },
      'E-Wallet': { count: 0, total: 0 },
      'Transfer Bank': { count: 0, total: 0 },
    };

    filteredTransactions.forEach((t) => {
      const method = t.paymentMethod || 'Cash';
      if (method in stats) {
        stats[method].count += 1;
        stats[method].total += t.total;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.total,
      percentage: totalSales > 0 ? (data.total / totalSales) * 100 : 0,
    }));
  }, [filteredTransactions, totalSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { quantity: number; revenue: number }>();

    filteredTransactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          const existing = productMap.get(item.name) || { quantity: 0, revenue: 0 };
          productMap.set(item.name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.price * item.quantity,
          });
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredTransactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Laporan Penjualan', 14, 20);
    
    // Date range
    doc.setFontSize(11);
    const dateRange = `Periode: ${dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: id }) : 'Semua'} - ${dateTo ? format(dateTo, 'dd MMM yyyy', { locale: id }) : 'Semua'}`;
    doc.text(dateRange, 14, 28);
    
    // Summary
    doc.setFontSize(10);
    doc.text(`Total Penjualan: Rp ${totalSales.toLocaleString('id-ID')}`, 14, 36);
    doc.text(`Jumlah Transaksi: ${totalTransactions}`, 14, 42);
    doc.text(`Rata-rata Transaksi: Rp ${averageTransaction.toLocaleString('id-ID')}`, 14, 48);
    
    // Payment methods
    let yPos = 56;
    doc.text('Metode Pembayaran:', 14, yPos);
    paymentMethodStats.forEach((method) => {
      yPos += 6;
      doc.text(`${method.name}: ${method.count} transaksi - Rp ${method.value.toLocaleString('id-ID')} (${method.percentage.toFixed(1)}%)`, 20, yPos);
    });
    
    // Table
    autoTable(doc, {
      startY: yPos + 10,
      head: [['Tanggal', 'Total', 'Metode', 'Kasir']],
      body: sortedTransactions.map((t) => [
        format(new Date(t.date || t.timestamp), 'dd/MM/yyyy HH:mm'),
        `Rp ${t.total.toLocaleString('id-ID')}`,
        t.paymentMethod || 'Cash',
        t.cashierName || 'Unknown',
      ]),
    });
    
    doc.save('laporan-penjualan.pdf');
  };

  const exportToExcel = () => {
    const data = sortedTransactions.map((t) => ({
      Tanggal: format(new Date(t.date || t.timestamp), 'dd/MM/yyyy HH:mm'),
      Total: t.total,
      'Metode Pembayaran': t.paymentMethod || 'Cash',
      Kasir: t.cashierName || 'Unknown',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');
    XLSX.writeFile(wb, 'laporan-penjualan.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'QRIS':
        return <QrCode className="h-4 w-4 text-blue-600" />;
      case 'E-Wallet':
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      case 'Transfer Bank':
        return <Building2 className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {averageTransaction.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {paymentMethodStats.map((method) => (
          <Card key={method.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{method.name}</CardTitle>
              {getPaymentMethodIcon(method.name)}
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">Rp {method.value.toLocaleString('id-ID')}</div>
              <p className="text-xs text-gray-500 mt-1">
                {method.count} transaksi ({method.percentage.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'quantity') return [value, 'Terjual'];
                      if (name === 'revenue') return [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" fill="#f97316" name="Quantity" />
                  <Bar dataKey="revenue" fill="#fb923c" name="Revenue (Rp)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Tidak ada data produk
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodStats.some((m) => m.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodStats.filter((m) => m.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name as keyof typeof PAYMENT_COLORS] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Tidak ada data pembayaran
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethodStats.some((m) => m.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethodStats.filter((m) => m.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'Jumlah Transaksi') return [value, name];
                    return [`Rp ${value.toLocaleString('id-ID')}`, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Jumlah Transaksi" />
                <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Total Nilai (Rp)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Tidak ada data pembayaran
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead className="text-right">Jumlah Transaksi</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead className="text-right">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethodStats.map((method) => (
                  <TableRow key={method.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(method.name)}
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{method.count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {method.value.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{method.percentage.toFixed(1)}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detail Transaksi</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start"
                          onClick={() => handleSort('date')}
                        >
                          Tanggal
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start"
                          onClick={() => handleSort('total')}
                        >
                          Total
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start"
                          onClick={() => handleSort('paymentMethod')}
                        >
                          Metode Pembayaran
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start"
                          onClick={() => handleSort('cashierName')}
                        >
                          Kasir
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date || transaction.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}</TableCell>
                        <TableCell className="font-medium">Rp {transaction.total.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.paymentMethod || 'Cash')}
                            {transaction.paymentMethod || 'Cash'}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.cashierName || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data transaksi untuk periode yang dipilih
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}