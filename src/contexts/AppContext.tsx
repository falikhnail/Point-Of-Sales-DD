import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, StockHistory, Transaction } from '@/types';
import { getStoredProducts, setStoredProducts, getStoredTransactions } from '@/lib/storage';
import { getDataByBranch } from '@/lib/branchStorage';
import { useBranch } from './BranchContext';

interface AppContextType {
  products: Product[];
  transactions: Transaction[];
  stockHistory: StockHistory[];
  refreshProducts: () => void;
  refreshTransactions: () => void;
  updateProductStock: (productId: string, newStock: number, reason: string, userName: string, changeType: 'restock' | 'sale' | 'adjustment') => void;
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
  getProductStockHistory: (productId: string) => StockHistory[];
  getProductsByBranch: () => Product[];
  getTransactionsByBranch: () => Transaction[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STOCK_HISTORY_KEY = 'dimsum_stock_history';

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const { currentBranch } = useBranch();

  const refreshProducts = useCallback(() => {
    const loadedProducts = getStoredProducts();
    setProducts(loadedProducts);
  }, []);

  const refreshTransactions = useCallback(() => {
    const loadedTransactions = getStoredTransactions() as Transaction[];
    setTransactions(loadedTransactions);
  }, []);

  const loadStockHistory = useCallback(() => {
    const stored = localStorage.getItem(STOCK_HISTORY_KEY);
    if (stored) {
      try {
        setStockHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading stock history:', error);
        setStockHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    refreshProducts();
    refreshTransactions();
    loadStockHistory();
  }, [refreshProducts, refreshTransactions, loadStockHistory]);

  const saveStockHistory = (history: StockHistory[]) => {
    localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify(history));
    setStockHistory(history);
  };

  const updateProductStock = (
    productId: string,
    newStock: number,
    reason: string,
    userName: string,
    changeType: 'restock' | 'sale' | 'adjustment'
  ) => {
    const currentProducts = getStoredProducts();
    const productIndex = currentProducts.findIndex(p => p.id === productId);
    
    if (productIndex === -1) return;

    const product = currentProducts[productIndex];
    const oldStock = product.stock || 0;
    const quantityChanged = newStock - oldStock;

    // Update product stock
    currentProducts[productIndex] = {
      ...product,
      stock: newStock
    };
    setStoredProducts(currentProducts);
    setProducts(currentProducts);

    // Add to stock history
    const historyEntry: StockHistory = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      changeType,
      quantityBefore: oldStock,
      quantityAfter: newStock,
      quantityChanged,
      reason,
      userName,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      branchId: product.branchId
    };

    const updatedHistory = [historyEntry, ...stockHistory];
    saveStockHistory(updatedHistory);
  };

  // Filter products by current branch
  const getProductsByBranch = () => {
    if (!currentBranch) return products;
    return products.filter(p => p.branchId === currentBranch.id);
  };

  // Filter transactions by current branch
  const getTransactionsByBranch = () => {
    if (!currentBranch) return transactions;
    return transactions.filter(t => t.branchId === currentBranch.id);
  };

  const getLowStockProducts = () => {
    const branchProducts = getProductsByBranch();
    return branchProducts.filter(p => {
      const stock = p.stock || 0;
      return stock > 0 && stock < 10;
    });
  };

  const getOutOfStockProducts = () => {
    const branchProducts = getProductsByBranch();
    return branchProducts.filter(p => (p.stock || 0) === 0);
  };

  const getProductStockHistory = (productId: string) => {
    return stockHistory.filter(h => h.productId === productId);
  };

  const value: AppContextType = {
    products,
    transactions,
    stockHistory,
    refreshProducts,
    refreshTransactions,
    updateProductStock,
    getLowStockProducts,
    getOutOfStockProducts,
    getProductStockHistory,
    getProductsByBranch,
    getTransactionsByBranch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}