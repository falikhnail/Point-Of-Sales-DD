import { useState, useEffect } from "react";
import { ReportsLayout } from "@/components/ReportsLayout";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Package, ShoppingBag, TrendingUp, Users, Filter } from "lucide-react";
import { DateRange } from "@/types/reports";
import { format, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, exportToPDF, exportToExcel, printReport } from "@/utils/exportUtils";
import { getStoredPurchases } from "@/lib/storage";

// Interface yang SAMA PERSIS dengan PurchaseManagement.tsx
interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  supplier: string;
  purchaseDate: string; // Format: yyyy-MM-dd
  items: PurchaseItem[];
  subtotal: number;
  shippingCost: number;
  otherCosts: number;
  totalCost: number;
  createdBy: string;
  createdAt: string; // ISO timestamp
}

interface PurchaseReportData {
  totalPurchases: number;
  totalTransactions: number;
  totalSuppliers: number;
  averagePurchase: number;
  purchases: Purchase[];
  supplierSummary: Array<{
    supplier: string;
    totalPurchases: number;
    transactionCount: number;
  }>;
  itemSummary: Array<{
    itemName: string;
    totalQuantity: number;
    totalValue: number;
    averageCostPrice: number;
  }>;
  chartData: Array<{
    date: string;
    pembelian: number;
  }>;
  topSuppliers: Array<{
    name: string;
    value: number;
  }>;
}

