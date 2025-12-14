import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Receipt from '@/components/Receipt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, Wallet, Smartphone, X, AlertTriangle, Building2, QrCode } from 'lucide-react';
import { Product, Transaction, OrderItem } from '@/types';
import { getStoredProducts, setStoredProducts, saveTransaction } from '@/lib/storage';
import { saveActivityLog } from '@/lib/shiftStorage';
import { toast } from 'sonner';

export default function AdminPOS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateProductStock } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'E-Wallet' | 'Transfer Bank'>('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const loadedProducts = getStoredProducts() as Product[];
    setProducts(loadedProducts);
    
    if (loadedProducts.length === 0) {
      toast.info('Belum ada produk. Silakan tambahkan produk di menu Kelola Menu.');
    }
  }, [user, navigate]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const hasStock = product.stock !== undefined && product.stock > 0;
    return matchesSearch && matchesCategory && hasStock;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const productStock = product.stock || 0;
    
    if (productStock <= 0) {
      toast.error('Stok tidak tersedia', {
        description: `${product.name} sedang habis. Silakan perbarui stok terlebih dahulu.`
      });
      return;
    }
    
    if (existingItem) {
      if (existingItem.quantity < productStock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        
        if (productStock - (existingItem.quantity + 1) < 10) {
          toast.warning('Stok menipis', {
            description: `Sisa stok ${product.name}: ${productStock - (existingItem.quantity + 1)} unit`
          });
        } else {
          toast.success('Produk ditambahkan', {
            description: `${product.name} (${existingItem.quantity + 1} unit) ditambahkan ke keranjang.`
          });
        }
      } else {
        toast.error('Stok tidak cukup', {
          description: `Hanya tersedia ${productStock} unit ${product.name}.`
        });
      }
    } else {
      setCart([...cart, {
        product: product,
        quantity: 1
      }]);
      
      if (productStock - 1 < 10) {
        toast.warning('Stok menipis', {
          description: `Sisa stok ${product.name}: ${productStock - 1} unit`
        });
      } else {
        toast.success('Produk ditambahkan', {
          description: `${product.name} berhasil ditambahkan ke keranjang.`
        });
      }
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.product.id === productId);
    if (!cartItem) return;

    const newQuantity = cartItem.quantity + change;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > (product.stock || 0)) {
      toast.error('Stok tidak cukup', {
        description: `Hanya tersedia ${product.stock} unit ${product.name}.`
      });
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    setCart(cart.filter(item => item.product.id !== productId));
    if (item) {
      toast.info('Produk dihapus', {
        description: `${item.product.name} telah dihapus dari keranjang.`
      });
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const processPayment = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong', {
        description: 'Tambahkan produk ke keranjang sebelum melakukan pembayaran.'
      });
      return;
    }

    // Create cart items with cost information
    const cartItems = cart.map(item => ({
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
      total: calculateTotal(),
      paymentMethod: paymentMethod,
      cashier: user?.username || 'admin',
      cashierName: user?.name || 'Admin',
      cashierId: user?.id || '',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      status: 'completed'
    };

    saveTransaction(transaction);

    // Log activity after successful transaction
    if (user) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      saveActivityLog({
        id: Date.now().toString(),
        timestamp: Date.now(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Menyelesaikan transaksi',
        actionType: 'transaction',
        details: `Total: Rp ${calculateTotal().toLocaleString('id-ID')}, Metode: ${paymentMethod}, Jumlah item: ${totalItems}`
      });
    }

    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        const newStock = (product.stock || 0) - cartItem.quantity;
        
        // Update stock with history tracking
        updateProductStock(
          product.id,
          newStock,
          `Penjualan -${cartItem.quantity} unit (Transaksi #${transaction.id})`,
          user?.name || 'Admin',
          'sale'
        );
        
        return { ...product, stock: newStock };
      }
      return product;
    });
    setProducts(updatedProducts);
    setStoredProducts(updatedProducts);

    // Show receipt dialog instead of just toast
    setCurrentTransaction(transaction);
    setShowReceipt(true);
    setCart([]);
    setPaymentMethod('Cash');

    toast.success('Pembayaran berhasil', {
      description: `Transaksi selesai. Total: Rp ${calculateTotal().toLocaleString('id-ID')} - ${paymentMethod}`
    });
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    setCurrentTransaction(null);
    setPaymentMethod('Cash');
  };

  const clearCart = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong', {
        description: 'Tidak ada produk dalam keranjang untuk dihapus.'
      });
      return;
    }

    setCart([]);
    toast.info('Keranjang dikosongkan', {
      description: 'Semua produk telah dihapus dari keranjang.'
    });
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'Cash' | 'QRIS' | 'E-Wallet' | 'Transfer Bank');
  };

  // Check for low stock warnings in cart
  const cartLowStockWarnings = cart.filter(item => {
    const product = products.find(p => p.id === item.product.id);
    if (!product) return false;
    const remainingStock = (product.stock || 0) - item.quantity;
    return remainingStock < 10 && remainingStock > 0;
  });

  const cartOutOfStockWarnings = cart.filter(item => {
    const product = products.find(p => p.id === item.product.id);
    if (!product) return false;
    const remainingStock = (product.stock || 0) - item.quantity;
    return remainingStock === 0;
  });

  return (
    <div className="flex-1 lg:p-6 p-4 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">POS Admin</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">Sistem Point of Sale</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Menu Produk</CardTitle>
                <div className="flex flex-col gap-3 lg:gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap text-xs lg:text-sm px-3 lg:px-4"
                        size="sm"
                      >
                        {category === 'all' ? 'Semua' : category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] lg:h-[600px]">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ShoppingCart className="h-12 lg:h-16 w-12 lg:w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-base lg:text-lg font-semibold mb-2">
                        {searchQuery || selectedCategory !== 'all' 
                          ? 'Produk Tidak Ditemukan' 
                          : 'Belum Ada Produk'}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 max-w-md mx-auto px-4">
                        {searchQuery || selectedCategory !== 'all'
                          ? `Tidak ada produk yang cocok dengan pencarian "${searchQuery}" atau kategori yang dipilih.`
                          : 'Belum ada produk dalam sistem. Silakan tambahkan produk melalui menu Kelola Menu.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                      {filteredProducts.map(product => {
                        const stock = product.stock || 0;
                        const isLowStock = stock < 10;
                        
                        return (
                          <Card
                            key={product.id}
                            className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${
                              isLowStock ? 'border-yellow-300 bg-yellow-50' : ''
                            }`}
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-3 lg:p-4">
                              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-2 lg:mb-3 flex items-center justify-center">
                                <ShoppingCart className="h-8 lg:h-12 w-8 lg:w-12 text-orange-600" />
                              </div>
                              <h3 className="font-semibold text-xs lg:text-sm mb-1 line-clamp-2">{product.name}</h3>
                              <p className="text-xs text-gray-500 mb-2 capitalize">{product.category}</p>
                              <div className="flex justify-between items-center gap-1">
                                <span className="text-sm lg:text-lg font-bold text-orange-600">
                                  Rp {(product.price / 1000).toFixed(0)}k
                                </span>
                                <Badge 
                                  variant={isLowStock ? 'secondary' : 'default'} 
                                  className={`text-xs ${isLowStock ? 'bg-yellow-200 text-yellow-800' : ''}`}
                                >
                                  {stock}
                                </Badge>
                              </div>
                              {isLowStock && (
                                <div className="mt-2 flex items-center gap-1 text-yellow-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs font-medium">Stok Menipis</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <ShoppingCart className="h-4 lg:h-5 w-4 lg:w-5" />
                    Keranjang ({cart.length})
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Kosongkan</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Stock Warnings */}
                {cartOutOfStockWarnings.length > 0 && (
                  <Alert className="mb-3 border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-xs text-red-700">
                      <span className="font-bold">Stok akan habis:</span> {cartOutOfStockWarnings.map(item => item.product.name).join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
                
                {cartLowStockWarnings.length > 0 && (
                  <Alert className="mb-3 border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs text-yellow-700">
                      <span className="font-bold">Stok menipis:</span> {cartLowStockWarnings.map(item => item.product.name).join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                <ScrollArea className="h-[250px] lg:h-[300px] mb-4">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ShoppingCart className="h-10 lg:h-12 w-10 lg:w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium text-sm">Keranjang kosong</p>
                      <p className="text-xs mt-1">Tambahkan produk untuk memulai transaksi.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 lg:space-y-3">
                      {cart.map(item => {
                        const product = products.find(p => p.id === item.product.id);
                        const remainingStock = product ? (product.stock || 0) - item.quantity : 0;
                        const willBeOutOfStock = remainingStock === 0;
                        const willBeLowStock = remainingStock < 10 && remainingStock > 0;
                        
                        return (
                          <div 
                            key={item.product.id} 
                            className={`p-2 lg:p-3 rounded-lg ${
                              willBeOutOfStock ? 'bg-red-50 border border-red-200' : 
                              willBeLowStock ? 'bg-yellow-50 border border-yellow-200' : 
                              'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs lg:text-sm truncate">{item.product.name}</h4>
                                <p className="text-xs text-gray-600">
                                  Rp {item.product.price.toLocaleString('id-ID')}
                                </p>
                                {(willBeOutOfStock || willBeLowStock) && (
                                  <p className={`text-xs font-medium mt-1 ${willBeOutOfStock ? 'text-red-600' : 'text-yellow-600'}`}>
                                    Sisa: {remainingStock} unit
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.product.id)}
                                className="h-6 w-6 lg:h-8 lg:w-8 p-0 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 lg:h-4 w-3 lg:w-4 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 lg:gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  disabled={item.quantity <= 1}
                                  className="h-6 w-6 lg:h-8 lg:w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 lg:w-12 text-center font-semibold text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className="h-6 w-6 lg:h-8 lg:w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold text-orange-600 text-xs lg:text-sm">
                                Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                <Separator className="my-4" />

                {/* Payment Method Selection */}
                <div className="mb-4">
                  <Label className="text-xs lg:text-sm font-semibold mb-3 block">Metode Pembayaran *</Label>
                  <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange} className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 lg:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="Cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1 text-xs lg:text-sm">
                        <Wallet className="h-3 lg:h-4 w-3 lg:w-4 text-green-600" />
                        <span>Cash</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 lg:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="QRIS" id="qris" />
                      <Label htmlFor="qris" className="flex items-center gap-2 cursor-pointer flex-1 text-xs lg:text-sm">
                        <QrCode className="h-3 lg:h-4 w-3 lg:w-4 text-blue-600" />
                        <span>QRIS</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 lg:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="E-Wallet" id="e-wallet" />
                      <Label htmlFor="e-wallet" className="flex items-center gap-2 cursor-pointer flex-1 text-xs lg:text-sm">
                        <Smartphone className="h-3 lg:h-4 w-3 lg:w-4 text-purple-600" />
                        <span>E-Wallet</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 lg:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="Transfer Bank" id="transfer" />
                      <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1 text-xs lg:text-sm">
                        <Building2 className="h-3 lg:h-4 w-3 lg:w-4 text-orange-600" />
                        <span>Transfer Bank</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-base lg:text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={processPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="mr-2 h-4 lg:h-5 w-4 lg:w-5" />
                  <span className="text-sm lg:text-base">Proses Pembayaran</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl">🎉 Transaksi Selesai</DialogTitle>
          </DialogHeader>
          {currentTransaction && <Receipt transaction={currentTransaction} />}
          <Button
            className="w-full"
            onClick={handleNewTransaction}
          >
            Transaksi Baru
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}