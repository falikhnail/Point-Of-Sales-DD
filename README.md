# 🥟 Sistem Manajemen Penjualan Dimsum Mpok Rani

Sistem manajemen penjualan yang komprehensif untuk restoran dimsum, dirancang untuk meningkatkan efisiensi operasional dan memberikan wawasan bisnis yang mendalam.

## 📋 Daftar Isi

- [Tentang Sistem](#tentang-sistem)
- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Panduan Instalasi](#panduan-instalasi)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Backup & Restore Data](#backup--restore-data)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## 🎯 Tentang Sistem

Sistem Manajemen Penjualan Dimsum Mpok Rani adalah aplikasi web modern yang dirancang khusus untuk mengelola operasional restoran dimsum. Sistem ini menyediakan fitur lengkap mulai dari Point of Sale (POS), manajemen inventori, pelaporan keuangan, hingga analisis performa bisnis.

### Keunggulan Sistem

- ✅ **User-Friendly Interface** - Antarmuka yang intuitif dan mudah digunakan
- ✅ **Real-time Updates** - Data diperbarui secara langsung
- ✅ **Comprehensive Reports** - Laporan lengkap untuk analisis bisnis
- ✅ **Multi-Role Access** - Sistem role-based untuk admin dan kasir
- ✅ **Offline Capable** - Menggunakan localStorage untuk penyimpanan data lokal
- ✅ **Responsive Design** - Dapat diakses dari berbagai perangkat
- ✅ **Data Backup & Import** - Fitur backup dan restore data yang aman

## 🚀 Fitur Utama

### 1. Autentikasi & Manajemen Pengguna
- Login dengan role-based access (Admin & Kasir)
- Manajemen akun pengguna
- Activity logging untuk audit trail

### 2. Point of Sale (POS)
- Interface kasir yang cepat dan responsif
- Pencarian produk dengan kategori
- Pembayaran tunai dan QRIS
- Cetak struk otomatis
- Manajemen shift kasir

### 3. Manajemen Produk
- CRUD produk lengkap
- Kategori produk (Kukus, Goreng, Bakar, Lainnya)
- Tracking stok real-time
- Alert stok rendah
- History perubahan stok

### 4. Manajemen Pembelian (Stock In)
- Pencatatan pembelian dari supplier
- Multiple items per transaksi
- Tracking biaya ongkir dan biaya lainnya
- Update stok otomatis
- History pembelian lengkap

### 5. Dashboard & Pelaporan
- Dashboard overview dengan metrics penting
- Laporan Penjualan (Sales Report)
- Laporan Pembelian (Purchase Report)
- Laporan Stok (Stock Report)
- Laporan Laba Rugi (Profit & Loss)
- Laporan Cashflow
- Laporan Profit per Produk
- Laporan Performa Kasir
- Visualisasi data dengan charts

### 6. Manajemen Shift Kasir
- Pencatatan shift opening & closing
- Tracking kas awal dan akhir
- Rekonsiliasi kas
- History shift lengkap

### 7. Biaya Operasional
- Pencatatan biaya operasional harian
- Kategorisasi biaya
- Tracking pengeluaran
- Analisis biaya per periode

### 8. Backup & Import Data
- Export semua data ke format JSON
- Import data dari backup
- Mode Merge dan Replace
- Data integrity validation
- Summary preview sebelum import

## 🛠️ Teknologi yang Digunakan

### Frontend Framework & Library
- **React 18.3** - Library JavaScript untuk membangun UI
- **TypeScript** - Superset JavaScript dengan type safety
- **Vite 5.4** - Build tool modern yang cepat
- **React Router DOM** - Routing untuk single-page application

### UI Components & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Shadcn/ui** - Component library berbasis Radix UI
- **Lucide React** - Icon library modern
- **Recharts** - Library untuk visualisasi data

### Utilities & Tools
- **date-fns** - Library untuk manipulasi tanggal
- **jsPDF & html2canvas** - Generate PDF receipts
- **xlsx** - Export data ke Excel
- **clsx & tailwind-merge** - Utility untuk class management

### Development Tools
- **ESLint** - Linting untuk code quality
- **TypeScript ESLint** - TypeScript linting rules
- **PostCSS & Autoprefixer** - CSS processing

## 💻 Persyaratan Sistem

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, atau Linux (Ubuntu 20.04+)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 500 MB free space
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, atau Edge 90+

### Software Requirements
- **Node.js**: Version 18.x atau lebih tinggi
- **pnpm**: Version 8.x atau lebih tinggi (package manager)
- **Git**: Version 2.x atau lebih tinggi (optional, untuk version control)

## 📦 Panduan Instalasi

### Langkah 1: Install Node.js

#### Windows
1. Kunjungi [https://nodejs.org/](https://nodejs.org/)
2. Download installer **LTS version** (Long Term Support)
3. Jalankan installer dan ikuti instruksi
4. Setelah selesai, buka Command Prompt dan verifikasi instalasi:
   ```bash
   node --version
   npm --version
   ```

#### macOS
**Menggunakan Homebrew** (recommended):
```bash
# Install Homebrew jika belum ada
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verifikasi instalasi
node --version
npm --version
```

**Atau download dari website**:
1. Kunjungi [https://nodejs.org/](https://nodejs.org/)
2. Download installer macOS
3. Jalankan installer dan ikuti instruksi

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js dari NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi instalasi
node --version
npm --version
```

### Langkah 2: Install pnpm

pnpm adalah package manager yang lebih cepat dan efisien dibanding npm.

#### Windows, macOS, dan Linux
```bash
# Install pnpm menggunakan npm
npm install -g pnpm

# Verifikasi instalasi
pnpm --version
```

### Langkah 3: Install Git (Optional)

#### Windows
1. Download dari [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Jalankan installer dengan pengaturan default
3. Verifikasi: `git --version`

#### macOS
```bash
# Menggunakan Homebrew
brew install git

# Verifikasi
git --version
```

#### Linux
```bash
sudo apt-get install git

# Verifikasi
git --version
```

### Langkah 4: Download atau Clone Project

#### Opsi A: Download ZIP
1. Download project sebagai ZIP file
2. Extract ke folder pilihan Anda
3. Buka terminal/command prompt di folder tersebut

#### Opsi B: Clone dengan Git
```bash
# Clone repository (jika tersedia di Git)
git clone <repository-url>
cd shadcn-ui
```

#### Opsi C: Buat Project Baru dari Template

Jika Anda ingin membuat project dari awal:

```bash
# Buat project React dengan Vite
npm create vite@latest dimsum-mpok-rani -- --template react-ts

# Masuk ke folder project
cd dimsum-mpok-rani

# Install pnpm jika belum
npm install -g pnpm

# Install dependencies
pnpm install

# Install Tailwind CSS
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui
pnpm dlx shadcn-ui@latest init

# Install dependencies tambahan
pnpm install react-router-dom date-fns recharts lucide-react jspdf html2canvas xlsx clsx tailwind-merge class-variance-authority
pnpm install -D @types/node

# Copy semua file dari project ini ke folder baru
# (salin folder src/, public/, dan file konfigurasi)
```

### Langkah 5: Install Dependencies

Setelah memiliki project, install semua dependencies:

```bash
# Pastikan Anda berada di folder project
cd shadcn-ui

# Install semua dependencies
pnpm install
```

Proses ini akan:
- Download semua package yang dibutuhkan
- Membuat folder `node_modules`
- Membuat file `pnpm-lock.yaml`
- Memakan waktu 2-5 menit tergantung koneksi internet

### Langkah 6: Verifikasi Instalasi

Setelah instalasi selesai, verifikasi dengan menjalankan:

```bash
# Check untuk errors
pnpm run lint

# Build project untuk memastikan tidak ada error
pnpm run build
```

Jika tidak ada error, instalasi berhasil! ✅

## 🎮 Cara Menjalankan Aplikasi

### Development Mode

Untuk menjalankan aplikasi dalam mode development:

```bash
# Jalankan development server
pnpm run dev
```

Output yang akan muncul:
```
  VITE v5.4.21  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Buka browser dan akses: **http://localhost:5173/**

### Production Build

Untuk membuat production build:

```bash
# Build aplikasi
pnpm run build

# Preview production build
pnpm run preview
```

Production build akan tersimpan di folder `dist/`

### Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Kasir Account:**
- Username: `kasir1`
- Password: `kasir123`

## 📁 Struktur Proyek

```
shadcn-ui/
├── public/                      # Static assets
│   ├── favicon.svg
│   └── robots.txt
├── src/                         # Source code
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── CashierReports.tsx
│   │   ├── ReportsLayout.tsx
│   │   └── SalesReportContent.tsx
│   ├── contexts/                # React Context API
│   │   ├── AppContext.tsx       # Global app state
│   │   └── AuthContext.tsx      # Authentication state
│   ├── data/                    # Initial data
│   │   └── initialData.ts       # Default products & users
│   ├── hooks/                   # Custom React hooks
│   │   └── use-toast.ts
│   ├── lib/                     # Utility functions
│   │   ├── storage.ts           # localStorage utilities
│   │   ├── shiftStorage.ts      # Shift management
│   │   └── utils.ts             # General utilities
│   ├── pages/                   # Page components
│   │   ├── AdminBackup.tsx      # Backup & Import page
│   │   ├── AdminCashierReports.tsx
│   │   ├── AdminDashboard.tsx   # Admin dashboard
│   │   ├── AdminReports.tsx     # Reports page
│   │   ├── CashierDashboard.tsx # Cashier POS
│   │   ├── Login.tsx            # Login page
│   │   ├── ProductManagement.tsx
│   │   ├── PurchaseManagement.tsx
│   │   └── ...
│   ├── types/                   # TypeScript type definitions
│   │   ├── index.ts
│   │   └── reports.ts
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # Global styles
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind imports
├── .eslintrc.cjs               # ESLint configuration
├── components.json             # Shadcn UI config
├── index.html                  # HTML template
├── package.json                # Project dependencies
├── pnpm-lock.yaml             # Lock file
├── postcss.config.js          # PostCSS config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
└── README.md                  # This file
```

## 📖 Panduan Penggunaan

### Untuk Admin

#### 1. Login sebagai Admin
- Gunakan credentials admin
- Anda akan diarahkan ke Admin Dashboard

#### 2. Manajemen Produk
- Klik menu "Produk"
- Tambah produk baru dengan tombol "+ Tambah Produk"
- Edit atau hapus produk yang ada
- Monitor stok rendah dari alert

#### 3. Manajemen Pembelian
- Klik menu "Pembelian"
- Klik "+ Tambah Pembelian"
- Pilih supplier dari dropdown
- Tambah produk yang dibeli
- Input quantity dan harga modal
- Tambahkan biaya ongkir jika ada
- Simpan - stok akan otomatis terupdate

#### 4. Melihat Laporan
- Klik menu "Laporan"
- Pilih jenis laporan yang diinginkan
- Gunakan filter tanggal untuk periode tertentu
- Export ke Excel jika diperlukan

#### 5. Backup Data
- Klik menu "Backup Data"
- Klik "Backup Sekarang" untuk download file JSON
- Simpan file backup di tempat aman
- Untuk restore, pilih file dan klik "Import"

### Untuk Kasir

#### 1. Login sebagai Kasir
- Gunakan credentials kasir
- Anda akan diarahkan ke POS

#### 2. Memulai Shift
- Klik "Mulai Shift"
- Input kas awal
- Shift akan aktif

#### 3. Melakukan Transaksi
- Pilih produk dari daftar atau cari dengan search
- Klik produk untuk menambah ke keranjang
- Adjust quantity jika perlu
- Pilih metode pembayaran (Tunai/QRIS)
- Input jumlah bayar untuk tunai
- Klik "Proses Pembayaran"
- Struk akan otomatis tercetak/download

#### 4. Mengakhiri Shift
- Klik "Akhiri Shift"
- Input kas akhir aktual
- Sistem akan menghitung selisih
- Konfirmasi untuk menutup shift

## 💾 Backup & Restore Data

### Melakukan Backup

1. Login sebagai Admin
2. Navigasi ke menu "Backup Data"
3. Review summary data yang akan di-backup
4. Klik tombol "Backup Sekarang"
5. File JSON akan otomatis terdownload dengan format: `dimsum-backup-YYYY-MM-DD-HHmmss.json`
6. Simpan file di lokasi yang aman (cloud storage, external drive, dll)

### Restore Data

#### Mode Merge (Gabung Data)
- Menggabungkan data dari backup dengan data yang ada
- Cocok untuk menambahkan data dari sumber lain
- Data existing tidak akan hilang

**Langkah:**
1. Klik "Pilih File Backup"
2. Pilih file JSON backup
3. Klik "Merge Data"
4. Konfirmasi
5. Data akan digabungkan

#### Mode Replace (Ganti Semua Data)
- Menghapus semua data existing
- Mengganti dengan data dari backup
- **HATI-HATI**: Data lama akan hilang!

**Langkah:**
1. Klik "Pilih File Backup"
2. Pilih file JSON backup
3. Klik "Replace Data"
4. Konfirmasi (pastikan Anda yakin!)
5. Semua data akan diganti

### Format File Backup

File backup berformat JSON dengan struktur:
```json
{
  "version": "2.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sales": [...],
  "purchases": [...],
  "shifts": [...],
  "operationalCosts": [...],
  "activityLogs": [...],
  "products": [...],
  "users": [...]
}
```

### Best Practices

1. **Backup Rutin**: Lakukan backup minimal 1x per hari
2. **Multiple Locations**: Simpan backup di 2-3 lokasi berbeda
3. **Naming Convention**: Gunakan nama file yang jelas dengan tanggal
4. **Test Restore**: Sesekali test restore di environment testing
5. **Before Major Changes**: Selalu backup sebelum update besar

## 🔧 Troubleshooting

### Error: "Cannot find module"
**Solusi:**
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "Port 5173 already in use"
**Solusi:**
```bash
# Gunakan port lain
pnpm run dev -- --port 3000
```

### Build Error
**Solusi:**
```bash
# Clear cache dan rebuild
rm -rf dist
pnpm run build
```

### Data Hilang Setelah Refresh
**Penyebab:** Browser localStorage di-clear
**Solusi:** 
- Restore dari backup terakhir
- Pastikan tidak menggunakan incognito/private mode
- Check browser settings untuk localStorage

### Struk Tidak Tercetak
**Solusi:**
- Pastikan browser mengizinkan popup
- Check printer settings di browser
- Coba download PDF manual

### Performance Lambat
**Solusi:**
- Clear browser cache
- Tutup tab browser lain
- Restart browser
- Check RAM usage

## 🤝 Kontribusi

Kontribusi sangat diterima! Jika Anda ingin berkontribusi:

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License. Lihat file `LICENSE` untuk detail lengkap.

## 📞 Kontak & Support

Untuk pertanyaan, bug report, atau feature request:
- Email: support@dimsummpokrani.com
- Issue Tracker: [GitHub Issues](https://github.com/your-repo/issues)

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Shadcn/ui](https://ui.shadcn.com/) - Component Library
- [Recharts](https://recharts.org/) - Charting Library

---

**Dibuat dengan ❤️ untuk Dimsum Mpok Rani**

Version: 2.0.0 | Last Updated: 2025