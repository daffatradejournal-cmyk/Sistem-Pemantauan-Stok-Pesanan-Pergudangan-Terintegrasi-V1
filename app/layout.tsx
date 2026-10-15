import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WareFlow - Sistem Pemantauan Stok & Pesanan Pergudangan',
  description: 'Production-ready Warehouse Stock & Order Monitoring System with PostgreSQL Row-Level Locking and Barcode Scanner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-lightBg dark:bg-darkBg text-slate-900 dark:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
