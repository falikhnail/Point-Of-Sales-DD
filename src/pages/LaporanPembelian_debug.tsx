// Add this at the beginning of loadReportData function
console.log('=== DEBUG: Loading Report Data ===');
const purchases = getStoredPurchases();
console.log('Raw purchases from storage:', purchases);
console.log('Number of purchases:', purchases.length);
console.log('Date range:', dateRange);

if (purchases.length > 0) {
  console.log('First purchase:', purchases[0]);
  console.log('First purchase date:', purchases[0].purchaseDate);
  console.log('First purchase items:', purchases[0].items);
}
