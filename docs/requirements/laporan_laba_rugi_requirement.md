# Requirement: Laporan Laba Rugi (Profit & Loss Report)

## Tujuan
Membuat halaman laporan laba rugi yang komprehensif untuk aplikasi POS Dimsum Mpok Rani, menampilkan analisis keuangan lengkap dengan breakdown penjualan, biaya, dan profit.

## Elemen Laporan Utama

### 1. Penjualan Kotor (Gross Sales)
- Total revenue dari semua transaksi penjualan
- Dihitung dari: `SUM(transaction.total)` untuk semua transaksi dalam periode
- Ditampilkan dalam format Rupiah

### 2. HPP (Harga Pokok Penjualan / Cost of Goods Sold)
- Total biaya produksi dari produk yang terjual
- Dihitung dari: `SUM(product.cost * quantity_sold)` untuk semua item terjual
- Data cost diambil dari field `cost` di data produk
- Ditampilkan dalam format Rupiah

### 3. Laba Kotor (Gross Profit)
- Keuntungan sebelum dikurangi biaya operasional
- Formula: `Laba Kotor = Penjualan Kotor - HPP`
- Ditampilkan dalam format Rupiah dan persentase margin

### 4. Biaya Operasional (Operating Expenses)
- Total biaya operasional harian
- Diambil dari data `operationalCosts` di localStorage
- Kategori biaya: Listrik, Air, Gas, Gaji Karyawan, Transportasi, Lain-lain
- Ditampilkan dalam format Rupiah

### 5. Laba Bersih (Net Profit)
- Keuntungan final setelah semua biaya
- Formula: `Laba Bersih = Laba Kotor - Biaya Operasional`
- Ditampilkan dalam format Rupiah dan persentase margin

## KPI Cards (Ringkasan Metrik)

Tampilkan 5 KPI cards di bagian atas halaman:

1. **Penjualan Kotor**
   - Nilai total penjualan
   - Icon: TrendingUp
   - Warna: Blue

2. **HPP**
   - Total harga pokok penjualan
   - Icon: DollarSign
   - Warna: Orange

3. **Laba Kotor**
   - Gross profit dengan persentase margin
   - Icon: PieChart
   - Warna: Green

4. **Biaya Operasional**
   - Total operational expenses
   - Icon: Receipt
   - Warna: Red

5. **Laba Bersih**
   - Net profit dengan persentase margin
   - Icon: TrendingUp
   - Warna: Purple

## Filter Periode Waktu

Implementasikan filter dengan opsi:
- **Hari Ini**: Transaksi hari ini saja
- **Minggu Ini**: 7 hari terakhir
- **Bulan Ini**: Bulan berjalan
- **Custom Range**: Pilih tanggal mulai dan akhir

Filter harus mempengaruhi semua data: transaksi, HPP, dan biaya operasional.

## Visualisasi Data

### Chart 1: Breakdown Laba Rugi (Bar Chart)
- Tampilkan perbandingan: Penjualan Kotor, HPP, Laba Kotor, Biaya Operasional, Laba Bersih
- Gunakan Recharts BarChart
- Warna berbeda untuk setiap kategori

### Chart 2: Trend Laba Bersih (Line Chart)
- Tampilkan trend laba bersih per hari dalam periode yang dipilih
- Gunakan Recharts LineChart
- Tooltip menampilkan detail per tanggal

## Tabel Detail

### Tabel 1: Breakdown Biaya Operasional
Kolom:
- Kategori Biaya
- Jumlah (Rp)
- Persentase dari Total Biaya

### Tabel 2: Breakdown HPP per Kategori Produk
Kolom:
- Kategori Produk
- Quantity Terjual
- HPP Total (Rp)
- Persentase dari Total HPP

## Fitur Export

### Export PDF
- Judul: "Laporan Laba Rugi - Dimsum Mpok Rani"
- Header: Periode laporan
- Semua KPI metrics
- Chart (sebagai gambar)
- Tabel breakdown
- Footer: Tanggal generate dan nama user

### Export Excel
- Sheet 1: Summary (KPI metrics)
- Sheet 2: Detail Transaksi
- Sheet 3: Breakdown Biaya Operasional
- Sheet 4: Breakdown HPP per Produk
- Format currency untuk kolom rupiah

## Sumber Data

- **Transaksi**: `localStorage.getItem('transactions')`
- **Produk**: `localStorage.getItem('products')` (untuk data cost)
- **Biaya Operasional**: `localStorage.getItem('operationalCosts')`

## UI/UX Requirements

- Gunakan komponen Shadcn-ui (Card, Table, Button, Select)
- Responsive design untuk mobile dan desktop
- Loading state saat memproses data
- Empty state jika tidak ada data
- Color coding: hijau untuk profit, merah untuk loss
- Format angka: Rupiah dengan separator ribuan

## Technical Stack

- React + TypeScript
- Shadcn-ui components
- Tailwind CSS
- Recharts untuk visualisasi
- jsPDF untuk export PDF
- xlsx untuk export Excel
- date-fns untuk manipulasi tanggal

## File Structure

```
src/
├── pages/
│   └── LaporanLabaRugi.tsx (halaman utama)
├── components/
│   └── KPICard.tsx (sudah ada, reuse)
├── utils/
│   └── exportUtils.ts (tambahkan fungsi export)
└── types/
    └── reports.ts (tambahkan type definitions)
```

## Integrasi

- Tambahkan route `/admin/laporan-laba-rugi` di `App.tsx`
- Tambahkan menu item "Laporan Laba Rugi" di `Sidebar.tsx` dalam section Reports
- Gunakan `ReportsLayout` component untuk konsistensi UI

## Validasi

- Pastikan perhitungan akurat dengan test case
- Handle edge case: tidak ada transaksi, tidak ada biaya operasional
- Validasi date range (tanggal mulai <= tanggal akhir)