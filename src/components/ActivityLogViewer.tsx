import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, Filter } from 'lucide-react';
import { ActivityLog } from '@/types';
import { getStoredActivityLogs, getActivityLogsByDateRange, getActivityLogsByType } from '@/lib/shiftStorage';

export default function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, selectedType, searchQuery, startDate, endDate]);

  const loadLogs = () => {
    const allLogs = getStoredActivityLogs();
    setLogs(allLogs);
    
    // Set default date range (today)
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    setStartDate(weekAgo.toISOString().split('T')[0]);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(log => log.actionType === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        (log.details && log.details.toLowerCase().includes(query))
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredLogs(filtered);
  };

  const getActionTypeBadge = (type: ActivityLog['actionType']) => {
    const badges = {
      login: { color: 'bg-green-500', label: 'Login' },
      logout: { color: 'bg-gray-500', label: 'Logout' },
      transaction: { color: 'bg-blue-500', label: 'Transaksi' },
      shift_open: { color: 'bg-yellow-500', label: 'Buka Shift' },
      shift_close: { color: 'bg-orange-500', label: 'Tutup Shift' },
      product_update: { color: 'bg-purple-500', label: 'Update Produk' },
      other: { color: 'bg-gray-400', label: 'Lainnya' },
    };

    const badge = badges[type] || badges.other;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getRoleBadge = (role: 'cashier' | 'admin') => {
    return role === 'admin' ? (
      <Badge variant="destructive">Admin</Badge>
    ) : (
      <Badge variant="secondary">Kasir</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-600" />
            Filter Log Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Cari</Label>
              <Input
                placeholder="Nama kasir atau aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="transaction">Transaksi</SelectItem>
                  <SelectItem value="shift_open">Buka Shift</SelectItem>
                  <SelectItem value="shift_close">Tutup Shift</SelectItem>
                  <SelectItem value="product_update">Update Produk</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Log Aktivitas
            </span>
            <Badge variant="secondary">{filteredLogs.length} aktivitas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Tidak ada log aktivitas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">{log.userName}</TableCell>
                      <TableCell>{getRoleBadge(log.userRole)}</TableCell>
                      <TableCell>{getActionTypeBadge(log.actionType)}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {log.details || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}