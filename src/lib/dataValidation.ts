import { Product, Transaction, TransactionItem, User } from '../types';

/**
 * Mendapatkan nama produk yang valid
 * Prioritas: product.name -> item.name -> fallback dengan ID
 */
export function getValidProductName(item: TransactionItem, products: Product[]): { name: string; warning?: string } {
  // Cari produk berdasarkan productId
  const product = products.find(p => p.id === item.productId);
  
  // Prioritas 1: Nama dari database produk
  if (product?.name && product.name.trim() !== '') {
    return { name: product.name.trim() };
  }
  
  // Prioritas 2: Nama dari item transaksi
  if (item.name && typeof item.name === 'string' && item.name.trim() !== '' && item.name.toLowerCase() !== 'undefined') {
    return {
      name: item.name.trim(),
      warning: 'Produk tidak ditemukan di database, menggunakan nama dari transaksi'
    };
  }
  
  // Prioritas 3: Fallback dengan ID produk jika ada
  if (item.productId && item.productId.trim() !== '') {
    console.warn(`Product name not found for productId: ${item.productId}, using fallback`);
    return {
      name: `Produk #${item.productId}`,
      warning: 'Nama produk tidak tersedia'
    };
  }
  
  // Fallback terakhir
  console.warn('Product name and ID not found, using generic fallback');
  return {
    name: 'Produk Tidak Diketahui',
    warning: 'Nama produk tidak tersedia'
  };
}

/**
 * Mendapatkan harga beli/COGS yang valid
 * Prioritas: product.costPrice -> product.cost -> estimasi 60% dari harga jual
 */
export function getValidCostPrice(item: TransactionItem, products: Product[]): { costPrice: number; isEstimated: boolean } {
  const product = products.find(p => p.id === item.productId);
  
  // Prioritas 1: costPrice dari database produk
  if (product?.costPrice !== undefined && product.costPrice !== null && !isNaN(product.costPrice) && product.costPrice > 0) {
    return { costPrice: product.costPrice, isEstimated: false };
  }
  
  // Prioritas 2: cost dari database produk (untuk backward compatibility)
  if (product?.cost !== undefined && product.cost !== null && !isNaN(product.cost) && product.cost > 0) {
    console.warn(`Using product.cost for productId: ${item.productId}, consider using costPrice instead`);
    return { costPrice: product.cost, isEstimated: false };
  }
  
  // Prioritas 3: Estimasi 60% dari harga jual
  const salePrice = item.price || 0;
  if (salePrice > 0) {
    const estimatedCost = salePrice * 0.6;
    console.warn(`Cost price not found for productId: ${item.productId}, using 60% estimation: ${estimatedCost}`);
    return { costPrice: estimatedCost, isEstimated: true };
  }
  
  // Fallback terakhir: 0
  console.error(`Cannot determine cost price for productId: ${item.productId}, using 0`);
  return { costPrice: 0, isEstimated: true };
}

/**
 * Validasi nama kasir
 */
export function getValidCashierName(
  transaction: Transaction,
  users: User[]
): { name: string; warning?: string } {
  // Cari user berdasarkan cashierId
  if (transaction.cashierId) {
    const user = users.find(u => u.id === transaction.cashierId);
    if (user && user.name) {
      return { name: user.name };
    }
  }
  
  // Gunakan cashierName dari transaksi
  if (transaction.cashierName && transaction.cashierName.trim() !== '') {
    return { name: transaction.cashierName };
  }
  
  // Gunakan cashier field sebagai fallback
  if (transaction.cashier && transaction.cashier.trim() !== '') {
    return { name: transaction.cashier };
  }
  
  // Jika semua gagal, gunakan cashierId
  if (transaction.cashierId) {
    return {
      name: `Kasir #${transaction.cashierId}`,
      warning: 'Nama kasir tidak ditemukan'
    };
  }
  
  return {
    name: 'Kasir Tidak Diketahui',
    warning: 'Data kasir tidak lengkap'
  };
}

/**
 * Validasi timestamp
 */
export function validateTimestamp(timestamp: number | string | undefined): number {
  if (typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    const parsed = parseInt(timestamp);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return Date.now();
}

/**
 * Memvalidasi item transaksi
 */
export function validateTransactionItem(item: TransactionItem): boolean {
  // Validasi productId
  if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
    console.error('Invalid transaction item: productId is missing or invalid', item);
    return false;
  }
  
  // Validasi quantity
  if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || isNaN(item.quantity)) {
    console.error(`Invalid transaction item: quantity is invalid for productId ${item.productId}`, item);
    return false;
  }
  
  // Validasi price
  if (item.price === undefined || item.price === null || typeof item.price !== 'number' || item.price < 0 || isNaN(item.price)) {
    console.error(`Invalid transaction item: price is invalid for productId ${item.productId}`, item);
    return false;
  }
  
  return true;
}

