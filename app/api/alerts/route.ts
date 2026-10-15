import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'all', 'unresolved', 'resolved'

  try {
    const pool = getPool();
    let query = `
      SELECT 
        a.id,
        a.alert_type,
        a.message,
        a.is_resolved,
        a.created_at,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.current_stock,
        p.min_stock_threshold
      FROM stock_alerts a
      JOIN products p ON a.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status === 'unresolved') {
      query += ` AND a.is_resolved = false`;
    } else if (status === 'resolved') {
      query += ` AND a.is_resolved = true`;
    }

    query += ` ORDER BY a.is_resolved ASC, a.created_at DESC LIMIT 100`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      alerts: res.rows.map(r => ({
        id: r.id,
        alertType: r.alert_type,
        message: r.message,
        isResolved: r.is_resolved,
        createdAt: r.created_at,
        productId: r.product_id,
        productName: r.product_name,
        productSku: r.product_sku,
        currentStock: r.current_stock,
        minStockThreshold: r.min_stock_threshold,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action = 'resolve', restockQuantity } = body;

    const id = parseInt(alertId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Alert ID tidak valid' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const alertRes = await client.query(
        `SELECT a.id, a.product_id, a.is_resolved, p.name, p.sku, p.current_stock, p.min_stock_threshold 
         FROM stock_alerts a
         JOIN products p ON a.product_id = p.id
         WHERE a.id = $1
         FOR UPDATE`,
        [id]
      );

      if (alertRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Alert tidak ditemukan' }, { status: 404 });
      }

      const alert = alertRes.rows[0];

      if (action === 'quick_restock') {
        const qty = parseInt(restockQuantity, 10) || (alert.min_stock_threshold * 2);
        const previousStock = parseInt(alert.current_stock, 10);
        const newStock = previousStock + qty;

        await client.query(
          `UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2`,
          [newStock, alert.product_id]
        );

        await client.query(
          `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes)
           VALUES ($1, $2, 'MANUAL_ADJUST', $3, $4, $5, $6)`,
          [alert.product_id, alert.sku, qty, previousStock, newStock, `Quick Restock dari Alert Panel #${id}`]
        );

        await client.query(
          `UPDATE stock_alerts SET is_resolved = true WHERE id = $1`,
          [id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          message: `Restock Cepat Berhasil: +${qty} unit ditambahkan ke ${alert.name}. Stok baru: ${newStock}. Alert ditandai selesai!`,
        });
      } else {
        // Just resolve
        await client.query(
          `UPDATE stock_alerts SET is_resolved = true WHERE id = $1`,
          [id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          message: `Alert #${id} berhasil ditandai selesai.`,
        });
      }
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
