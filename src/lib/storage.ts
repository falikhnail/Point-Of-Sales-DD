// Centralized localStorage utility with standardized keys

import { Product } from '@/types';
import { defaultProducts } from '@/data/initialData';

export const STORAGE_KEYS = {
  USERS: 'dimsum_users',
  PRODUCTS: 'dimsum_products',
  TRANSACTIONS: 'dimsum_transactions',
  PURCHASES: 'dimsum_purchases',
  SHIFTS: 'dimsum_shifts',
  OPERATIONAL_COSTS: 'dimsum_operational_costs',
  ACTIVITY_LOGS: 'dimsum_activity_logs',
  CURRENT_USER: 'dimsum_current_user',
} as const;

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Generic storage functions
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

// Helper function to normalize product categories
const normalizeProduct = (product: Product): Product => {
  const validCategories = ['kukus', 'goreng', 'bakar', 'lainnya'];
  return {
    ...product,
    category: validCategories.includes(product.category) ? product.category : 'lainnya',
  };
};

// Export normalizeCategory function for use in components
// This function ensures the category is always a string and handles edge cases
export const normalizeCategory = (category: unknown): string => {
  // Handle null or undefined
  if (category === null || category === undefined) {
    return 'Uncategorized';
  }
  
  // Handle arrays - join them with commas
  if (Array.isArray(category)) {
    return category.map(c => String(c)).join(',');
  }
  
  // Handle objects - convert to string
  if (typeof category === 'object') {
    return 'Uncategorized';
  }
  
  // Convert to string and return
  return String(category);
};

// Specific storage functions
export const getStoredUsers = () => getFromStorage<unknown[]>(STORAGE_KEYS.USERS, []);
export const setStoredUsers = (users: unknown[]) => setToStorage(STORAGE_KEYS.USERS, users);

export const getStoredProducts = (): Product[] => {
  const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  
  // Initialize with default products if empty
  if (products.length === 0) {
    setStoredProducts(defaultProducts);
    return defaultProducts;
  }
  
  // Normalize all products to ensure valid categories
  return products.map(normalizeProduct);
};

export const setStoredProducts = (products: unknown[]) => setToStorage(STORAGE_KEYS.PRODUCTS, products);

export const getStoredTransactions = () => getFromStorage<unknown[]>(STORAGE_KEYS.TRANSACTIONS, []);
export const setStoredTransactions = (transactions: unknown[]) => setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

// Transaction management function
export const saveTransaction = (transaction: unknown): void => {
  const transactions = getStoredTransactions();
  transactions.push(transaction);
  setStoredTransactions(transactions);
};

export const getStoredPurchases = () => getFromStorage<unknown[]>(STORAGE_KEYS.PURCHASES, []);
export const setStoredPurchases = (purchases: unknown[]) => setToStorage(STORAGE_KEYS.PURCHASES, purchases);

export const getStoredShifts = () => getFromStorage<unknown[]>(STORAGE_KEYS.SHIFTS, []);
export const setStoredShifts = (shifts: unknown[]) => setToStorage(STORAGE_KEYS.SHIFTS, shifts);

export const getStoredOperationalCosts = () => getFromStorage<unknown[]>(STORAGE_KEYS.OPERATIONAL_COSTS, []);
export const setStoredOperationalCosts = (costs: unknown[]) => setToStorage(STORAGE_KEYS.OPERATIONAL_COSTS, costs);

// Operational cost management functions
export const saveOperationalCost = (cost: unknown): void => {
  const costs = getStoredOperationalCosts();
  costs.push(cost);
  setStoredOperationalCosts(costs);
};

export const updateOperationalCost = (id: string, updatedCost: unknown): void => {
  const costs = getStoredOperationalCosts() as Array<{ id: string }>;
  const index = costs.findIndex(cost => cost.id === id);
  if (index !== -1) {
    costs[index] = updatedCost as { id: string };
    setStoredOperationalCosts(costs);
  }
};

// Delete operational cost by id
export const deleteOperationalCost = (id: string): void => {
  const costs = getStoredOperationalCosts() as Array<{ id: string }>;
  const updatedCosts = costs.filter(cost => cost.id !== id);
  setStoredOperationalCosts(updatedCosts);
};

// Get operational costs by date range
export const getOperationalCostsByDateRange = (startDate: Date, endDate: Date): unknown[] => {
  const costs = getStoredOperationalCosts() as Array<{ timestamp: number }>;
  const startTimestamp = startDate.setHours(0, 0, 0, 0);
  const endTimestamp = endDate.setHours(23, 59, 59, 999);
  
  return costs.filter(cost => 
    cost.timestamp >= startTimestamp && cost.timestamp <= endTimestamp
  );
};

export const getStoredActivityLogs = () => getFromStorage<unknown[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
export const setStoredActivityLogs = (logs: unknown[]) => setToStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);

export const getCurrentUser = () => getFromStorage<unknown>(STORAGE_KEYS.CURRENT_USER, null);
export const setCurrentUser = (user: unknown) => setToStorage(STORAGE_KEYS.CURRENT_USER, user);
export const clearCurrentUser = () => removeFromStorage(STORAGE_KEYS.CURRENT_USER);

// Migration function to move data from old keys to new keys
export const migrateStorageKeys = () => {
  const migrations = [
    { old: 'users', new: STORAGE_KEYS.USERS },
    { old: 'products', new: STORAGE_KEYS.PRODUCTS },
    { old: 'transactions', new: STORAGE_KEYS.TRANSACTIONS },
    { old: 'purchases', new: STORAGE_KEYS.PURCHASES },
    { old: 'shifts', new: STORAGE_KEYS.SHIFTS },
    { old: 'operationalCosts', new: STORAGE_KEYS.OPERATIONAL_COSTS },
    { old: 'activityLogs', new: STORAGE_KEYS.ACTIVITY_LOGS },
    { old: 'currentUser', new: STORAGE_KEYS.CURRENT_USER },
  ];

  migrations.forEach(({ old, new: newKey }) => {
    const oldData = localStorage.getItem(old);
    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(old);
      console.log(`Migrated ${old} to ${newKey}`);
    }
  });
};

// Alias for backward compatibility
export const migrateLocalStorage = migrateStorageKeys;