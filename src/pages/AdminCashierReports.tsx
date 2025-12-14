import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CashierReports from '@/components/CashierReports';

export default function AdminCashierReports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  return (
    <div className="flex-1 lg:p-6 p-4 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            Laporan Performa Kasir
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Analisis performa dan aktivitas kasir berdasarkan shift
          </p>
        </div>
        <CashierReports />
      </div>
    </div>
  );
}