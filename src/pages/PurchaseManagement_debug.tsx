// Add this after line 207 in savePurchase function
console.log('=== DEBUG: Saving Purchase ===');
console.log('New Purchase:', newPurchase);
console.log('Updated Purchases Array:', updatedPurchases);

// After setStoredPurchases call
const saved = getStoredPurchases();
console.log('Verified saved purchases:', saved);
console.log('Number of purchases in storage:', saved.length);
