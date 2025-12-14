import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getStoredShifts, setStoredShifts, getStoredTransactions } from '@/lib/storage';
import { determineShiftType } from '@/lib/shiftStorage';

interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  startingCash: number;
  endingCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  status: 'active' | 'closed';
  notes?: string;
  shiftType?: 'pagi' | 'siang' | 'malam';
}

interface Transaction {
  id: string;
  cashierId: string;
  date: string;
  paymentMethod: string;
  totalAmount: number;
  items?: unknown[];
}

interface ShiftManagementProps {
  cashierId?: string;
  cashierName?: string;
}

export default function ShiftManagement({
  cashierId,
  cashierName,
}: ShiftManagementProps) {
  const [shifts, setShiftsState] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [endingCash, setEndingCash] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadShifts();
  }, [cashierId]);

  const loadShifts = () => {
    const allShifts = getStoredShifts() as Shift[];
    setShiftsState(allShifts);

    if (cashierId) {
      const active = allShifts.find(
        (s: Shift) => s.cashierId === cashierId && s.status === 'active'
      );
      setActiveShift(active || null);
    }
  };

  const saveShifts = (updatedShifts: Shift[]) => {
    setStoredShifts(updatedShifts);
    setShiftsState(updatedShifts);
  };

  const handleStartShift = () => {
    if (!cashierId || !cashierName) return;

    const now = new Date();
    const shiftType = determineShiftType(now.getTime());

    const newShift: Shift = {
      id: Date.now().toString(),
      cashierId,
      cashierName,
      startTime: now.toISOString(),
      endTime: null,
      startingCash: parseFloat(startingCash),
      endingCash: null,
      expectedCash: null,
      difference: null,
      status: 'active',
      shiftType,
    };

    const updatedShifts = [...shifts, newShift];
    saveShifts(updatedShifts);
    setActiveShift(newShift);
    setIsStartDialogOpen(false);
    setStartingCash('');
  };

  const handleEndShift = () => {
    if (!activeShift) return;

    const transactions = getStoredTransactions() as Transaction[];
    const shiftTransactions = transactions.filter(
      (t: Transaction) =>
        t.cashierId === activeShift.cashierId &&
        new Date(t.date) >= new Date(activeShift.startTime)
    );

    const cashSales = shiftTransactions
      .filter((t: Transaction) => t.paymentMethod === 'Cash')
      .reduce((sum: number, t: Transaction) => sum + t.totalAmount, 0);

    const expectedCash = activeShift.startingCash + cashSales;
    const actualEndingCash = parseFloat(endingCash);
    const difference = actualEndingCash - expectedCash;

    const updatedShift: Shift = {
      ...activeShift,
      endTime: new Date().toISOString(),
      endingCash: actualEndingCash,
      expectedCash,
      difference,
      status: 'closed',
      notes,
    };

    const updatedShifts = shifts.map((s) =>
      s.id === activeShift.id ? updatedShift : s
    );

    saveShifts(updatedShifts);
    setActiveShift(null);
    setIsEndDialogOpen(false);
    setEndingCash('');
    setNotes('');
  };

  const userShifts = cashierId
    ? shifts.filter((s) => s.cashierId === cashierId)
    : shifts;

  return (
    <div className="space-y-6">
      {/* Active Shift Status */}
      {activeShift && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Clock className="mr-2 h-5 w-5" />
              Shift Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Kasir</p>
                <p className="text-lg font-semibold">{activeShift.cashierName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Mulai</p>
                <p className="text-lg font-semibold">
                  {format(new Date(activeShift.startTime), 'HH:mm, dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modal Awal</p>
                <p className="text-lg font-semibold">
                  Rp {activeShift.startingCash.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              className="mt-4"
              variant="destructive"
              onClick={() => setIsEndDialogOpen(true)}
            >
              Tutup Shift
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Start Shift Button */}
      {!activeShift && cashierId && (
        <Button onClick={() => setIsStartDialogOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Mulai Shift
        </Button>
      )}

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kasir</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Modal Awal</TableHead>
                <TableHead>Kas Akhir</TableHead>
                <TableHead>Selisih</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userShifts
                .sort(
                  (a, b) =>
                    new Date(b.startTime).getTime() -
                    new Date(a.startTime).getTime()
                )
                .map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.cashierName}</TableCell>
                    <TableCell>
                      {format(new Date(shift.startTime), 'HH:mm, dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {shift.endTime
                        ? format(new Date(shift.endTime), 'HH:mm, dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      Rp {shift.startingCash.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {shift.endingCash
                        ? `Rp ${shift.endingCash.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {shift.difference !== null ? (
                        <span
                          className={
                            shift.difference >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          Rp {shift.difference.toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          shift.status === 'active'
                            ? 'text-green-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {shift.status === 'active' ? 'Aktif' : 'Selesai'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Start Shift Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Shift Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashier">Kasir</Label>
              <Input id="cashier" value={cashierName} disabled />
            </div>
            <div>
              <Label htmlFor="startingCash">Modal Awal (Rp)</Label>
              <Input
                id="startingCash"
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                placeholder="Masukkan modal awal"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStartDialogOpen(false);
                  setStartingCash('');
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleStartShift}
                disabled={!startingCash || parseFloat(startingCash) <= 0}
              >
                Mulai Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift Dialog */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="endingCash">Kas Akhir (Rp)</Label>
              <Input
                id="endingCash"
                type="number"
                value={endingCash}
                onChange={(e) => setEndingCash(e.target.value)}
                placeholder="Masukkan jumlah kas akhir"
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEndDialogOpen(false);
                  setEndingCash('');
                  setNotes('');
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleEndShift}
                disabled={!endingCash || parseFloat(endingCash) < 0}
              >
                Tutup Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}