import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/storage';

interface PrintableReceiptProps {
  transaction: Transaction;
}

export default function PrintableReceipt({ transaction }: PrintableReceiptProps) {
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

  return (
    <div 
      id="printable-receipt" 
      style={{
        width: '80mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10mm',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
          DIMSUM MPOK RANI
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Struk Pembelian
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      {/* Transaction Info */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>No. Transaksi:</span>
          <span>{transaction.id.slice(0, 8)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Tanggal:</span>
          <span>{formattedDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Waktu:</span>
          <span>{formattedTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Kasir:</span>
          <span>{transaction.cashierName}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      {/* Items */}
      <div style={{ marginBottom: '10px' }}>
        {transaction.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{item.product?.name || item.name}</span>
              <span>{formatCurrency(item.product?.price || item.price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '10px' }}>
              <span>{item.quantity} x {formatCurrency(item.product?.price || item.price)}</span>
              <span>{formatCurrency((item.product?.price || item.price) * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      {/* Total */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>Metode Pembayaran:</span>
          <span>{transaction.paymentMethod || 'Cash'}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
        Terima kasih atas kunjungan Anda!
      </div>
    </div>
  );
}