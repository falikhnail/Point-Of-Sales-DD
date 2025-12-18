import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { getStoredProducts, setStoredProducts, getFromStorage, setToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  branchId?: string;
}

interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  userId: string;
  branchId?: string;
}

const categories = ['Dimsum', 'Minuman', 'Snack', 'Paket'];

export default function ProductManagement() {
  const { currentBranch } = useBranch();
  const [products, setProductsState] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dimsum',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'pcs',
    description: '',
  });

  useEffect(() => {
    loadProducts();
  }, [currentBranch]);

  const loadProducts = () => {
    const allProducts = getStoredProducts();
    // Filter products by current branch
    const branchProducts = currentBranch 
      ? allProducts.filter(p => p.branchId === currentBranch.id)
      : allProducts;
    setProductsState(branchProducts);
  };

  const saveProducts = (updatedProducts: Product[]) => {
    // Get all products from storage
    const allProducts = getStoredProducts();
    
    // Remove old products from current branch
    const otherBranchProducts = allProducts.filter(p => p.branchId !== currentBranch?.id);
    
    // Combine with updated products
    const finalProducts = [...otherBranchProducts, ...updatedProducts];
    
    setStoredProducts(finalProducts);
    setProductsState(updatedProducts);
  };

  const getStockHistory = () => {
    return getFromStorage<StockHistoryEntry[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  };

  const setStockHistory = (history: StockHistoryEntry[]) => {
    setToStorage(STORAGE_KEYS.ACTIVITY_LOGS, history);
  };

  const addStockHistory = (entry: Omit<StockHistoryEntry, 'id' | 'date' | 'userId'>) => {
    const history = getStockHistory();
    const newEntry: StockHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      userId: 'admin',
      branchId: currentBranch?.id,
    };
    setStockHistory([...history, newEntry]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch) {
      toast.error('Tidak ada cabang aktif', {
        description: 'Silakan pilih cabang terlebih dahulu.'
      });
      return;
    }

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: parseFloat(formData.stock),
      minStock: parseFloat(formData.minStock),
      unit: formData.unit,
      description: formData.description,
      branchId: currentBranch.id,
    };

    let updatedProducts: Product[];
    if (editingProduct) {
      updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? productData : p
      );

      // Track stock changes
      if (editingProduct.stock !== productData.stock) {
        addStockHistory({
          productId: productData.id,
          productName: productData.name,
          type: 'adjustment',
          quantity: productData.stock - editingProduct.stock,
          previousStock: editingProduct.stock,
          newStock: productData.stock,
          reason: 'Manual stock adjustment',
        });
      }
      
      toast.success('Produk diperbarui', {
        description: `${productData.name} berhasil diperbarui.`
      });
    } else {
      updatedProducts = [...products, productData];
      addStockHistory({
        productId: productData.id,
        productName: productData.name,
        type: 'in',
        quantity: productData.stock,
        previousStock: 0,
        newStock: productData.stock,
        reason: 'Initial stock',
      });
      
      toast.success('Produk ditambahkan', {
        description: `${productData.name} berhasil ditambahkan ke ${currentBranch.name}.`
      });
    }

    saveProducts(updatedProducts);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
      description: product.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    if (confirm(`Apakah Anda yakin ingin menghapus produk ${product?.name}?`)) {
      const updatedProducts = products.filter((p) => p.id !== id);
      saveProducts(updatedProducts);
      toast.success('Produk dihapus', {
        description: `${product?.name} berhasil dihapus.`
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Dimsum',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      unit: 'pcs',
      description: '',
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Produk</h1>
          {currentBranch && (
            <p className="text-sm text-muted-foreground mt-1">
              Cabang: {currentBranch.name}
            </p>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga Jual (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Harga Modal (Rp)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stok Minimum</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="liter">liter</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

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
                <Button type="submit">
                  {editingProduct ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 bg-orange-50 rounded"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-orange-600">
                    Stok: {product.stock} {product.unit} (Min: {product.minStock})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Daftar Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Harga Modal</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>Rp {product.price.toLocaleString()}</TableCell>
                  <TableCell>Rp {product.cost.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={
                        product.stock <= product.minStock
                          ? 'text-orange-600 font-bold'
                          : ''
                      }
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    {product.stock <= product.minStock ? (
                      <span className="text-orange-600 text-sm font-medium">
                        Stok Rendah
                      </span>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">
                        Normal
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}