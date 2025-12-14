# TODO - Sistem Penjualan Dimsum Mpok Rani

## Web Design Style
- Layout: Modern dashboard dengan sidebar navigation
- Visual Elements: Card-based design, icons untuk menu items, badges untuk status
- Color Scheme: Warm colors (orange/red tones) untuk brand dimsum, dengan accents hijau untuk success states
- Typography: Clean, readable fonts dengan hierarchy yang jelas

## Struktur File yang Perlu Dibuat

### 1. Authentication & Context
- [x] src/contexts/AuthContext.tsx - Context untuk manajemen autentikasi dan user role
- [x] src/types/index.ts - Type definitions untuk Product, Order, Transaction, User

### 2. Pages
- [x] src/pages/Login.tsx - Halaman login untuk kasir dan admin
- [x] src/pages/CashierDashboard.tsx - Dashboard kasir untuk mencatat pesanan
- [x] src/pages/AdminDashboard.tsx - Dashboard admin dengan statistik penjualan
- [x] src/pages/MenuManagement.tsx - Halaman CRUD menu dimsum untuk admin
- [x] src/pages/SalesReport.tsx - Halaman laporan penjualan untuk admin

### 3. Components
- [x] src/components/Sidebar.tsx - Sidebar navigation component
- [x] src/components/ProductCard.tsx - Card untuk menampilkan produk dimsum
- [x] src/components/OrderSummary.tsx - Summary pesanan dan checkout
- [x] src/components/Receipt.tsx - Komponen struk pembelian
- [x] src/components/ProductForm.tsx - Form untuk tambah/edit produk
- [x] src/components/SalesChart.tsx - Chart untuk visualisasi penjualan

### 4. Data & Utils
- [x] src/data/initialData.ts - Data awal produk dimsum dan user dummy
- [x] src/lib/storage.ts - Helper functions untuk localStorage management

### 5. Routes Update
- [x] src/App.tsx - Update routing dengan protected routes
- [x] index.html - Update title menjadi "Dimsum Mpok Rani - Sistem Penjualan"

## Fitur Utama

### Kasir
- Login dengan kredensial kasir
- Melihat menu dimsum dengan kategori
- Menambah item ke keranjang
- Menghitung total otomatis
- Memilih metode pembayaran (Tunai/Transfer/E-wallet)
- Menampilkan dan mencetak struk

### Admin
- Login dengan kredensial admin
- Dashboard dengan statistik (total penjualan, jumlah transaksi, produk terlaris)
- Mengelola menu dimsum (CRUD)
- Melihat laporan penjualan dengan filter tanggal
- Export data penjualan

## Data Storage
Menggunakan localStorage untuk menyimpan:
- Products (menu dimsum)
- Transactions (riwayat penjualan)
- Current user session

## Default Users
- Kasir: username "kasir", password "kasir123"
- Admin: username "admin", password "admin123"

## Default Products (Contoh)
- Dimsum Ayam Kukus - Rp 15,000
- Dimsum Udang Kukus - Rp 18,000
- Dimsum Ayam Goreng - Rp 16,000
- Dimsum Udang Goreng - Rp 19,000
- Dimsum Ayam Bakar - Rp 17,000
- Siomay Special - Rp 20,000