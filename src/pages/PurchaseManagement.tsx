import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Trash2, Plus, ShoppingCart } from "lucide-react";
import type { Product, Purchase, PurchaseItem } from "@/types";
import { getStoredProducts, setStoredProducts } from "@/lib/storage";
import { useBranch } from "@/contexts/BranchContext";

export default function PurchaseManagement() {
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [shippingCost, setShippingCost] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  // Load products from storage based on current branch
  useEffect(() => {
    const allProducts = getStoredProducts();
    const branchProducts = currentBranch
      ? allProducts.filter((p) => p.branchId === currentBranch.id)
      : allProducts;
    setProducts(branchProducts);
  }, [currentBranch]);

  // Load purchases from localStorage
  useEffect(() => {
    const storedPurchases = localStorage.getItem("purchases");
    if (storedPurchases) {
      const allPurchases = JSON.parse(storedPurchases);
      // Filter by current branch
      const branchPurchases = currentBranch
        ? allPurchases.filter((p: Purchase) => p.branchId === currentBranch.id)
        : allPurchases;
      setPurchases(branchPurchases);
    }
  }, [currentBranch]);

  const addItem = () => {
    if (!selectedProduct || !quantity || !unitPrice) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon lengkapi semua field untuk menambah item",
      });
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Produk tidak ditemukan",
      });
      return;
    }

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);

    if (qty <= 0 || price <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Jumlah dan harga harus lebih dari 0",
      });
      return;
    }

    const newItem: PurchaseItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      costPrice: price,
      subtotal: qty * price,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity("");
    setUnitPrice("");

    toast({
      title: "Item ditambahkan",
      description: `${product.name} berhasil ditambahkan ke daftar pembelian`,
    });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    toast({
      title: "Item dihapus",
      description: "Item berhasil dihapus dari daftar pembelian",
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = parseFloat(shippingCost) || 0;
    const other = parseFloat(otherCosts) || 0;
    return subtotal + shipping + other;
  };

  const savePurchase = () => {
    // Validate current branch
    if (!currentBranch) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada cabang aktif. Silakan pilih cabang terlebih dahulu.",
      });
      return;
    }

    if (!supplier.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon isi nama supplier",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon tambahkan minimal satu item pembelian",
      });
      return;
    }

    // Validate all items have valid products
    const validItems = items.filter((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product !== undefined;
    });

    if (validItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada item valid untuk disimpan",
      });
      return;
    }

    const currentUser = localStorage.getItem("currentUser");
    const user = currentUser ? JSON.parse(currentUser) : null;

    const newPurchase: Purchase = {
      id: `PUR-${Date.now()}`,
      supplier: supplier.trim(),
      purchaseDate,
      items: validItems,
      subtotal: calculateSubtotal(),
      shippingCost: parseFloat(shippingCost) || 0,
      otherCosts: parseFloat(otherCosts) || 0,
      totalCost: calculateTotal(),
      createdBy: user?.username || "Unknown",
      createdAt: new Date().toISOString(),
      branchId: currentBranch.id, // CRITICAL: Add branchId
    };

    // Update product stock in storage
    const allProducts = getStoredProducts();
    const updatedAllProducts = allProducts.map((p) => {
      const purchaseItem = validItems.find((item) => item.productId === p.id);
      if (purchaseItem && p.branchId === currentBranch.id) {
        return { ...p, stock: p.stock + purchaseItem.quantity };
      }
      return p;
    });
    setStoredProducts(updatedAllProducts);

    // Refresh local products state
    const branchProducts = updatedAllProducts.filter(
      (p) => p.branchId === currentBranch.id
    );
    setProducts(branchProducts);

    // Save purchase to localStorage
    const storedPurchases = localStorage.getItem("purchases");
    const allPurchases = storedPurchases ? JSON.parse(storedPurchases) : [];
    const updatedPurchases = [...allPurchases, newPurchase];
    localStorage.setItem("purchases", JSON.stringify(updatedPurchases));

    // Update local state with branch-filtered purchases
    const branchPurchases = updatedPurchases.filter(
      (p: Purchase) => p.branchId === currentBranch.id
    );
    setPurchases(branchPurchases);

    // Reset form
    setSupplier("");
    setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
    setItems([]);
    setShippingCost("");
    setOtherCosts("");

    toast({
      title: "Pembelian berhasil disimpan",
      description: `Pembelian dari ${newPurchase.supplier} telah dicatat`,
    });
  };

  const deletePurchase = (purchaseId: string) => {
    const storedPurchases = localStorage.getItem("purchases");
    if (!storedPurchases) return;

    const allPurchases: Purchase[] = JSON.parse(storedPurchases);
    const purchaseToDelete = allPurchases.find((p) => p.id === purchaseId);

    if (!purchaseToDelete) return;

    // Revert stock changes
    const allProducts = getStoredProducts();
    const updatedAllProducts = allProducts.map((p) => {
      const purchaseItem = purchaseToDelete.items.find(
        (item) => item.productId === p.id
      );
      if (purchaseItem && p.branchId === purchaseToDelete.branchId) {
        return { ...p, stock: Math.max(0, p.stock - purchaseItem.quantity) };
      }
      return p;
    });
    setStoredProducts(updatedAllProducts);

    // Refresh local products state
    if (currentBranch) {
      const branchProducts = updatedAllProducts.filter(
        (p) => p.branchId === currentBranch.id
      );
      setProducts(branchProducts);
    }

    // Remove purchase
    const updatedPurchases = allPurchases.filter((p) => p.id !== purchaseId);
    localStorage.setItem("purchases", JSON.stringify(updatedPurchases));

    // Update local state
    const branchPurchases = currentBranch
      ? updatedPurchases.filter((p: Purchase) => p.branchId === currentBranch.id)
      : updatedPurchases;
    setPurchases(branchPurchases);

    toast({
      title: "Pembelian dihapus",
      description: "Data pembelian dan stok telah dikembalikan",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Pembelian</h1>
        <p className="text-muted-foreground">
          Kelola pembelian barang dari supplier
        </p>
        {currentBranch && (
          <p className="text-sm text-muted-foreground mt-1">
            Cabang: <span className="font-semibold">{currentBranch.name}</span>
          </p>
        )}
      </div>

      {!currentBranch && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              ⚠️ Silakan pilih cabang terlebih dahulu untuk melakukan pembelian
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Form Pembelian Baru</CardTitle>
          <CardDescription>
            Tambahkan pembelian barang dari supplier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Nama Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Masukkan nama supplier"
                disabled={!currentBranch}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Tanggal Pembelian</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={!currentBranch}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Tambah Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  disabled={!currentBranch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  disabled={!currentBranch}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Harga Satuan</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  disabled={!currentBranch}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={addItem}
                  className="w-full"
                  disabled={!currentBranch}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.costPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {calculateSubtotal().toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Biaya Pengiriman</Label>
              <Input
                id="shippingCost"
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0"
                min="0"
                disabled={!currentBranch}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCosts">Biaya Lainnya</Label>
              <Input
                id="otherCosts"
                type="number"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
                placeholder="0"
                min="0"
                disabled={!currentBranch}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xl font-bold">
              Total: Rp {calculateTotal().toLocaleString("id-ID")}
            </div>
            <Button
              onClick={savePurchase}
              size="lg"
              disabled={!currentBranch || items.length === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Simpan Pembelian
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian</CardTitle>
          <CardDescription>
            Daftar pembelian yang telah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada data pembelian
            </p>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{purchase.supplier}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(purchase.purchaseDate),
                          "dd MMMM yyyy",
                          { locale: localeId }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dibuat oleh: {purchase.createdBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        Rp {purchase.totalCost.toLocaleString("id-ID")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePurchase(purchase.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {purchase.items.length} item -{" "}
                      {purchase.items
                        .map((item) => `${item.productName} (${item.quantity})`)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}