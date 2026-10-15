# StokPintar UMKM — Sistem Manajemen Stok & Kasir Toko Terintegrasi

Aplikasi web kasir dan pemantauan stok produksi penuh (*Production-Ready Full-Stack Web App*) yang dirancang khusus untuk kemudahan pemilik **Usaha Mikro, Kecil, dan Menengah (UMKM)**, toko grosir/sembako, minimarket lokal, dan kedai usaha.

Dibangun dengan arsitektur modern **Next.js 14 (App Router), TypeScript, Tailwind CSS, node-postgres (`pg.Pool`), Lucide Icons, dan `html5-qrcode`** yang terhubung langsung secara end-to-end ke database **PostgreSQL**.

---

## 🌟 Fitur Unggulan untuk Pelaku UMKM

1. **Tampilan Sederhana & Ramah Pengguna (Bento Dashboard):**
   - 100% menggunakan **Bahasa Indonesia** yang mudah dipahami pemilik toko (istilah kasir, kulakan, sisa stok, omzet).
   - Dilengkapi mode **Terang (Light)** dan **Gelap (Dark)** yang nyaman di mata kasir saat melayani pembeli seharian.
   - Tersimpan otomatis secara persisten di browser (*localStorage*).

2. **Katalog Barang & Pemindai Barcode Kamera:**
   - Tambah, edit, dan kelola produk dagangan lengkap dengan harga jual dan stok fisik.
   - **Scan Barcode Kamera:** Bisa menggunakan kamera HP, webcam laptop, atau barcode scanner USB untuk input barang kulakan (*+ IN*) atau barang keluar (*- OUT*).
   - Generator Barcode SVG otomatis untuk setiap kode SKU barang dagangan.

3. **Kasir Toko Cepat & Proteksi Anti-Stok Minus (*PostgreSQL Row-Locking*):**
   - Form pencatatan pesanan kasir instan dengan kalkulasi total belanja otomatis.
   - Dilengkapi proteksi transaksi atomik database (`SELECT ... FOR UPDATE` & `CHECK (current_stock >= 0)`) sehingga stok dijamin **mustahil minus** meskipun ada pembeli berebut barang diskon serentak.
   - Tombol pengujian simulasi pembeli serentak (5, 10, hingga 30 transaksi bersamaan).

4. **Peringatan Waktunya Kulakan & Buku Catatan Mutasi:**
   - Notifikasi otomatis saat stok barang dagangan menipis di bawah batas minimum atau habis.
   - Tombol **"Kulakan Cepat (+20)"** untuk menambah stok instan tanpa perlu repot.
   - Buku catatan arus barang (*audit trail*) mencatat riwayat keluar-masuk barang secara real-time.

5. **Ringkasan & Laporan Usaha Lengkap:**
   - 4 Kartu Ringkasan Penjualan: Total Pesanan, Transaksi Berhasil, Sisa Stok Fisik, dan Total Omzet Usaha.
   - Grafik Batang Dinamika Omzet Bulanan (Januari - Desember).
   - Grafik Garis Aktivitas Keluar-Masuk Barang.
   - Diagram Donut Kondisi Stok (Aman, Menipis, Habis) dan Status Transaksi.

---

## 🛠️ Panduan Menjalankan

### 1. Menjalankan Server Aplikasi
```bash
npm run dev
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

### 2. Menghubungkan ke Database PostgreSQL
Tersedia 2 cara mudah:
- **Cara A (Melalui File `.env.local`):**
  Buka file `.env.local` dan masukkan URL PostgreSQL Anda (bisa dari Neon.tech, Supabase, Railway, dsb.):
  ```env
  DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
- **Cara B (Langsung dari Menu Pengaturan):**
  Buka tab **Pengaturan Database Toko**, masukkan URL database pada form *"Ubah Connection String Database"*, lalu klik **"Terapkan & Uji Koneksi"**.

### 3. Inisialisasi & Isi Contoh Data Toko UMKM (1-Klik)
Setelah database terhubung:
1. Klik tombol **"1. Buat Struktur Tabel Toko"** di tab Pengaturan.
2. Klik tombol **"2. Isi Contoh Produk & Transaksi UMKM"** untuk langsung memasukkan 8 barang sembako/kebutuhan harian (Minyak Bimoli, Beras Ramos, Gulaku, Kopi Robusta, dsb.), riwayat transaksi pelanggan, dan buku catatan mutasi barang.

