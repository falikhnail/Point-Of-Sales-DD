import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import AdminPOS from '../pages/AdminPOS';
import ProductManagement from '../pages/ProductManagement';
import AdminUserManagement from '../pages/AdminUserManagement';
import LaporanPenjualan from '../pages/LaporanPenjualan';
import LaporanPembelian from '../pages/LaporanPembelian';
import LaporanStok from '../pages/LaporanStok';
import LaporanLabaRugi from '../pages/LaporanLabaRugi';
import LaporanProfitProduk from '../pages/LaporanProfitProduk';
import LaporanCashflow from '../pages/LaporanCashflow';
import AdminCashierReports from '../pages/AdminCashierReports';
import AdminActivityLog from '../pages/AdminActivityLog';
import AdminShiftManagement from '../pages/AdminShiftManagement';
import AdminOperationalCosts from '../pages/AdminOperationalCosts';
import AdminBackup from '../pages/AdminBackup';
import CashierDashboard from '../pages/CashierDashboard';
import PurchaseManagement from '../pages/PurchaseManagement';
import Sidebar from './Sidebar';

export default function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === 'cashier') {
    return (
      <Routes>
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
        <Route path="*" element={<Navigate to="/cashier/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pos" element={<AdminPOS />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/purchases" element={<PurchaseManagement />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/shifts" element={<AdminShiftManagement />} />
          <Route path="/admin/operational-costs" element={<AdminOperationalCosts />} />
          <Route path="/admin/cashier-reports" element={<AdminCashierReports />} />
          <Route path="/admin/activity-log" element={<AdminActivityLog />} />
          <Route path="/admin/backup" element={<AdminBackup />} />
          <Route path="/admin/laporan-penjualan" element={<LaporanPenjualan />} />
          <Route path="/admin/laporan-pembelian" element={<LaporanPembelian />} />
          <Route path="/admin/laporan-stok" element={<LaporanStok />} />
          <Route path="/admin/laporan-laba-rugi" element={<LaporanLabaRugi />} />
          <Route path="/admin/laporan-profit-produk" element={<LaporanProfitProduk />} />
          <Route path="/admin/laporan-cashflow" element={<LaporanCashflow />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}