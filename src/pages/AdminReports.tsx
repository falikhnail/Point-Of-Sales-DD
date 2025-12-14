import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SalesReportContent from '@/components/SalesReportContent';

export default function AdminReports() {
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
      <SalesReportContent />
    </div>
  );
}