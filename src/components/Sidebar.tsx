import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, FileText, Package, Users, LogOut, DollarSign, Activity, Clock, Briefcase, TrendingUp, TrendingDown, Wallet, ShoppingBag, Database, Store, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BranchSelector from './BranchSelector';

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/multi-branch', icon: BarChart3, label: 'Multi Cabang' },
    { path: '/admin/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/admin/products', icon: Package, label: 'Manajemen Produk' },
    { path: '/admin/purchases', icon: ShoppingBag, label: 'Pembelian' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/branches', icon: Store, label: 'Manajemen Cabang' },
    { path: '/admin/shifts', icon: Clock, label: 'Shift Management' },
    { path: '/admin/operational-costs', icon: Briefcase, label: 'Biaya Operasional' },
    { path: '/admin/activity-log', icon: FileText, label: 'Activity Log' },
    { path: '/admin/backup', icon: Database, label: 'Backup Data' },
  ];

  const reportItems = [
    { path: '/admin/laporan-penjualan', icon: TrendingUp, label: 'Laporan Penjualan' },
    { path: '/admin/cashier-reports', icon: Activity, label: 'Laporan Kasir' },
    { path: '/admin/laporan-pembelian', icon: TrendingDown, label: 'Laporan Pembelian' },
    { path: '/admin/laporan-stok', icon: Package, label: 'Laporan Stok' },
    { path: '/admin/laporan-laba-rugi', icon: DollarSign, label: 'Laba Rugi' },
    { path: '/admin/laporan-profit-produk', icon: TrendingUp, label: 'Profit per Produk' },
    { path: '/admin/laporan-cashflow', icon: Wallet, label: 'Cashflow' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Dimsum POS</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.username}</p>
        <div className="mt-4">
          <BranchSelector />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">
            Laporan
          </p>
        </div>

        {reportItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}