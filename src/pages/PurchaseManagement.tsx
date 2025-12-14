import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Edit, Search, CheckCircle2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getStoredPurchases, setStoredPurchases, getCurrentUser } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';

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
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  shippingCost: number;
  otherCosts: number;
  totalCost: number;
  createdBy: string;
  createdAt: string;
}

interface PurchaseHistoryItem {
  id: string;
  date: string;
  supplier: string;
  items: Array<{
    product: string;
    quantity: number;
    cost: number;
    total: number;
  }>;
  totalCost: number;
  shippingCost: number;
  otherCosts: number;
}

// Predefined list of suppliers
const SUPPLIERS = [
  'PT Sumber Frozen Food',
  'CV Maju Jaya Frozen',
  'Toko Bahan Baku Sentosa',
  'PT Indo Frozen Supply',
  'CV Berkah Food Supplier'
];

export default function PurchaseManagement() {
  const { products, updateProductStock } = useApp();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form state
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { productId: '', productName: '', quantity: 0, costPrice: 0, subtotal: 0 }
  ]);
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);

  // Get current user from centralized storage utility
  const getCurrentUsername = () => {
    const user = getCurrentUser();
    if (user && typeof user === 'object' && 'username' in user) {
      return user.username || 'Unknown';
    }
    return 'Unknown';
  };

  // Load purchases from localStorage
  useEffect(() => {
    const storedPurchases = getStoredPurchases() as Purchase[];
    setPurchases(storedPurchases);
  }, []);

  // Save purchases to localStorage
  const savePurchases = (updatedPurchases: Purchase[]) => {
    setPurchases(updatedPurchases);
    setStoredPurchases(updatedPurchases);
  };

  // Calculate subtotal for items
  const calculateItemsSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return calculateItemsSubtotal() + shippingCost + otherCosts;
  };

  // Add new purchase item row
  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      { productId: '', productName: '', quantity: 0, costPrice: 0, subtotal: 0 }
    ]);
  };

  // Remove purchase item row
  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      const newItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(newItems);
    }
  };

  // Update purchase item
  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...purchaseItems];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productId = value as string;
        newItems[index].productName = product.name;
        newItems[index].costPrice = product.cost || 0;
      }
    } else if (field === 'quantity' || field === 'costPrice') {
      newItems[index][field] = Number(value);
    } else {
      newItems[index][field] = value as never;
    }

    // Calculate subtotal
    newItems[index].subtotal = newItems[index].quantity * newItems[index].costPrice;
    
    setPurchaseItems(newItems);
  };

  // Reset form
  const resetForm = () => {
    setSupplier('');
    setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
    setPurchaseItems([{ productId: '', productName: '', quantity: 0, costPrice: 0, subtotal: 0 }]);
    setShippingCost(0);
    setOtherCosts(0);
    setEditingPurchase(null);
  };

  // Save purchase
  const savePurchase = () => {
    if (!supplier.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nama supplier harus diisi",
      });
      return;
    }

    const validItems = purchaseItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Minimal harus ada 1 produk dengan qty > 0",
      });
      return;
    }

    const currentUser = getCurrentUsername();

    const newPurchase: Purchase = {
      id: editingPurchase?.id || `PO-${Date.now()}`,
      supplier,
      purchaseDate,
      items: validItems,
      subtotal: calculateItemsSubtotal(),
      shippingCost,
      otherCosts,
      totalCost: calculateTotalCost(),
      createdBy: currentUser,
      createdAt: editingPurchase?.createdAt || new Date().toISOString()
    };

    let updatedPurchases: Purchase[];
    
    if (editingPurchase) {
      // Update existing purchase
      updatedPurchases = purchases.map(p => p.id === editingPurchase.id ? newPurchase : p);
    } else {
      // Add new purchase
      updatedPurchases = [...purchases, newPurchase];
    }

    // Update product stock
    validItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const currentStock = product.stock || 0;
        const newStock = currentStock + item.quantity;
        updateProductStock(item.productId, newStock, `Pembelian dari ${supplier}`, currentUser, 'restock');
      }
    });

    savePurchases(updatedPurchases);
    console.log("=== DEBUG: Saving Purchase ===");
    console.log("New Purchase:", JSON.stringify(newPurchase, null, 2));
    console.log("Updated Purchases Array:", JSON.stringify(updatedPurchases, null, 2));
    setTimeout(() => {
      const saved = getStoredPurchases();
      console.log("Verified saved purchases:", JSON.stringify(saved, null, 2));
      console.log("Number of purchases in storage:", saved.length);
    }, 100);
    
    // Update purchase history for reports
    updatePurchaseHistory(newPurchase);
    
    setIsDialogOpen(false);
    resetForm();
    
    // Show modern toast notification with icon and styling
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span>Pembelian Berhasil Disimpan!</span>
        </div>
      ),
      description: (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4" />
            <span>Stok produk telah diperbarui</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {validItems.length} produk ditambahkan ke inventori
          </div>
        </div>
      ),
      className: "border-green-200 bg-green-50",
    });
  };

  // Update purchase history for reports
  const updatePurchaseHistory = (purchase: Purchase) => {
    const purchaseHistory: PurchaseHistoryItem[] = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
    
    const existingIndex = purchaseHistory.findIndex((p: PurchaseHistoryItem) => p.id === purchase.id);
    
    const historyItem: PurchaseHistoryItem = {
      id: purchase.id,
      date: purchase.purchaseDate,
      supplier: purchase.supplier,
      items: purchase.items.map(item => ({
        product: item.productName,
        quantity: item.quantity,
        cost: item.costPrice,
        total: item.subtotal
      })),
      totalCost: purchase.totalCost,
      shippingCost: purchase.shippingCost,
      otherCosts: purchase.otherCosts
    };
    
    if (existingIndex >= 0) {
      purchaseHistory[existingIndex] = historyItem;
    } else {
      purchaseHistory.push(historyItem);
    }
    
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  };

  // Edit purchase
  const editPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setSupplier(purchase.supplier);
    setPurchaseDate(purchase.purchaseDate);
    setPurchaseItems(purchase.items);
    setShippingCost(purchase.shippingCost);
    setOtherCosts(purchase.otherCosts);
    setIsDialogOpen(true);
  };

  // Delete purchase
  const deletePurchase = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pembelian ini?')) {
      const updatedPurchases = purchases.filter(p => p.id !== id);
      savePurchases(updatedPurchases);
      
      // Remove from purchase history
      const purchaseHistory: PurchaseHistoryItem[] = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
      const updatedHistory = purchaseHistory.filter((p: PurchaseHistoryItem) => p.id !== id);
      localStorage.setItem('purchaseHistory', JSON.stringify(updatedHistory));
      
      toast({
        title: "Pembelian Dihapus",
        description: "Data pembelian berhasil dihapus dari sistem",
      });
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const purchaseDate = new Date(purchase.purchaseDate);
    const matchesStartDate = !filterStartDate || purchaseDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || purchaseDate <= new Date(filterEndDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Pembelian / Stock In</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Pembelian
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Supplier and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Nama Supplier *</Label>
                  <Select
                    value={supplier}
                    onValueChange={(value) => setSupplier(value)}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIERS.map((supplierOption) => (
                        <SelectItem key={supplierOption} value={supplierOption}>
                          {supplierOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Tanggal Pembelian *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Daftar Produk *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPurchaseItem}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Baris
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Produk</TableHead>
                        <TableHead className="w-[120px]">Qty</TableHead>
                        <TableHead className="w-[150px]">Harga Modal</TableHead>
                        <TableHead className="w-[150px]">Subtotal</TableHead>
                        <TableHead className="w-[80px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updatePurchaseItem(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.costPrice || ''}
                              onChange={(e) => updatePurchaseItem(index, 'costPrice', e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePurchaseItem(index)}
                              disabled={purchaseItems.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Additional Costs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCost">Biaya Ongkir (Optional)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    min="0"
                    value={shippingCost || ''}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="otherCosts">Biaya Lain-lain (Optional)</Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    min="0"
                    value={otherCosts || ''}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal Produk:</span>
                      <span className="font-semibold">
                        Rp {calculateItemsSubtotal().toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Biaya Ongkir:</span>
                      <span className="font-semibold">
                        Rp {shippingCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Biaya Lain-lain:</span>
                      <span className="font-semibold">
                        Rp {otherCosts.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total Pembelian:</span>
                      <span className="text-green-600">
                        Rp {calculateTotalCost().toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button onClick={savePurchase}>
                  {editingPurchase ? 'Update Pembelian' : 'Simpan Pembelian'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Cari (Supplier / ID)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  className="pl-10"
                  placeholder="Cari supplier atau ID pembelian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histori Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pembelian</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Item</TableHead>
                  <TableHead>Total Biaya</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Belum ada data pembelian
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.id}</TableCell>
                      <TableCell>
                        {format(new Date(purchase.purchaseDate), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>
                        {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} item
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rp {purchase.totalCost.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>{purchase.createdBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editPurchase(purchase)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePurchase(purchase.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}