import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProductFormProps {
  product?: Product;
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export default function ProductForm({
  product,
  open,
  onClose,
  onSave,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'kukus',
    price: 0,
    costPrice: 0,
    stock: 50,
    description: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        stock: product.stock ?? 50,
      });
    } else {
      setFormData({
        name: '',
        category: 'kukus',
        price: 0,
        costPrice: 0,
        stock: 50,
        description: '',
      });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: product?.id || Date.now().toString(),
      name: formData.name || '',
      category: formData.category as Product['category'],
      price: Number(formData.price) || 0,
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      description: formData.description || '',
    };
    onSave(newProduct);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
                  setFormData({ ...formData, category: value as Product['category'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kukus">Kukus</SelectItem>
                  <SelectItem value="goreng">Goreng</SelectItem>
                  <SelectItem value="bakar">Bakar</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Harga Beli (Rp)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: Number(e.target.value) })
                  }
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: Number(e.target.value) })
                }
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}