# Sistem-Pemantauan-Stok-Pesanan-Pergudangan-Terintegrasi-V1

## WareFlow — Sistem Pemantauan Stok & Pesanan Pergudangan Terintegrasi

Aplikasi web produksi penuh (Production-Ready Full-Stack Web App) dengan arsitektur **Next.js 14 (App Router), TypeScript, Tailwind CSS, node-postgres (`pg.Pool`), Lucide Icons, dan `html5-qrcode`** yang terhubung langsung secara end-to-end ke database **PostgreSQL**.

---

## 🚀 Fitur Unggulan

1. **Desain Dual Theme (Light & Dark Mode) Presisi:**
   - Mengadopsi tata letak **Bento SaaS Dashboard** modern dengan palet warna semantik:
     - Light Theme: `#F4F6F9`, Card `#FFFFFF`, Text `#111827`
     - Dark Theme: `#12131A`, Sidebar `#181922`, Card `#1E202B`, Text `#FFFFFF`
   - Disimpan secara persisten di `localStorage`.

2. **Arsitektur Database PostgreSQL Asli (`lib/db.ts`):**
   - Menggunakan package native `pg` (`Pool`) dengan manajemen koneksi pool otomatis & dukungan SSL untuk cloud provider (Neon.tech, Supabase, Railway, Render).
   - Inisialisasi skema idempoten (`CREATE TABLE IF NOT EXISTS`) dengan constraint database level `CHECK (current_stock >= 0)`.
   - 4 Tabel Inti: `products`, `orders`, `stock_logs`, `stock_alerts`.

3. **Row-Level Locking PostgreSQL & Concurrency Stress-Test (`SELECT ... FOR UPDATE`):**
   - Transaksi pemesanan dibungkus atomik dengan `BEGIN ... FOR UPDATE ... COMMIT/ROLLBACK`.
   - Menguji konkurensi transaksi serentak nyata (`POST /api/orders/concurrent-batch`) dengan simulasi 5, 10, hingga 30 pembeli bersamaan (`Promise.all`).
   - Sistem membuktikan secara matematis bahwa stok fisik berhenti tepat di angka 0 dan tidak pernah menjadi negatif.

4. **Kamera Barcode Scanner Fisik (`html5-qrcode`) + Visual Barcode SVG:**
   - Memindai barcode fisik langsung lewat webcam / kamera HP atau scanner USB.
   - Pilihan mode: Barang Masuk (+ Restock) atau Barang Keluar (- Dispatch).
   - Menampilkan visual Barcode SVG untuk setiap SKU produk yang dapat langsung dipindai dari layar.

5. **5 Menu Kerja Lengkap:**
   - **Menu 1: Analytics (Dashboard Utama):** 2x2 KPI Cards, 2 SVG Donut Charts, Vertical Bar Chart Sales Dynamics, Curved Line Chart Stock Activity, 2 Circular Progress Cards, Customer Order Table dengan status rounded-pill.
   - **Menu 2: Products & Barcode:** CRUD Produk, Kamera Barcode Scanner, Visual SVG Barcode Generator.
   - **Menu 3: Orders & Locking:** Form Pembuatan Pesanan Real-time & Panel Stress Test Transaksi Serentak.
   - **Menu 4: Alerts & Logs:** Peringatan Stok Menipis/Habis otomatis dengan tombol *Quick Restock*, serta Audit Trail lengkap mutasi keluar-masuk barang.
   - **Menu 5: Settings & DB:** Monitor latensi ping database, 1-Click Init Tables, 1-Click Seed Sample Warehouse Data, dan form custom PostgreSQL URL.

---

## 🛠️ Panduan Menjalankan

### 1. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

### 2. Konfigurasi Koneksi PostgreSQL
Ada 2 cara mudah menghubungkan database:
- **Cara A (Melalui File `.env.local`):**
  Buka file `.env.local` dan masukkan URL PostgreSQL Anda:
  ```env
  DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
- **Cara B (Langsung dari UI Browser):**
  Buka tab **Settings & DB**, masukkan URL database pada form *"Ubah Connection String Database"*, lalu klik **"Terapkan & Uji Koneksi"**.

### 3. Inisialisasi & Seeding Data Sampel Gudang (1-Click)
Setelah database terhubung:
1. Klik tombol **"Initialize / Migrate Database Tables"** di menu **Settings**.
2. Klik tombol **"Seed Sample Warehouse Data"** untuk langsung mengisi katalog 8 produk pergudangan, transaksi awal, dan log mutasi stok.
