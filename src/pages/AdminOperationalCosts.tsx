import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Plus, Pencil, Trash2, X, Wallet, TrendingDown } from 'lucide-react';
import { OperationalCost } from '@/types';
import { 
  getStoredOperationalCosts, 
  saveOperationalCost, 
  updateOperationalCost, 
  deleteOperationalCost,
  getOperationalCostsByDateRange 
} from '@/lib/storage';
import { cn } from '@/lib/utils';

const COST_CATEGORIES = [
  'Listrik/Air/Gas',
  'Gaji Karyawan',
  'Biaya Bahan Baku',
  'Sewa Tempat',
  'Perawatan Peralatan',
  'Lain-lain'
];

export default function AdminOperationalCosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [costs, setCosts] = useState<OperationalCost[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<OperationalCost[]>([]);
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState<string>('');
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadCosts();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [costs, filterCategory, filterStartDate, filterEndDate]);

  const loadCosts = () => {
    const loadedCosts = getStoredOperationalCosts();
    setCosts(loadedCosts.sort((a, b) => b.timestamp - a.timestamp));
  };

  const applyFilters = () => {
    let filtered = [...costs];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(cost => cost.category === filterCategory);
    }

    // Filter by date range
    if (filterStartDate && filterEndDate) {
      filtered = getOperationalCostsByDateRange(filterStartDate, filterEndDate)
        .filter(cost => filterCategory === 'all' || cost.category === filterCategory)
        .sort((a, b) => b.timestamp - a.timestamp);
    }

    setFilteredCosts(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !description) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Jumlah biaya harus berupa angka positif');
      return;
    }

    const costData: OperationalCost = {
      id: isEditing && editingId ? editingId : `cost_${Date.now()}`,
      category,
      amount: numAmount,
      date: date.toISOString(),
      timestamp: date.getTime(),
      description
    };

    if (isEditing && editingId) {
      updateOperationalCost(editingId, costData);
      toast.success('Biaya operasional berhasil diupdate');
    } else {
      saveOperationalCost(costData);
      toast.success('Biaya operasional berhasil ditambahkan');
    }

    resetForm();
    loadCosts();
  };

  const handleEdit = (cost: OperationalCost) => {
    setIsEditing(true);
    setEditingId(cost.id);
    setCategory(cost.category);
    setAmount(cost.amount.toString());
    setDate(new Date(cost.timestamp));
    setDescription(cost.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus biaya operasional ini?')) {
      deleteOperationalCost(id);
      toast.success('Biaya operasional berhasil dihapus');
      loadCosts();
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setCategory('');
    setAmount('');
    setDate(new Date());
    setDescription('');
  };

  const calculateTotalCosts = () => {
    return filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const formatRupiah = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setAmount(value);
  };

  return (
    <div className="flex-1 lg:ml-0">
      <div className="lg:hidden h-16"></div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-8 w-8 text-orange-600" />
            Manajemen Biaya Operasional
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola dan pantau biaya operasional harian restoran
          </p>
        </div>

        {/* Form Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isEditing ? 'Edit Biaya Operasional' : 'Tambah Biaya Operasional'}</span>
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" />
                  Batal
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Update data biaya operasional' : 'Catat biaya operasional baru'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori Biaya *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Biaya (Rp) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0"
                      value={formatRupiah(amount)}
                      onChange={handleAmountChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: id }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Deskripsi *</Label>
                  <Textarea
                    id="description"
                    placeholder="Contoh: Pembayaran listrik bulan Desember"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {isEditing ? (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Update Biaya
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Simpan Biaya
                    </>
                  )}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Biaya</CardTitle>
            <CardDescription>Filter berdasarkan kategori dan rentang tanggal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {COST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(filterCategory !== 'all' || filterStartDate || filterEndDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterStartDate(undefined);
                  setFilterEndDate(undefined);
                }}
                className="mt-4"
              >
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Biaya Operasional</p>
                <p className="text-3xl font-bold text-orange-600">
                  Rp {calculateTotalCosts().toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredCosts.length} entri biaya
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Biaya Operasional</CardTitle>
            <CardDescription>
              Daftar lengkap biaya operasional yang telah dicatat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.length > 0 ? (
                    filteredCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          {format(new Date(cost.timestamp), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {cost.category}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {cost.description}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Rp {cost.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cost)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cost.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Belum ada data biaya operasional. Silakan tambahkan biaya baru.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}