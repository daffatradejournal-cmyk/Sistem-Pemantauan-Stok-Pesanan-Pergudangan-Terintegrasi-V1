'use client';

import React from 'react';
import { RefreshCw, PlusCircle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export interface CustomerOrderRow {
  id: number;
  orderNumber: string;
  customerName: string;
  customerLocation: string;
  quantity: number;
  totalPrice: number;
  status: 'DELIVERED' | 'PROCESSED' | 'CANCELLED';
  executionMs: number;
  createdAt: string;
  productName: string;
  productSku: string;
}

interface Props {
  orders: CustomerOrderRow[];
  onRefresh: () => void;
  onNewOrderClick: () => void;
  isLoading?: boolean;
}

export function CustomerOrderTable({
  orders,
  onRefresh,
  onNewOrderClick,
  isLoading = false,
}: Props) {
  // Avatars color helper
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 
      'bg-rose-500', 'bg-purple-500', 'bg-teal-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      {/* Table Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Pesanan Pelanggan Terbaru
          </h3>
          <p className="text-xs text-slate-400">Data transaksi pesanan toko langsung dari database PostgreSQL</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Muat Ulang Pesanan"
            aria-label="Muat Ulang Pesanan"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNewOrderClick}
            className="px-3 py-1.5 bg-brandBlue text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-brandBlue/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Catat Pesanan Baru</span>
          </button>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="pb-1 pl-3 font-medium">Pelanggan</th>
              <th className="pb-1 font-medium">Alamat / Cabang</th>
              <th className="pb-1 font-medium">Tanggal</th>
              <th className="pb-1 font-medium">Status Pesanan</th>
              <th className="pb-1 pr-3 text-right font-medium">Total Bayar</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((ord) => {
                const isDelivered = ord.status === 'DELIVERED';
                const isProcessed = ord.status === 'PROCESSED';
                const isCancelled = ord.status === 'CANCELLED';

                // Row background matching the mockup's colored pills
                const rowClass = isDelivered
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                  : isProcessed
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';

                const statusColor = isDelivered
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isProcessed
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400';

                const initials = ord.customerName
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr
                    key={ord.id}
                    className={`${rowClass} transition-all duration-200 hover:brightness-95 dark:hover:brightness-110`}
                  >
                    {/* Profile */}
                    <td className="py-2.5 pl-3 rounded-l-xl">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0 ${getAvatarBg(
                            ord.customerName
                          )}`}
                        >
                          {initials}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[120px]">
                            {ord.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px] block font-mono">
                            {ord.productSku} ({ord.quantity}x)
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Address / Location */}
                    <td className="py-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[110px]">
                      {ord.customerLocation || 'Toko Utama'}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(ord.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isDelivered && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        {isProcessed && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                        {isCancelled && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                        <span className={`text-xs font-bold ${statusColor}`}>
                          {ord.status === 'DELIVERED'
                            ? 'Selesai (Terkirim)'
                            : ord.status === 'CANCELLED'
                            ? 'Ditolak (Stok Habis)'
                            : 'Sedang Diproses'}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 pr-3 text-right rounded-r-xl font-bold text-xs text-slate-900 dark:text-white">
                      Rp {ord.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  Belum ada pesanan tercatat di database toko. Klik &quot;+ Catat Pesanan Baru&quot; atau buka menu Pengaturan Database untuk mengisi data awal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
