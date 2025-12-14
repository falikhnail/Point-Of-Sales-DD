import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, Download, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/exportUtils';
import { Transaction } from '@/types/reports';
import { KPICard } from '@/components/KPICard';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getStoredTransactions, getStoredOperationalCosts, getStoredPurchases } from '@/lib/storage';
import { getAllActiveShifts } from '@/lib/shiftStorage';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
}

interface OperationalCost {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface PurchaseTransaction {
  id: string;
  date: string;
  supplier: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
}

interface CashflowTransaction {
  id: string;
  date: string;
  time: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  runningBalance: number;
}

const LaporanCashflow = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (dateRange) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { locale: id });
        end = endOfWeek(now, { locale: id });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        start = customStartDate ? startOfDay(customStartDate) : startOfDay(now);
        end = customEndDate ? endOfDay(customEndDate) : endOfDay(now);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    return { start, end };
  };

  // Calculate cashflow data
  const cashflowData = useMemo(() => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    // Load data from localStorage using helper functions
    const transactions: Transaction[] = getStoredTransactions() as Transaction[];
    const operationalCosts: OperationalCost[] = getStoredOperationalCosts() as OperationalCost[];
    const purchases: PurchaseTransaction[] = getStoredPurchases() as PurchaseTransaction[];
    
    // Get active shifts and their initial balance
    const activeShifts = getAllActiveShifts();
    const shiftInitialBalance = activeShifts.reduce((sum, shift) => sum + (shift.startingCash || 0), 0);

    // Calculate opening balance (all transactions before start date)
    const previousTransactions = transactions.filter(t => new Date(t.timestamp) < start);
    const previousOperationalCosts = operationalCosts.filter(c => new Date(c.date) < start);
    const previousPurchases = purchases.filter(p => new Date(p.date) < start);

    const previousIncome = previousTransactions.reduce((sum, t) => sum + t.total, 0);
    const previousExpenses = 
      previousOperationalCosts.reduce((sum, c) => sum + c.amount, 0) +
      previousPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    
    // Add shift initial balance to opening balance
    const openingBalance = previousIncome - previousExpenses + shiftInitialBalance;

    // Filter transactions by date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= start && transactionDate <= end;
    });

    const filteredOperationalCosts = operationalCosts.filter(cost => {
      const costDate = new Date(cost.date);
      return costDate >= start && costDate <= end;
    });

    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= start && purchaseDate <= end;
    });

    // Calculate total income and expenses
    const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalExpenses = 
      filteredOperationalCosts.reduce((sum, c) => sum + c.amount, 0) +
      filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const closingBalance = openingBalance + totalIncome - totalExpenses;

    // Build cashflow history
    const cashflowHistory: CashflowTransaction[] = [];
    let runningBalance = openingBalance;

    // Combine all transactions
    const allTransactions: Array<{
      date: Date;
      type: 'income' | 'expense';
      category: string;
      description: string;
      amount: number;
    }> = [];

    // Add shift initial balance as the first item if there are active shifts
    if (activeShifts.length > 0) {
      activeShifts.forEach(shift => {
        if (shift.startingCash > 0) {
          allTransactions.push({
            date: new Date(shift.startTime),
            type: 'income',
            category: 'Saldo Awal Shift',
            description: `Saldo awal shift ${shift.shiftType || ''} - ${shift.cashierName}`,
            amount: shift.startingCash,
          });
        }
      });
    }

    // Add sales transactions (income)
    filteredTransactions.forEach(t => {
      allTransactions.push({
        date: new Date(t.timestamp),
        type: 'income',
        category: 'Penjualan',
        description: `Transaksi #${t.id.substring(0, 8)}`,
        amount: t.total,
      });
    });

    // Add operational costs (expense)
    filteredOperationalCosts.forEach(c => {
      allTransactions.push({
        date: new Date(c.date),
        type: 'expense',
        category: c.category,
        description: c.description,
        amount: c.amount,
      });
    });

    // Add purchases (expense)
    filteredPurchases.forEach(p => {
      allTransactions.push({
        date: new Date(p.date),
        type: 'expense',
        category: 'Pembelian',
        description: `Pembelian dari ${p.supplier}`,
        amount: p.totalAmount,
      });
    });

    // Sort by date
    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Build history with running balance
    allTransactions.forEach((t, index) => {
      if (t.type === 'income') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }

      cashflowHistory.push({
        id: `cf-${index}`,
        date: format(t.date, 'dd MMM yyyy', { locale: id }),
        time: format(t.date, 'HH:mm', { locale: id }),
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        runningBalance: runningBalance,
      });
    });

    // Prepare daily cashflow chart data
    const dailyCashflowMap: { [key: string]: { income: number; expense: number } } = {};

    allTransactions.forEach(t => {
      const dateKey = format(t.date, 'yyyy-MM-dd');
      if (!dailyCashflowMap[dateKey]) {
        dailyCashflowMap[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyCashflowMap[dateKey].income += t.amount;
      } else {
        dailyCashflowMap[dateKey].expense += t.amount;
      }
    });

    const dailyChartData = Object.entries(dailyCashflowMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd MMM', { locale: id }),
        pemasukan: data.income,
        pengeluaran: data.expense,
        netCashflow: data.income - data.expense,
      }));

    // Prepare trend line chart data
    const trendChartData = Object.entries(dailyCashflowMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd MMM', { locale: id }),
        cashflow: data.income - data.expense,
      }));

    setIsLoading(false);

    return {
      openingBalance,
      totalIncome,
      totalExpenses,
      closingBalance,
      cashflowHistory,
      dailyChartData,
      trendChartData,
      shiftInitialBalance,
    };
  }, [dateRange, customStartDate, customEndDate]);

  // Export to PDF
  const handleExportPDF = () => {
    const { start, end } = getDateRange();
    const periodText = `${format(start, 'dd MMMM yyyy', { locale: id })} - ${format(end, 'dd MMMM yyyy', { locale: id })}`;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Laporan Cashflow', 14, 20);
    doc.setFontSize(12);
    doc.text('Dimsum Mpok Rani', 14, 28);
    
    // Period
    doc.setFontSize(10);
    doc.text(`Periode: ${periodText}`, 14, 36);
    doc.text(`Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 42);

    // Summary
    let yPos = 52;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Cashflow', 14, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Saldo Awal Shift Kasir: ${formatCurrency(cashflowData.shiftInitialBalance)}`, 14, yPos);
    yPos += 6;
    doc.text(`Saldo Awal: ${formatCurrency(cashflowData.openingBalance)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pemasukan: ${formatCurrency(cashflowData.totalIncome)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pengeluaran: ${formatCurrency(cashflowData.totalExpenses)}`, 14, yPos);
    yPos += 6;
    doc.text(`Saldo Akhir: ${formatCurrency(cashflowData.closingBalance)}`, 14, yPos);
    yPos += 10;

    // Transaction History Table
    if (cashflowData.cashflowHistory.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Riwayat Kas', 14, yPos);
      yPos += 6;

      const historyData = cashflowData.cashflowHistory.map(item => [
        `${item.date} ${item.time}`,
        item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        item.category,
        item.description,
        formatCurrency(item.amount),
        formatCurrency(item.runningBalance),
      ]);

      autoTable(doc, {
        head: [['Tanggal/Waktu', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Saldo']],
        body: historyData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [249, 115, 22] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
        },
      });
    }

    doc.save(`Laporan_Cashflow_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      { Metrik: 'Saldo Awal Shift Kasir', Nilai: cashflowData.shiftInitialBalance },
      { Metrik: 'Saldo Awal', Nilai: cashflowData.openingBalance },
      { Metrik: 'Total Pemasukan', Nilai: cashflowData.totalIncome },
      { Metrik: 'Total Pengeluaran', Nilai: cashflowData.totalExpenses },
      { Metrik: 'Saldo Akhir', Nilai: cashflowData.closingBalance },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Transaction History
    const historyData = cashflowData.cashflowHistory.map(item => ({
      Tanggal: item.date,
      Waktu: item.time,
      Tipe: item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: item.category,
      Deskripsi: item.description,
      Jumlah: item.amount,
      'Saldo Berjalan': item.runningBalance,
    }));
    const historySheet = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, historySheet, 'Riwayat Kas');

    XLSX.writeFile(workbook, `Laporan_Cashflow_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Cashflow</h1>
          <p className="text-gray-500 mt-1">
            Periode: {format(getDateRange().start, 'dd MMM yyyy', { locale: id })} - {format(getDateRange().end, 'dd MMM yyyy', { locale: id })}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={dateRange} onValueChange={(value: 'today' | 'week' | 'month' | 'custom') => setDateRange(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !customStartDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'PPP', { locale: id }) : 'Tanggal Mulai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !customEndDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'PPP', { locale: id }) : 'Tanggal Akhir'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </>
              )}

              <div className="ml-auto flex gap-2">
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Saldo Awal"
            value={formatCurrency(cashflowData.openingBalance)}
            icon={Wallet}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
          />
          <KPICard
            title="Total Pemasukan"
            value={formatCurrency(cashflowData.totalIncome)}
            icon={ArrowUpCircle}
            iconColor="text-green-600"
            bgColor="bg-green-50"
          />
          <KPICard
            title="Total Pengeluaran"
            value={formatCurrency(cashflowData.totalExpenses)}
            icon={ArrowDownCircle}
            iconColor="text-red-600"
            bgColor="bg-red-50"
          />
          <KPICard
            title="Saldo Akhir"
            value={formatCurrency(cashflowData.closingBalance)}
            icon={TrendingUp}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expense Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashflowData.dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="pemasukan" fill="#10b981" name="Pemasukan" />
                  <Bar dataKey="pengeluaran" fill="#ef4444" name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cashflow Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashflowData.trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="cashflow" stroke="#8b5cf6" strokeWidth={2} name="Net Cashflow" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kas</CardTitle>
          </CardHeader>
          <CardContent>
            {cashflowData.cashflowHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal/Waktu</TableHead>
                      <TableHead>Tipe Transaksi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Saldo Berjalan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashflowData.cashflowHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.date} {item.time}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              item.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            )}
                          >
                            {item.type === 'income' ? (
                              <>
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Pemasukan
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Pengeluaran
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Tidak ada transaksi pada periode ini</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LaporanCashflow;