import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { processOrderWithLock } from '@/lib/orderService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const batchStart = performance.now();
  try {
    const body = await request.json();
    const { productId, buyerCount = 10, quantityPerBuyer = 1 } = body;

    const pId = parseInt(productId, 10);
    const count = Math.min(Math.max(parseInt(buyerCount, 10) || 5, 2), 50);
    const qty = Math.max(parseInt(quantityPerBuyer, 10) || 1, 1);

    if (isNaN(pId)) {
      return NextResponse.json({ success: false, error: 'Product ID tidak valid' }, { status: 400 });
    }

    const pool = getPool();
    // Get initial stock snapshot
    const initialRes = await pool.query('SELECT id, sku, name, current_stock FROM products WHERE id = $1', [pId]);
    if (initialRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan di database' }, { status: 404 });
    }

    const product = initialRes.rows[0];
    const initialStock = parseInt(product.current_stock, 10);

    // Prepare simulated concurrent buyers
    const buyerNames = [
      'Budi Warehouse', 'Siti Logistik', 'Ahmad Distribusi', 'Dewi Cargo', 
      'Rudi Supply', 'Eka Store', 'Hendra Depot', 'Mega Retail', 
      'Fajar Hub', 'Gita Mandiri', 'Bambang Express', 'Intan Forwarding',
      'Yusuf Global', 'Kartika Hub', 'Rian Trans', 'Nadia Parcel',
      'Wahyu Freight', 'Lestari Grosir', 'Doni Armada', 'Maya Dispatch'
    ];

    const tasks = Array.from({ length: count }, (_, i) => {
      const name = `${buyerNames[i % buyerNames.length]} #${i + 1}`;
      const location = `Terminal Antrean #${i + 1}`;
      return processOrderWithLock({
        productId: pId,
        customerName: name,
        customerLocation: location,
        quantity: qty,
      });
    });

    // Execute simultaneously using Promise.all to simulate real race-condition
    const results = await Promise.all(tasks);

    // Get final stock to prove it never dropped below 0
    const finalRes = await pool.query('SELECT current_stock FROM products WHERE id = $1', [pId]);
    const finalStock = parseInt(finalRes.rows[0].current_stock, 10);

    const totalDurationMs = Math.round((performance.now() - batchStart) * 100) / 100;
    const deliveredCount = results.filter(r => r.status === 'DELIVERED').length;
    const cancelledCount = results.filter(r => r.status === 'CANCELLED').length;

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          initialStock,
          finalStock,
        },
        summary: {
          totalRequests: count,
          deliveredCount,
          cancelledCount,
          totalDurationMs,
          avgLatencyMs: Math.round((results.reduce((acc, r) => acc + r.executionMs, 0) / results.length) * 100) / 100,
          stockIntegrityVerified: finalStock >= 0,
        },
        transactions: results,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Gagal mengeksekusi pengujian konkurensi database',
    }, { status: 500 });
  }
}
