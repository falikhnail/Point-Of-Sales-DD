# Redesign Laporan POS - Implementation Plan

## Overview
Redesign modul laporan dengan struktur menu dropdown dan 6 kategori laporan yang berbeda.

## Tasks

1. **Update Sidebar Component**
   - Tambah menu "Laporan" dengan dropdown submenu
   - 6 submenu: Penjualan, Pembelian, Stok, Laba Rugi, Profit Produk, Cashflow

2. **Create ReportsLayout Component**
   - Date range picker filter
   - Export buttons (PDF, Excel, Print)
   - KPI cards area
   - Chart area
   - Data table area

3. **Create 6 Report Pages**
   - LaporanPenjualan.tsx
   - LaporanPembelian.tsx
   - LaporanStok.tsx
   - LaporanLabaRugi.tsx
   - LaporanProfitProduk.tsx
   - LaporanCashflow.tsx

4. **Create Export Utilities**
   - exportToPDF.ts
   - exportToExcel.ts
   - printReport.ts

5. **Update App.tsx Routes**
   - Add routes for all 6 report pages

6. **Update Types**
   - Add new types for reports data structures

## Dependencies to Add
- xlsx (for Excel export)
- jspdf-autotable (for better PDF tables)