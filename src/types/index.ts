export type CategoryKey = 'kukus' | 'goreng' | 'bakar' | 'lainnya';

export interface Product {
  id: string;
  name: string;
  category: CategoryKey;
  price: number;
  cost?: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  cashierId: string;
  cashierName: string;
  items: CartItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  customerPaid?: number;
  change?: number;
  timestamp: number;
  status?: 'completed' | 'pending' | 'cancelled';
  shiftId?: string;
  cashier?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  isActive?: boolean;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  notes?: string;
  createdBy: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  totalSales?: number;
  status: 'active' | 'closed';
  shiftType?: 'pagi' | 'siang' | 'malam';
}

export interface OperationalCost {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdBy: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  actionType: string;
  details: string;
  date?: string;
  category?: 'product' | 'transaction' | 'user' | 'shift' | 'purchase' | 'operational';
}

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  changeType: 'restock' | 'sale' | 'adjustment';
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  reason: string;
  userName: string;
  timestamp: number;
  date: string;
}