/**
 * Memvalidasi transaksi lengkap
 */
export function validateTransaction(transaction: Transaction): boolean {
  // Validasi ID transaksi
  if (!transaction.id || typeof transaction.id !== 'string' || transaction.id.trim() === '') {
    console.error('Invalid transaction: id is missing or invalid', transaction);
    return false;
  }
  
  // Validasi timestamp
  if (!transaction.timestamp || validateTimestamp(transaction.timestamp) === Date.now()) {
    console.error(`Invalid transaction: timestamp is invalid for transaction ${transaction.id}`);
    return false;
  }
  
  // Validasi items
  if (!Array.isArray(transaction.items) || transaction.items.length === 0) {
    console.error(`Invalid transaction: items array is missing or empty for transaction ${transaction.id}`, transaction);
    return false;
  }
  
  // Validasi setiap item
  const allItemsValid = transaction.items.every(item => validateTransactionItem(item));
  if (!allItemsValid) {
    console.error(`Invalid transaction: one or more items are invalid for transaction ${transaction.id}`);
    return false;
  }
  
  // Validasi total
  if (transaction.total === undefined || transaction.total === null || typeof transaction.total !== 'number' || transaction.total < 0 || isNaN(transaction.total)) {
    console.error(`Invalid transaction: total is invalid for transaction ${transaction.id}`, transaction);
    return false;
  }
  
  return true;
}

/**
 * Filter transaksi yang valid untuk laporan
 */
export function getValidTransactionsForReport(
  transactions: Transaction[],
  products: Product[],
  users: User[]
): Transaction[] {
  if (!Array.isArray(transactions)) {
    console.error('getValidTransactionsForReport: transactions is not an array');
    return [];
  }
  
  return transactions.filter(transaction => {
    try {
      // Filter transaksi yang memiliki data minimal
      const hasValidTimestamp = transaction.timestamp && 
        validateTimestamp(transaction.timestamp) !== Date.now();
      const hasValidItems = transaction.items && 
        Array.isArray(transaction.items) && 
        transaction.items.length > 0;
      const hasValidTotal = transaction.total && transaction.total > 0;
      
      return hasValidTimestamp && hasValidItems && hasValidTotal && validateTransaction(transaction);
    } catch (error) {
      console.error(`Error validating transaction ${transaction?.id}:`, error);
      return false;
    }
  });
}

/**
 * Hitung COGS dengan validasi
 */
export function calculateValidatedCOGS(
  transaction: Transaction,
  products: Product[]
): { cogs: number; hasEstimation: boolean; details: Array<{ productName: string; cost: number; isEstimated: boolean }> } {
  let totalCOGS = 0;
  let hasEstimation = false;
  const details: Array<{ productName: string; cost: number; isEstimated: boolean }> = [];
  
  if (transaction.items && Array.isArray(transaction.items)) {
    transaction.items.forEach(item => {
      const { costPrice, isEstimated } = getValidCostPrice(item, products);
      const itemCost = costPrice * item.quantity;
      totalCOGS += itemCost;
      
      if (isEstimated) {
        hasEstimation = true;
      }
      
      const { name } = getValidProductName(item, products);
      details.push({
        productName: name,
        cost: itemCost,
        isEstimated
      });
    });
  }
  
  return { cogs: totalCOGS, hasEstimation, details };
}

/**
 * Membersihkan dan memvalidasi data transaksi
 */
export function cleanTransactionData(transactions: Transaction[]): Transaction[] {
  if (!Array.isArray(transactions)) {
    console.error('cleanTransactionData: input is not an array');
    return [];
  }
  
  return transactions.filter(transaction => {
    try {
      return validateTransaction(transaction);
    } catch (error) {
      console.error(`Error validating transaction ${transaction?.id}:`, error);
      return false;
    }
  });
}

/**
 * Mendapatkan produk dari localStorage dengan error handling
 */
export function getProductsFromStorage(): Product[] {
  try {
    const productsData = localStorage.getItem('dimsum_products');
    if (!productsData) {
      console.warn('No products found in localStorage');
      return [];
    }
    
    const products = JSON.parse(productsData);
    if (!Array.isArray(products)) {
      console.error('Products data in localStorage is not an array');
      return [];
    }
    
    return products;
  } catch (error) {
    console.error('Error reading products from localStorage:', error);
    return [];
  }
}

/**
 * Mendapatkan transaksi dari localStorage dengan error handling
 */
export function getTransactionsFromStorage(): Transaction[] {
  try {
    const transactionsData = localStorage.getItem('dimsum_transactions');
    if (!transactionsData) {
      console.warn('No transactions found in localStorage');
      return [];
    }
    
    const transactions = JSON.parse(transactionsData);
    if (!Array.isArray(transactions)) {
      console.error('Transactions data in localStorage is not an array');
      return [];
    }
    
    return cleanTransactionData(transactions);
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error);
    return [];
  }
}