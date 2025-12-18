import { useState, useEffect } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Store, Copy } from 'lucide-react';
import { Branch } from '@/types/branch';
import { useToast } from '@/hooks/use-toast';
import { copyProductsToBranch } from '@/lib/branchStorage';

export default function BranchManagement() {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranch();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copySourceBranch, setCopySourceBranch] = useState<string>('');
  const [copyTargetBranch, setCopyTargetBranch] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name,
        code: editingBranch.code,
        address: editingBranch.address,
        phone: editingBranch.phone,
        email: editingBranch.email || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
      });
    }
  }, [editingBranch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.address || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field yang wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    if (editingBranch) {
      updateBranch(editingBranch.id, formData);
      toast({
        title: 'Berhasil',
        description: 'Data cabang berhasil diperbarui',
      });
    } else {
      const newBranch: Branch = {
        id: `branch-${Date.now()}`,
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      addBranch(newBranch);
      toast({
        title: 'Berhasil',
        description: 'Cabang baru berhasil ditambahkan',
      });
    }

    setIsDialogOpen(false);
    setEditingBranch(null);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (branches.length === 1) {
      toast({
        title: 'Error',
        description: 'Tidak dapat menghapus cabang terakhir',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus cabang ini?')) {
      deleteBranch(id);
      toast({
        title: 'Berhasil',
        description: 'Cabang berhasil dihapus',
      });
    }
  };

  const handleToggleStatus = (branch: Branch) => {
    updateBranch(branch.id, { isActive: !branch.isActive });
    toast({
      title: 'Berhasil',
      description: `Cabang ${branch.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
    });
  };

  const handleCopyProducts = () => {
    if (!copySourceBranch || !copyTargetBranch) {
      toast({
        title: 'Error',
        description: 'Pilih cabang sumber dan tujuan',
        variant: 'destructive',
      });
      return;
    }

    if (copySourceBranch === copyTargetBranch) {
      toast({
        title: 'Error',
        description: 'Cabang sumber dan tujuan tidak boleh sama',
        variant: 'destructive',
      });
      return;
    }

    copyProductsToBranch(copySourceBranch, copyTargetBranch);
    toast({
      title: 'Berhasil',
      description: 'Produk berhasil disalin ke cabang tujuan',
    });
    setIsCopyDialogOpen(false);
    setCopySourceBranch('');
    setCopyTargetBranch('');
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Store className="h-6 w-6" />
                Manajemen Cabang
              </CardTitle>
              <CardDescription>
                Kelola data cabang restoran Dimsum Mpok Rani
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCopyDialogOpen(true)}
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                Salin Produk
              </Button>
              <Button
                onClick={() => {
                  setEditingBranch(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Cabang
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Cabang</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.code}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell>{branch.email || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={branch.isActive ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(branch)}
                    >
                      {branch.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(branch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(branch.id)}
                        disabled={branches.length === 1}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi informasi cabang dengan lengkap
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Kode Cabang *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="PST, CBD, JKT"
                  maxLength={5}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Cabang *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Cabang Pusat"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Jl. Raya Utama No. 123"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telepon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="021-12345678"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="cabang@dimsummpokrani.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingBranch(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salin Katalog Produk</DialogTitle>
            <DialogDescription>
              Salin semua produk dari satu cabang ke cabang lain
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Cabang Sumber</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={copySourceBranch}
                onChange={(e) => setCopySourceBranch(e.target.value)}
              >
                <option value="">Pilih cabang sumber</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Cabang Tujuan</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={copyTargetBranch}
                onChange={(e) => setCopyTargetBranch(e.target.value)}
              >
                <option value="">Pilih cabang tujuan</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCopyDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleCopyProducts}>Salin Produk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}