export default function LaporanPembelian() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [filterItem, setFilterItem] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [reportData, setReportData] = useState<PurchaseReportData>({
    totalPurchases: 0,
    totalTransactions: 0,
    totalSuppliers: 0,
    averagePurchase: 0,
    purchases: [],
    supplierSummary: [],
    itemSummary: [],
    chartData: [],
    topSuppliers: [],
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange, filterSupplier, filterItem]);

  const loadReportData = () => {
    console.log("=== DEBUG: Loading Purchase Report Data ===");
    
    // Load purchases menggunakan getStoredPurchases() dari centralized storage
    const rawPurchases = getStoredPurchases();
    console.log("Raw purchases from storage:", rawPurchases);
    console.log("Number of raw purchases:", rawPurchases.length);
    
    // Cast ke tipe Purchase yang benar
    const purchases: Purchase[] = rawPurchases as Purchase[];
    console.log("Typed purchases:", purchases);
    
    if (purchases.length === 0) {
      console.warn("⚠️ No purchases found in storage!");
      console.log("Storage key used: dimsum_purchases");
      console.log("Please check if data is being saved correctly in PurchaseManagement");
    }

    // Filter berdasarkan date range - GUNAKAN purchaseDate (bukan createdAt atau timestamp)
    let filteredPurchases = purchases.filter((p: Purchase) => {
      try {
        const purchaseDate = new Date(p.purchaseDate);
        const isInRange = isWithinInterval(purchaseDate, {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
        console.log(`Purchase ${p.id}: date=${p.purchaseDate}, inRange=${isInRange}`);
        return isInRange;
      } catch (error) {
        console.error(`Error parsing date for purchase ${p.id}:`, error);
        return false;
      }
    });

    console.log(`Filtered by date range: ${filteredPurchases.length} purchases`);

    // Apply supplier filter
    if (filterSupplier !== "all") {
      const beforeFilter = filteredPurchases.length;
      filteredPurchases = filteredPurchases.filter(p => p.supplier === filterSupplier);
      console.log(`Filtered by supplier '${filterSupplier}': ${beforeFilter} -> ${filteredPurchases.length}`);
    }

    // Apply item filter
    if (filterItem !== "all") {
      const beforeFilter = filteredPurchases.length;
      filteredPurchases = filteredPurchases.filter(p => 
        p.items?.some(item => item.productName === filterItem)
      );
      console.log(`Filtered by item '${filterItem}': ${beforeFilter} -> ${filteredPurchases.length}`);
    }

    console.log("Final filtered purchases:", filteredPurchases.length);

    // Calculate KPIs
    const totalPurchases = filteredPurchases.reduce(
      (sum: number, p: Purchase) => sum + (p.totalCost || 0),
      0
    );
    const totalTransactions = filteredPurchases.length;
    const suppliers = new Set(filteredPurchases.map(p => p.supplier));
    const totalSuppliers = suppliers.size;
    const averagePurchase = totalTransactions > 0 ? totalPurchases / totalTransactions : 0;

    console.log("=== KPI Summary ===");
    console.log("Total Purchases:", formatCurrency(totalPurchases));
    console.log("Total Transactions:", totalTransactions);
    console.log("Total Suppliers:", totalSuppliers);
    console.log("Average Purchase:", formatCurrency(averagePurchase));

    // Group by date for trend chart
    const purchasesByDate: { [key: string]: number } = {};
    filteredPurchases.forEach((p: Purchase) => {
      try {
        const date = format(new Date(p.purchaseDate), "dd MMM", { locale: id });
        purchasesByDate[date] = (purchasesByDate[date] || 0) + p.totalCost;
      } catch (error) {
        console.error(`Error formatting date for purchase ${p.id}:`, error);
      }
    });

    const chartData = Object.entries(purchasesByDate)
      .map(([date, amount]) => ({
        date,
        pembelian: amount,
      }))
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    console.log("Chart data points:", chartData.length);

    // Supplier summary
    const supplierMap: { [key: string]: { total: number; count: number } } = {};
    filteredPurchases.forEach((p: Purchase) => {
      if (!supplierMap[p.supplier]) {
        supplierMap[p.supplier] = { total: 0, count: 0 };
      }
      supplierMap[p.supplier].total += p.totalCost;
      supplierMap[p.supplier].count += 1;
    });

    const supplierSummary = Object.entries(supplierMap)
      .map(([supplier, data]) => ({
        supplier,
        totalPurchases: data.total,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.totalPurchases - a.totalPurchases);

    console.log("Supplier summary entries:", supplierSummary.length);

    // Top 5 suppliers for chart
    const topSuppliers = supplierSummary.slice(0, 5).map(s => ({
      name: s.supplier,
      value: s.totalPurchases,
    }));

    console.log("Top 5 suppliers:", topSuppliers.map(s => s.name).join(", "));

    // Item summary
    const itemMap: { [key: string]: { qty: number; total: number; count: number } } = {};
    filteredPurchases.forEach((p: Purchase) => {
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach(item => {
          if (!itemMap[item.productName]) {
            itemMap[item.productName] = { qty: 0, total: 0, count: 0 };
          }
          itemMap[item.productName].qty += item.quantity;
          itemMap[item.productName].total += item.subtotal;
          itemMap[item.productName].count += 1;
        });
      }
    });

    const itemSummary = Object.entries(itemMap)
      .map(([itemName, data]) => ({
        itemName,
        totalQuantity: data.qty,
        totalValue: data.total,
        averageCostPrice: data.qty > 0 ? data.total / data.qty : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    console.log("Item summary entries:", itemSummary.length);

    // Update state dengan data yang sudah diproses
    setReportData({
      totalPurchases,
      totalTransactions,
      totalSuppliers,
      averagePurchase,
      purchases: filteredPurchases,
      supplierSummary,
      itemSummary,
      chartData,
      topSuppliers,
    });

    console.log("=== Report Data Updated Successfully ===");
  };

  // Get unique suppliers and items for filters
  const allPurchases: Purchase[] = getStoredPurchases() as Purchase[];
  const uniqueSuppliers = Array.from(new Set(allPurchases.map(p => p.supplier))).sort();
  const uniqueItems = Array.from(new Set(
    allPurchases.flatMap(p => p.items?.map(item => item.productName) || [])
  )).sort();

  console.log("Available filters - Suppliers:", uniqueSuppliers.length, "Items:", uniqueItems.length);

  // Pagination
  const totalPages = Math.ceil(reportData.purchases.length / itemsPerPage);
  const paginatedPurchases = reportData.purchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSupplier, filterItem, dateRange]);

  const handleExportPDF = () => {
    const headers = ["Tanggal", "ID Pembelian", "Supplier", "Item", "Qty", "Harga Modal", "Subtotal", "Total Biaya"];
    const data: (string | number)[][] = [];
    
    reportData.purchases.forEach((p: Purchase) => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((item, index) => {
          data.push([
            index === 0 ? format(new Date(p.purchaseDate), "dd/MM/yyyy", { locale: id }) : "",
            index === 0 ? p.id : "",
            index === 0 ? p.supplier : "",
            item.productName,
            item.quantity,
            formatCurrency(item.costPrice),
            formatCurrency(item.subtotal),
            index === 0 ? formatCurrency(p.totalCost) : "",
          ]);
        });
      }
    });

    exportToPDF("Laporan Pembelian", headers, data, "laporan-pembelian.pdf");
  };

  const handleExportExcel = () => {
    const data: Record<string, string | number>[] = [];
    
    reportData.purchases.forEach((p: Purchase) => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((item) => {
          data.push({
            Tanggal: format(new Date(p.purchaseDate), "dd/MM/yyyy", { locale: id }),
            "ID Pembelian": p.id,
            Supplier: p.supplier,
            Item: item.productName,
            Qty: item.quantity,
            "Harga Modal": item.costPrice,
            Subtotal: item.subtotal,
            "Total Biaya": p.totalCost,
            "Dibuat Oleh": p.createdBy,
          });
        });
      }
    });

    exportToExcel(data, "laporan-pembelian.xlsx", "Pembelian");
  };

  const handlePrint = () => {
    printReport("report-content");
  };

  return (
    <ReportsLayout
      title="Laporan Pembelian"
      onDateRangeChange={setDateRange}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      onPrint={handlePrint}
    >
      <div id="report-content" className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Supplier</label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Supplier</SelectItem>
                  {uniqueSuppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Item</label>
              <Select value={filterItem} onValueChange={setFilterItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Item</SelectItem>
                  {uniqueItems.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Data Status Info */}
        {reportData.purchases.length === 0 && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">Tidak Ada Data Pembelian</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Belum ada transaksi pembelian yang tercatat untuk periode dan filter yang dipilih.
                  Silakan tambahkan data pembelian melalui menu <strong>Manajemen Pembelian</strong>.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Pembelian"
            value={formatCurrency(reportData.totalPurchases)}
            icon={ShoppingBag}
          />
          <KPICard
            title="Jumlah Transaksi"
            value={reportData.totalTransactions}
            icon={Package}
          />
          <KPICard
            title="Jumlah Supplier"
            value={reportData.totalSuppliers}
            icon={Users}
          />
          <KPICard
            title="Rata-rata Pembelian"
            value={formatCurrency(reportData.averagePurchase)}
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        {reportData.purchases.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trend Pembelian</h3>
              {reportData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pembelian"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Pembelian"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </Card>

            {/* Top Suppliers */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top 5 Supplier</h3>
              {reportData.topSuppliers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.topSuppliers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="value" fill="#f97316" name="Total Pembelian" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Supplier Summary */}
        {reportData.supplierSummary.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ringkasan per Supplier</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Pembelian</TableHead>
                    <TableHead className="text-right">Jumlah Transaksi</TableHead>
                    <TableHead className="text-right">Rata-rata per Transaksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.supplierSummary.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{supplier.supplier}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(supplier.totalPurchases)}
                      </TableCell>
                      <TableCell className="text-right">{supplier.transactionCount}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(supplier.totalPurchases / supplier.transactionCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Item Summary */}
        {reportData.itemSummary.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ringkasan per Item</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                    <TableHead className="text-right">Harga Modal Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.itemSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.totalValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.averageCostPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Detailed Purchases Table */}
        {reportData.purchases.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detail Transaksi Pembelian</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>ID Pembelian</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga Modal</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Total Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        Tidak ada data untuk ditampilkan
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPurchases.map((purchase: Purchase) => {
                      const itemCount = purchase.items?.length || 0;
                      if (itemCount === 0) {
                        return (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              {format(new Date(purchase.purchaseDate), "dd MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell>{purchase.id}</TableCell>
                            <TableCell>{purchase.supplier}</TableCell>
                            <TableCell colSpan={4} className="text-center text-gray-500">
                              Tidak ada item
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(purchase.totalCost)}
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return purchase.items.map((item, itemIndex) => (
                        <TableRow key={`${purchase.id}-${itemIndex}`}>
                          {itemIndex === 0 ? (
                            <>
                              <TableCell rowSpan={itemCount}>
                                {format(new Date(purchase.purchaseDate), "dd MMM yyyy", {
                                  locale: id,
                                })}
                              </TableCell>
                              <TableCell rowSpan={itemCount}>
                                {purchase.id}
                              </TableCell>
                              <TableCell rowSpan={itemCount}>{purchase.supplier}</TableCell>
                            </>
                          ) : null}
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.costPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                          {itemIndex === 0 ? (
                            <TableCell rowSpan={itemCount} className="text-right font-bold text-green-600">
                              {formatCurrency(purchase.totalCost)}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ));
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, reportData.purchases.length)} dari{" "}
                  {reportData.purchases.length} transaksi
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </ReportsLayout>
  );
}