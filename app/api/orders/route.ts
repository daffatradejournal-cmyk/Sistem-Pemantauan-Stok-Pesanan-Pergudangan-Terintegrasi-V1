import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';
import { processOrderWithLock } from '@/lib/orderService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureTablesExist();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const pool = getPool();
    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_location,
        o.quantity,
        o.total_price,
        o.status,
        o.execution_ms,
        o.created_at,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.current_stock as live_product_stock
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      orders: res.rows.map(r => ({
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerLocation: r.customer_location,
        productId: r.product_id,
        productName: r.product_name,
        productSku: r.product_sku,
        liveProductStock: r.live_product_stock,
        quantity: r.quantity,
        totalPrice: parseFloat(r.total_price),
        status: r.status,
        executionMs: parseFloat(r.execution_ms),
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const body = await request.json();
    const { productId, customerName, customerLocation, quantity, orderDate } = body;

    const pId = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);

    if (isNaN(pId) || !customerName || isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Product ID, Nama Pembeli, dan Kuantitas (> 0) wajib diisi!' },
        { status: 400 }
      );
    }

    const result = await processOrderWithLock({
      productId: pId,
      customerName: customerName.trim(),
      customerLocation: customerLocation ? customerLocation.trim() : 'Gudang Utama',
      quantity: qty,
      orderDate,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
    }, { status: result.success ? 200 : 409 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses transaksi pesanan' },
      { status: 500 }
    );
  }
}
