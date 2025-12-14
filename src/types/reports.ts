export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
}

export interface ReportFilter {
  dateRange: DateRange;
  category?: string;
  status?: string;
}

export interface Transaction {
  id: string;
  timestamp: number;
  total: number;
  cashier?: string;
  items?: TransactionItem[];
  paymentMethod?: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cost?: number;
}

export interface ChartDataPoint {
  date: string;
  penjualan?: number;
  pembelian?: number;
  revenue?: number;
  expense?: number;
  profit?: number;
  [key: string]: string | number | undefined;
}

export interface SalesReportData {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  transactions: Transaction[];
  chartData: ChartDataPoint[];
}

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  timestamp: number;
  total: number;
  supplier: string;
  status: 'lunas' | 'pending' | 'kredit';
  items: PurchaseItem[];
  invoiceNumber?: string;
}

export interface SupplierSummary {
  supplier: string;
  totalPurchases: number;
  transactionCount: number;
}

export interface ItemSummary {
  itemName: string;
  totalQuantity: number;
  totalValue: number;
  averageCostPrice: number;
}

export interface PurchaseReportData {
  totalPurchases: number;
  totalTransactions: number;
  totalSuppliers: number;
  averagePurchase: number;
  purchases: Purchase[];
  supplierSummary: SupplierSummary[];
  itemSummary: ItemSummary[];
  chartData: ChartDataPoint[];
  topSuppliers: ChartDataPoint[];
}

export interface StockItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
}

export interface StockReportData {
  totalItems: number;
  lowStockItems: number;
  inventoryValue: number;
  stockMovements: StockItem[];
  chartData: ChartDataPoint[];
}

export interface ProfitBreakdown {
  category: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitLossReportData {
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  chartData: ChartDataPoint[];
  breakdown: ProfitBreakdown[];
}

export interface ProductProfit {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface ProductProfitReportData {
  topProducts: ProductProfit[];
  totalProfit: number;
  chartData: ChartDataPoint[];
  productDetails: ProductProfit[];
}

export interface CashflowTransaction {
  id: string;
  timestamp: number;
  type: 'in' | 'out';
  amount: number;
  description: string;
}

export interface CashflowReportData {
  cashIn: number;
  cashOut: number;
  balance: number;
  transactions: CashflowTransaction[];
  chartData: ChartDataPoint[];
}