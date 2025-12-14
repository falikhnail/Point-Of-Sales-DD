import { Transaction } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/storage';
import { Printer, Download, Wallet, QrCode, Smartphone, Building2 } from 'lucide-react';
import { printReceipt, downloadReceiptAsPDF } from '@/lib/printUtils';
import { useToast } from '@/hooks/use-toast';
import PrintableReceipt from './PrintableReceipt';

interface ReceiptProps {
  transaction: Transaction;
}

export default function Receipt({ transaction }: ReceiptProps) {
  const { toast } = useToast();
  const date = new Date(transaction.timestamp);
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'QRIS':
        return <QrCode className="h-4 w-4 text-blue-600" />;
      case 'E-Wallet':
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      case 'Transfer Bank':
        return <Building2 className="h-4 w-4 text-orange-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const handlePrint = async () => {
    try {
      await printReceipt();
      toast({
        title: '🖨️ Mencetak Struk',
        description: 'Struk sedang dicetak...',
      });
    } catch (error) {
      toast({
        title: 'Gagal Mencetak',
        description: 'Terjadi kesalahan saat mencetak struk',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadReceiptAsPDF();
      toast({
        title: '📥 Download Berhasil',
        description: 'Struk berhasil diunduh sebagai PDF',
      });
    } catch (error) {
      toast({
        title: 'Gagal Download',
        description: 'Terjadi kesalahan saat mengunduh PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      {/* Hidden printable version */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <PrintableReceipt transaction={transaction} />
      </div>

      {/* Visible receipt card */}
      <Card className="max-w-sm mx-auto">
        <CardHeader className="text-center pb-3">
          <h2 className="text-2xl font-bold">Dimsum Mpok Rani</h2>
          <p className="text-sm text-gray-600">Struk Pembelian</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">No. Transaksi:</span>
              <span className="font-mono">{transaction.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Waktu:</span>
              <span>{formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kasir:</span>
              <span>{transaction.cashierName}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {transaction.items.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between font-medium">
                  <span>{item.product?.name || item.name}</span>
                  <span>{formatCurrency(item.product?.price || item.price)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>{item.quantity} x {formatCurrency(item.product?.price || item.price)}</span>
                  <span>{formatCurrency((item.product?.price || item.price) * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-600">Metode Pembayaran:</span>
              <span className="font-medium flex items-center gap-1">
                {getPaymentMethodIcon(transaction.paymentMethod || 'Cash')}
                {transaction.paymentMethod || 'Cash'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Print and Download Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>

          <p className="text-center text-xs text-gray-600">
            Terima kasih atas kunjungan Anda!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}