import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  FileJson,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Activity,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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

interface DataSummary {
  category: string;
  icon: React.ReactNode;
  totalRecords: number;
  dateRange: { oldest: string; newest: string } | null;
  metrics: { label: string; value: string | number }[];
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastBackup: string | null;
  dataSize: string;
  preview: unknown[];
}

interface BackupData {
  version: string;
  timestamp: string;
  sales: unknown[];
  purchases: Purchase[];
  shifts: unknown[];
  operationalCosts: unknown[];
  activityLogs: unknown[];
  products: unknown[];
  users: unknown[];
}

const AdminBackup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<DataSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadDataSummaries();
  }, [user, navigate]);

  const loadDataSummaries = () => {
    // Menggunakan key localStorage yang benar sesuai dengan sistem
    const sales = JSON.parse(localStorage.getItem('dimsum_transactions') || '[]') as unknown[];
    const purchases = JSON.parse(localStorage.getItem('dimsum_purchases') || '[]') as Purchase[];
    const shifts = JSON.parse(localStorage.getItem('dimsum_shifts') || '[]') as unknown[];
    const operationalCosts = JSON.parse(localStorage.getItem('dimsum_operational_costs') || '[]') as unknown[];
    const activityLogs = JSON.parse(localStorage.getItem('dimsum_activity_logs') || '[]') as unknown[];
    const products = JSON.parse(localStorage.getItem('dimsum_products') || '[]') as unknown[];
    const users = JSON.parse(localStorage.getItem('dimsum_users') || '[]') as unknown[];
    const lastBackup = localStorage.getItem('lastBackupTimestamp');

    const getDateRange = (data: unknown[], dateField: string = 'date') => {
      if (data.length === 0) return null;
      const dates = data.map(item => {
        const typedItem = item as Record<string, unknown>;
        // Handle different date formats
        const dateValue = typedItem[dateField] || typedItem.timestamp || typedItem.createdAt || typedItem.purchaseDate;
        return new Date(dateValue as string);
      }).filter(d => !isNaN(d.getTime()));
      if (dates.length === 0) return null;
      return {
        oldest: format(new Date(Math.min(...dates.map(d => d.getTime()))), 'dd MMM yyyy', { locale: id }),
        newest: format(new Date(Math.max(...dates.map(d => d.getTime()))), 'dd MMM yyyy', { locale: id })
      };
    };

    const getHealthStatus = (count: number, threshold: { warning: number; critical: number }): 'healthy' | 'warning' | 'critical' => {
      if (count === 0) return 'critical';
      if (count < threshold.critical) return 'critical';
      if (count < threshold.warning) return 'warning';
      return 'healthy';
    };

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const summariesData: DataSummary[] = [
      {
        category: 'Transaksi Penjualan',
        icon: <TrendingUp className="h-5 w-5" />,
        totalRecords: sales.length,
        dateRange: getDateRange(sales),
        metrics: [
          { label: 'Total Penjualan', value: `Rp ${sales.reduce((sum, s) => sum + ((s as Record<string, unknown>).total as number || (s as Record<string, unknown>).totalAmount as number || 0), 0).toLocaleString('id-ID')}` },
          { label: 'Rata-rata per Transaksi', value: sales.length > 0 ? `Rp ${Math.round(sales.reduce((sum, s) => sum + ((s as Record<string, unknown>).total as number || (s as Record<string, unknown>).totalAmount as number || 0), 0) / sales.length).toLocaleString('id-ID')}` : 'Rp 0' },
          { label: 'Total Item Terjual', value: sales.reduce((sum, s) => sum + (((s as Record<string, unknown>).items as unknown[] | undefined)?.length || 0), 0) }
        ],
        healthStatus: getHealthStatus(sales.length, { warning: 10, critical: 5 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(sales).length),
        preview: sales.slice(-5).reverse()
      },
      {
        category: 'Transaksi Pembelian',
        icon: <Package className="h-5 w-5" />,
        totalRecords: purchases.length,
        dateRange: getDateRange(purchases, 'purchaseDate'),
        metrics: [
          { label: 'Total Pembelian', value: `Rp ${purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString('id-ID')}` },
          { label: 'Rata-rata per Transaksi', value: purchases.length > 0 ? `Rp ${Math.round(purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0) / purchases.length).toLocaleString('id-ID')}` : 'Rp 0' },
          { label: 'Total Item Dibeli', value: purchases.reduce((sum, p) => sum + (p.items?.reduce((itemSum: number, item: PurchaseItem) => itemSum + (item.quantity || 0), 0) || 0), 0) }
        ],
        healthStatus: getHealthStatus(purchases.length, { warning: 5, critical: 2 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(purchases).length),
        preview: purchases.slice(-5).reverse()
      },
      {
        category: 'Data Shift Kasir',
        icon: <Users className="h-5 w-5" />,
        totalRecords: shifts.length,
        dateRange: getDateRange(shifts, 'startTime'),
        metrics: [
          { label: 'Total Shift', value: shifts.length },
          { label: 'Shift Aktif', value: shifts.filter(s => (s as Record<string, unknown>).status === 'active').length },
          { label: 'Shift Selesai', value: shifts.filter(s => (s as Record<string, unknown>).status === 'closed').length }
        ],
        healthStatus: getHealthStatus(shifts.length, { warning: 10, critical: 5 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(shifts).length),
        preview: shifts.slice(-5).reverse()
      },
      {
        category: 'Biaya Operasional',
        icon: <DollarSign className="h-5 w-5" />,
        totalRecords: operationalCosts.length,
        dateRange: getDateRange(operationalCosts),
        metrics: [
          { label: 'Total Biaya', value: `Rp ${operationalCosts.reduce((sum, c) => sum + ((c as Record<string, unknown>).amount as number || 0), 0).toLocaleString('id-ID')}` },
          { label: 'Rata-rata per Hari', value: operationalCosts.length > 0 ? `Rp ${Math.round(operationalCosts.reduce((sum, c) => sum + ((c as Record<string, unknown>).amount as number || 0), 0) / operationalCosts.length).toLocaleString('id-ID')}` : 'Rp 0' },
          { label: 'Total Kategori', value: new Set(operationalCosts.map(c => (c as Record<string, unknown>).category)).size }
        ],
        healthStatus: getHealthStatus(operationalCosts.length, { warning: 5, critical: 2 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(operationalCosts).length),
        preview: operationalCosts.slice(-5).reverse()
      },
      {
        category: 'Log Aktivitas',
        icon: <Activity className="h-5 w-5" />,
        totalRecords: activityLogs.length,
        dateRange: getDateRange(activityLogs, 'timestamp'),
        metrics: [
          { label: 'Total Aktivitas', value: activityLogs.length },
          { label: 'Aktivitas Hari Ini', value: activityLogs.filter(l => new Date((l as Record<string, unknown>).timestamp as string).toDateString() === new Date().toDateString()).length },
          { label: 'User Aktif', value: new Set(activityLogs.map(l => (l as Record<string, unknown>).userId)).size }
        ],
        healthStatus: getHealthStatus(activityLogs.length, { warning: 20, critical: 10 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(activityLogs).length),
        preview: activityLogs.slice(-5).reverse()
      },
      {
        category: 'Data Produk',
        icon: <Package className="h-5 w-5" />,
        totalRecords: products.length,
        dateRange: null,
        metrics: [
          { label: 'Total Produk', value: products.length },
          { label: 'Produk Aktif', value: products.filter(p => (p as Record<string, unknown>).stock as number > 0).length },
          { label: 'Stok Rendah', value: products.filter(p => (p as Record<string, unknown>).stock as number < 10 && (p as Record<string, unknown>).stock as number > 0).length }
        ],
        healthStatus: getHealthStatus(products.length, { warning: 5, critical: 2 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(products).length),
        preview: products.slice(0, 5)
      },
      {
        category: 'Data Pengguna',
        icon: <Users className="h-5 w-5" />,
        totalRecords: users.length,
        dateRange: null,
        metrics: [
          { label: 'Total User', value: users.length },
          { label: 'Admin', value: users.filter(u => (u as Record<string, unknown>).role === 'admin').length },
          { label: 'Kasir', value: users.filter(u => (u as Record<string, unknown>).role === 'cashier').length }
        ],
        healthStatus: getHealthStatus(users.length, { warning: 2, critical: 1 }),
        lastBackup,
        dataSize: formatBytes(JSON.stringify(users).length),
        preview: users.slice(0, 5)
      }
    ];

    setSummaries(summariesData);
  };

  const handleBackupAll = async () => {
    setLoading(true);
    setProgress(0);
    setMessage(null);

    try {
      const backupData: BackupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        sales: JSON.parse(localStorage.getItem('dimsum_transactions') || '[]') as unknown[],
        purchases: JSON.parse(localStorage.getItem('dimsum_purchases') || '[]') as Purchase[],
        shifts: JSON.parse(localStorage.getItem('dimsum_shifts') || '[]') as unknown[],
        operationalCosts: JSON.parse(localStorage.getItem('dimsum_operational_costs') || '[]') as unknown[],
        activityLogs: JSON.parse(localStorage.getItem('dimsum_activity_logs') || '[]') as unknown[],
        products: JSON.parse(localStorage.getItem('dimsum_products') || '[]') as unknown[],
        users: JSON.parse(localStorage.getItem('dimsum_users') || '[]') as unknown[]
      };

      setProgress(50);

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dimsum-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);

      // Save last backup timestamp
      localStorage.setItem('lastBackupTimestamp', new Date().toISOString());

      setMessage({ type: 'success', text: 'Backup berhasil! File telah diunduh.' });
      loadDataSummaries();
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ type: 'error', text: 'Gagal melakukan backup. Silakan coba lagi.' });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setMessage({ type: 'error', text: 'File harus berformat JSON!' });
        return;
      }
      setImportFile(file);
      setImportConfirm(true);
      setMessage({ type: 'info', text: `File "${file.name}" siap diimport. Konfirmasi untuk melanjutkan.` });
    }
  };

  const handleImport = async (mode: 'merge' | 'replace') => {
    if (!importFile) return;

    setLoading(true);
    setProgress(0);
    setMessage(null);

    try {
      const text = await importFile.text();
      const data: BackupData = JSON.parse(text);

      setProgress(20);

      // Validate data structure
      if (!data.version || !data.timestamp) {
        throw new Error('Format file backup tidak valid!');
      }

      setProgress(40);

      if (mode === 'replace') {
        // Replace mode: overwrite all data
        localStorage.setItem('dimsum_transactions', JSON.stringify(data.sales || []));
        localStorage.setItem('dimsum_purchases', JSON.stringify(data.purchases || []));
        localStorage.setItem('dimsum_shifts', JSON.stringify(data.shifts || []));
        localStorage.setItem('dimsum_operational_costs', JSON.stringify(data.operationalCosts || []));
        localStorage.setItem('dimsum_activity_logs', JSON.stringify(data.activityLogs || []));
        localStorage.setItem('dimsum_products', JSON.stringify(data.products || []));
        localStorage.setItem('dimsum_users', JSON.stringify(data.users || []));
        
        // Also update purchaseHistory for backward compatibility with reports
        const purchaseHistory = (data.purchases || []).map((p: Purchase) => ({
          id: p.id,
          date: p.purchaseDate,
          supplier: p.supplier,
          items: p.items?.map((item: PurchaseItem) => ({
            product: item.productName,
            quantity: item.quantity,
            cost: item.costPrice,
            total: item.subtotal
          })) || [],
          totalCost: p.totalCost,
          shippingCost: p.shippingCost || 0,
          otherCosts: p.otherCosts || 0
        }));
        localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
      } else {
        // Merge mode: combine with existing data
        const mergeSales = [...JSON.parse(localStorage.getItem('dimsum_transactions') || '[]') as unknown[], ...(data.sales || [])];
        const mergePurchases = [...JSON.parse(localStorage.getItem('dimsum_purchases') || '[]') as Purchase[], ...(data.purchases || [])];
        const mergeShifts = [...JSON.parse(localStorage.getItem('dimsum_shifts') || '[]') as unknown[], ...(data.shifts || [])];
        const mergeCosts = [...JSON.parse(localStorage.getItem('dimsum_operational_costs') || '[]') as unknown[], ...(data.operationalCosts || [])];
        const mergeLogs = [...JSON.parse(localStorage.getItem('dimsum_activity_logs') || '[]') as unknown[], ...(data.activityLogs || [])];
        
        // For products and users, merge by ID to avoid duplicates
        const existingProducts = JSON.parse(localStorage.getItem('dimsum_products') || '[]') as Array<Record<string, unknown>>;
        const mergeProducts = [...existingProducts];
        (data.products || []).forEach(newProd => {
          const typedNewProd = newProd as Record<string, unknown>;
          const existingIndex = mergeProducts.findIndex(p => p.id === typedNewProd.id);
          if (existingIndex >= 0) {
            mergeProducts[existingIndex] = typedNewProd;
          } else {
            mergeProducts.push(typedNewProd);
          }
        });

        const existingUsers = JSON.parse(localStorage.getItem('dimsum_users') || '[]') as Array<Record<string, unknown>>;
        const mergeUsers = [...existingUsers];
        (data.users || []).forEach(newUser => {
          const typedNewUser = newUser as Record<string, unknown>;
          const existingIndex = mergeUsers.findIndex(u => u.id === typedNewUser.id);
          if (existingIndex >= 0) {
            mergeUsers[existingIndex] = typedNewUser;
          } else {
            mergeUsers.push(typedNewUser);
          }
        });

        localStorage.setItem('dimsum_transactions', JSON.stringify(mergeSales));
        localStorage.setItem('dimsum_purchases', JSON.stringify(mergePurchases));
        localStorage.setItem('dimsum_shifts', JSON.stringify(mergeShifts));
        localStorage.setItem('dimsum_operational_costs', JSON.stringify(mergeCosts));
        localStorage.setItem('dimsum_activity_logs', JSON.stringify(mergeLogs));
        localStorage.setItem('dimsum_products', JSON.stringify(mergeProducts));
        localStorage.setItem('dimsum_users', JSON.stringify(mergeUsers));
        
        // Also update purchaseHistory for backward compatibility with reports
        const existingPurchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]') as Array<Record<string, unknown>>;
        const newPurchaseHistory = (data.purchases || []).map((p: Purchase) => ({
          id: p.id,
          date: p.purchaseDate,
          supplier: p.supplier,
          items: p.items?.map((item: PurchaseItem) => ({
            product: item.productName,
            quantity: item.quantity,
            cost: item.costPrice,
            total: item.subtotal
          })) || [],
          totalCost: p.totalCost,
          shippingCost: p.shippingCost || 0,
          otherCosts: p.otherCosts || 0
        }));
        
        // Merge purchase history by ID
        const mergedPurchaseHistory = [...existingPurchaseHistory];
        newPurchaseHistory.forEach((newP: Record<string, unknown>) => {
          const existingIndex = mergedPurchaseHistory.findIndex((p: Record<string, unknown>) => p.id === newP.id);
          if (existingIndex >= 0) {
            mergedPurchaseHistory[existingIndex] = newP;
          } else {
            mergedPurchaseHistory.push(newP);
          }
        });
        localStorage.setItem('purchaseHistory', JSON.stringify(mergedPurchaseHistory));
      }

      setProgress(80);

      // Log activity
      const activityLogs = JSON.parse(localStorage.getItem('dimsum_activity_logs') || '[]') as unknown[];
      activityLogs.push({
        id: Date.now().toString(),
        userId: user?.id,
        userName: user?.name,
        action: `Import data (${mode})`,
        details: `Import dari file: ${importFile.name}`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('dimsum_activity_logs', JSON.stringify(activityLogs));

      setProgress(100);

      setMessage({ 
        type: 'success', 
        text: `Import berhasil! Data telah ${mode === 'merge' ? 'digabungkan' : 'diganti'} dengan data dari backup.` 
      });
      
      loadDataSummaries();
      setImportConfirm(false);
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Gagal mengimport data. Pastikan file backup valid.' 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getHealthBadge = (status: 'healthy' | 'warning' | 'critical') => {
    const config = {
      healthy: { label: 'Sehat', variant: 'default' as const, className: 'bg-green-500' },
      warning: { label: 'Perhatian', variant: 'secondary' as const, className: 'bg-yellow-500' },
      critical: { label: 'Kritis', variant: 'destructive' as const, className: 'bg-red-500' }
    };
    const { label, variant, className } = config[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup & Import Data</h1>
          <p className="text-muted-foreground mt-1">
            Kelola backup dan import data transaksi sistem
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          Kembali
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {message.type === 'info' && <Info className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {progress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup Semua Data
            </CardTitle>
            <CardDescription>
              Download semua data transaksi dalam format JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBackupAll} 
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Memproses...' : 'Backup Sekarang'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Restore data dari file backup JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file"
              disabled={loading}
            />
            <label htmlFor="import-file">
              <Button 
                variant="outline" 
                className="w-full"
                disabled={loading}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Pilih File Backup
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Import Confirmation */}
      {importConfirm && importFile && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Konfirmasi Import
            </CardTitle>
            <CardDescription>
              File: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Pilih mode import: <strong>Merge</strong> untuk menggabungkan dengan data existing, 
                atau <strong>Replace</strong> untuk mengganti semua data.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleImport('merge')} 
                disabled={loading}
                variant="default"
                className="flex-1"
              >
                <Database className="mr-2 h-4 w-4" />
                Merge Data
              </Button>
              <Button 
                onClick={() => handleImport('replace')} 
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Replace Data
              </Button>
              <Button 
                onClick={() => {
                  setImportConfirm(false);
                  setImportFile(null);
                  setMessage(null);
                }} 
                disabled={loading}
                variant="outline"
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Summaries */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Ringkasan Data
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {summaries.map((summary, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {summary.icon}
                    {summary.category}
                  </CardTitle>
                  {getHealthBadge(summary.healthStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Record</p>
                    <p className="text-2xl font-bold">{summary.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ukuran Data</p>
                    <p className="text-2xl font-bold">{summary.dataSize}</p>
                  </div>
                </div>

                {/* Date Range */}
                {summary.dateRange && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {summary.dateRange.oldest} - {summary.dateRange.newest}
                    </span>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-2">
                  {summary.metrics.map((metric, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">{metric.value}</span>
                    </div>
                  ))}
                </div>

                {/* Last Backup */}
                {summary.lastBackup && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Backup terakhir: {format(new Date(summary.lastBackup), 'dd MMM yyyy HH:mm', { locale: id })}
                  </div>
                )}

                {/* Preview Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedPreview(selectedPreview === summary.category ? null : summary.category)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {selectedPreview === summary.category ? 'Sembunyikan' : 'Lihat'} Preview
                </Button>

                {/* Preview Data */}
                {selectedPreview === summary.category && summary.preview.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Data Terbaru ({summary.preview.length} record)</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {summary.preview.map((item, idx) => (
                        <div key={idx} className="text-xs bg-background p-2 rounded border">
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informasi Penting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• File backup dalam format JSON dapat dibuka dengan text editor</p>
          <p>• Mode <strong>Merge</strong> menggabungkan data baru dengan data existing</p>
          <p>• Mode <strong>Replace</strong> menghapus semua data existing dan menggantinya dengan data backup</p>
          <p>• Backup secara berkala untuk menghindari kehilangan data</p>
          <p>• Simpan file backup di tempat yang aman</p>
          <p>• Sistem menggunakan key localStorage: dimsum_transactions, dimsum_purchases, dimsum_shifts, dimsum_operational_costs, dimsum_activity_logs, dimsum_products, dimsum_users</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackup;