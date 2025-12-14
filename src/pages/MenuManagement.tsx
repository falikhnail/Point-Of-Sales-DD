import { useState, useEffect } from 'react';
import { Product } from '@/types';
import ProductForm from '@/components/ProductForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getStoredProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  formatCurrency,
} from '@/lib/storage';
import { Plus, Pencil, Trash2, Package, PackagePlus, History, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const categoryColors = {
  kukus: 'bg-blue-100 text-blue-800',
  goreng: 'bg-yellow-100 text-yellow-800',
  bakar: 'bg-red-100 text-red-800',
  lainnya: 'bg-gray-100 text-gray-800',
};

const categoryLabels = {
  kukus: 'Kukus',
  goreng: 'Goreng',
  bakar: 'Bakar',
  lainnya: 'Lainnya',
};

export default function MenuManagement() {
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('');
  const [showHistory, setShowHistory] = useState<Product | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateProductStock, getProductStockHistory, getLowStockProducts, getOutOfStockProducts } = useApp();

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product.id, product);
      toast({
        title: 'Produk Diperbarui',
        description: 'Produk berhasil diperbarui',
      });
    } else {
      addProduct(product);
      toast({
        title: 'Produk Ditambahkan',
        description: 'Produk baru berhasil ditambahkan',
      });
    }
    setProducts(getStoredProducts());
    setEditingProduct(undefined);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setProducts(getStoredProducts());
      toast({
        title: 'Produk Dihapus',
        description: 'Produk berhasil dihapus',
      });
      setDeletingProduct(null);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleRestock = (product: Product) => {
    setRestockProduct(product);
    setRestockQuantity('');
  };

  const confirmRestock = () => {
    if (!restockProduct || !restockQuantity) return;

    const quantity = parseInt(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Input Tidak Valid',
        description: 'Masukkan jumlah stok yang valid',
        variant: 'destructive',
      });
      return;
    }

    const currentStock = restockProduct.stock || 0;
    const newStock = currentStock + quantity;

    updateProductStock(
      restockProduct.id,
      newStock,
      `Restock +${quantity} unit`,
      user?.name || 'Admin',
      'restock'
    );

    setProducts(getStoredProducts());
    toast({
      title: 'Restock Berhasil',
      description: `${restockProduct.name} berhasil ditambah ${quantity} unit. Stok sekarang: ${newStock}`,
    });

    setRestockProduct(null);
    setRestockQuantity('');
  };

  const handleShowHistory = (product: Product) => {
    setShowHistory(product);
  };

  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = getOutOfStockProducts();

  return (
    <div className="flex-1 lg:p-6 p-4 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Kelola Menu</h1>
          <Button
            onClick={handleAddNew}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </div>

        {/* Stock Alerts */}
        {outOfStockProducts.length > 0 && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 font-bold">Stok Habis!</AlertTitle>
            <AlertDescription className="text-red-700">
              {outOfStockProducts.length} produk habis stok: {outOfStockProducts.map(p => p.name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {lowStockProducts.length > 0 && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50">
            <Package className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 font-bold">Stok Menipis</AlertTitle>
            <AlertDescription className="text-yellow-700">
              {lowStockProducts.length} produk memiliki stok di bawah 10 unit
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {products.map((product) => {
            const profit = product.price - (product.costPrice || 0);
            const profitMargin = product.costPrice ? ((profit / product.price) * 100).toFixed(1) : 0;
            const stock = product.stock ?? 0;
            
            return (
              <Card key={product.id} className={stock === 0 ? 'border-red-300 bg-red-50' : stock < 10 ? 'border-yellow-300 bg-yellow-50' : ''}>
                <CardContent className="p-3 lg:p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base lg:text-lg mb-1 truncate">
                        {product.name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={categoryColors[product.category]}>
                          {categoryLabels[product.category]}
                        </Badge>
                        <Badge 
                          variant={stock === 0 ? 'destructive' : stock < 10 ? 'secondary' : 'default'}
                          className="flex items-center gap-1"
                        >
                          <Package className="h-3 w-3" />
                          Stok: {stock}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-xs lg:text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs lg:text-sm">
                      <span className="text-gray-600">Harga Beli:</span>
                      <span className="font-medium">
                        {formatCurrency(product.costPrice || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs lg:text-sm">
                      <span className="text-gray-600">Harga Jual:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs lg:text-sm pt-2 border-t">
                      <span className="text-gray-600">Margin:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(profit)} ({profitMargin}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Pencil className="mr-1 lg:mr-2 h-3 lg:h-4 w-3 lg:w-4" />
                      <span className="text-xs lg:text-sm">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product)}
                      className="px-2 lg:px-3"
                    >
                      <Trash2 className="h-3 lg:h-4 w-3 lg:w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => handleRestock(product)}
                    >
                      <PackagePlus className="mr-1 lg:mr-2 h-3 lg:h-4 w-3 lg:w-4" />
                      <span className="text-xs lg:text-sm">Restock</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowHistory(product)}
                      className="px-2 lg:px-3"
                    >
                      <History className="h-3 lg:h-4 w-3 lg:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4 text-sm lg:text-base">Belum ada produk</p>
            <Button
              onClick={handleAddNew}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk Pertama
            </Button>
          </div>
        )}
      </div>

      <ProductForm
        product={editingProduct}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
      />

      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk "{deletingProduct?.name}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={() => setRestockProduct(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Produk</DialogTitle>
            <DialogDescription>
              Tambahkan stok untuk {restockProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stok Saat Ini</Label>
              <div className="text-2xl font-bold text-orange-600">
                {restockProduct?.stock || 0} unit
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-quantity">Jumlah Tambahan</Label>
              <Input
                id="restock-quantity"
                type="number"
                min="1"
                placeholder="Masukkan jumlah"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
              />
            </div>
            {restockQuantity && parseInt(restockQuantity) > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Stok Setelah Restock:</p>
                <p className="text-xl font-bold text-green-600">
                  {(restockProduct?.stock || 0) + parseInt(restockQuantity)} unit
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockProduct(null)}>
              Batal
            </Button>
            <Button 
              onClick={confirmRestock}
              className="bg-green-600 hover:bg-green-700"
              disabled={!restockQuantity || parseInt(restockQuantity) <= 0}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Stok - {showHistory?.name}</DialogTitle>
            <DialogDescription>
              Histori perubahan stok produk
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {showHistory && getProductStockHistory(showHistory.id).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada riwayat perubahan stok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {showHistory && getProductStockHistory(showHistory.id).map((history) => (
                  <Card key={history.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                history.changeType === 'restock'
                                  ? 'default'
                                  : history.changeType === 'sale'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {history.changeType === 'restock' ? 'Restock' : history.changeType === 'sale' ? 'Penjualan' : 'Penyesuaian'}
                            </Badge>
                            <span className={`font-bold ${history.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {history.quantityChanged > 0 ? '+' : ''}{history.quantityChanged} unit
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{history.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Oleh: {history.userName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {history.quantityBefore} → {history.quantityAfter}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}