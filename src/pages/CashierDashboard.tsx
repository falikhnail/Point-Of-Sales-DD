import { useState, useEffect } from 'react';
import { OrderItem, Product, Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import OrderSummary from '@/components/OrderSummary';
import Receipt from '@/components/Receipt';
import ShiftManagement from '@/components/ShiftManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getStoredProducts, saveTransaction, setStoredProducts } from '@/lib/storage';
import { getActiveShift, saveActivityLog } from '@/lib/shiftStorage';
import { useToast } from '@/hooks/use-toast';
import { Search, Sparkles, AlertCircle, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [products] = useState<Product[]>(getStoredProducts());
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer Bank' | 'E-Wallet'>('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [hasActiveShift, setHasActiveShift] = useState(false);

  useEffect(() => {
    checkActiveShift();
    
    // Set up interval to check shift status every 2 seconds
    const intervalId = setInterval(() => {
      checkActiveShift();
    }, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  const checkActiveShift = () => {
    if (!user) return;
    const activeShift = getActiveShift(user.id);
    setHasActiveShift(!!activeShift);
  };

  const handleAddProduct = (product: Product) => {
    if (!hasActiveShift) {
      toast({
        title: 'Shift Belum Dibuka',
        description: 'Buka shift terlebih dahulu untuk melakukan transaksi',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = orderItems.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { product, quantity: 1 }]);
    }

    toast({
      title: '✨ Produk Ditambahkan',
      description: `${product.name} ditambahkan ke pesanan`,
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (!hasActiveShift) {
      toast({
        title: 'Shift Belum Dibuka',
        description: 'Buka shift terlebih dahulu untuk melakukan transaksi',
        variant: 'destructive',
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: 'Pesanan Kosong',
        description: 'Tambahkan produk terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleConfirmPayment = () => {
    if (!user) return;

    const activeShift = getActiveShift(user.id);
    if (!activeShift) {
      toast({
        title: 'Error',
        description: 'Shift tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }

    const total = orderItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create cart items with cost information
    const cartItems = orderItems.map(item => ({
      ...item.product,
      quantity: item.quantity,
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      cost: item.product.cost || item.product.costPrice || 0
    }));

    const transaction: Transaction = {
      id: Date.now().toString(),
      items: cartItems,
      total,
      paymentMethod,
      cashierName: user.name,
      cashierId: user.id,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      shiftId: activeShift.id,
      status: 'completed'
    };

    // Update product stock
    const currentProducts = getStoredProducts();
    const updatedProducts = currentProducts.map(product => {
      const orderItem = orderItems.find(item => item.product.id === product.id);
      if (orderItem) {
        return {
          ...product,
          stock: product.stock - orderItem.quantity
        };
      }
      return product;
    });
    setStoredProducts(updatedProducts);

    saveTransaction(transaction);

    // Log activity after successful transaction
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    saveActivityLog({
      id: Date.now().toString(),
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Menyelesaikan transaksi',
      actionType: 'transaction',
      details: `Total: Rp ${total.toLocaleString('id-ID')}, Metode: ${paymentMethod}, Jumlah item: ${totalItems}`
    });

    setCurrentTransaction(transaction);
    setShowCheckout(false);
    setShowReceipt(true);
    setOrderItems([]);

    toast({
      title: '🎉 Transaksi Berhasil',
      description: 'Pembayaran telah diproses',
    });
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    setCurrentTransaction(null);
    setPaymentMethod('Cash');
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'Cash' | 'QRIS' | 'Transfer Bank' | 'E-Wallet');
  };

  const handleLogout = () => {
    logout();
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header Bar with Logout */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Dimsum Mpok Rani - Kasir POS
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.name} ({user?.role})
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 border-2 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Shift Alert */}
        {!hasActiveShift && (
          <Alert className="mb-6 border-orange-500 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-800 font-bold">Shift Belum Dibuka</AlertTitle>
            <AlertDescription className="text-orange-700">
              Buka shift terlebih dahulu untuk mulai menerima transaksi
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Shift Management Section */}
          <div className="lg:col-span-1">
            <ShiftManagement cashierId={user?.id} cashierName={user?.name} />
          </div>

          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar with gradient border */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-5 w-5 z-10" />
                  <Input
                    placeholder="Cari produk favorit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 border-2 border-purple-200 focus:border-purple-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Tabs with colorful design */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full grid grid-cols-5 h-auto bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg border-2 border-purple-100">
                <TabsTrigger 
                  value="semua" 
                  className="text-xs sm:text-sm px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Semua
                </TabsTrigger>
                <TabsTrigger 
                  value="kukus" 
                  className="text-xs sm:text-sm px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Kukus
                </TabsTrigger>
                <TabsTrigger 
                  value="goreng" 
                  className="text-xs sm:text-sm px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Goreng
                </TabsTrigger>
                <TabsTrigger 
                  value="bakar" 
                  className="text-xs sm:text-sm px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Bakar
                </TabsTrigger>
                <TabsTrigger 
                  value="lainnya" 
                  className="text-xs sm:text-sm px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  Lainnya
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddProduct}
                    />
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                      <Search className="h-12 w-12 text-purple-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Tidak ada produk ditemukan</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Order Summary */}
            <div className="lg:hidden">
              <OrderSummary
                items={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>

          {/* Desktop Order Summary */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <OrderSummary
                items={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Dialog with gradient */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-[95vw] sm:max-w-md border-2 border-purple-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Konfirmasi Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Metode Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger className="h-12 border-2 border-purple-200 focus:border-purple-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">💵 Cash</SelectItem>
                  <SelectItem value="Transfer Bank">🏦 Transfer Bank</SelectItem>
                  <SelectItem value="QRIS">📱 QRIS</SelectItem>
                  <SelectItem value="E-Wallet">📱 E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-inner">
              <div className="flex justify-between text-base lg:text-lg font-bold">
                <span className="text-gray-700">Total Pembayaran:</span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-xl">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(
                    orderItems.reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCheckout(false)} 
              className="flex-1 h-12 border-2 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleConfirmPayment}
            >
              Konfirmasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[95vw] sm:max-w-md border-2 border-purple-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎉 Transaksi Selesai
            </DialogTitle>
          </DialogHeader>
          {currentTransaction && <Receipt transaction={currentTransaction} />}
          <Button
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleNewTransaction}
          >
            Transaksi Baru
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}