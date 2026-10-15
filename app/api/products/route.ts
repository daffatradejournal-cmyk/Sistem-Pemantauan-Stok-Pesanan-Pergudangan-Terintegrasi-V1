import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureTablesExist();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  try {
    const pool = getPool();
    let query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.price,
        p.current_stock,
        p.min_stock_threshold,
        p.created_at,
        p.updated_at,
        CASE 
          WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
          WHEN p.current_stock <= p.min_stock_threshold THEN 'LOW_STOCK'
          ELSE 'SAFE'
        END as stock_status,
        (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id) as total_ordered_times
      FROM products p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    query += ` ORDER BY p.id ASC`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      products: res.rows.map(r => ({
        id: r.id,
        sku: r.sku,
        name: r.name,
        category: r.category,
        price: parseFloat(r.price),
        currentStock: r.current_stock,
        minStockThreshold: r.min_stock_threshold,
        stockStatus: r.stock_status,
        totalOrderedTimes: parseInt(r.total_ordered_times, 10) || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
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
    const { sku, name, category, price, current_stock, min_stock_threshold } = body;

    if (!sku || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'SKU, Nama Produk, dan Kategori wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const initialStock = parseInt(current_stock, 10) || 0;
      const minThreshold = parseInt(min_stock_threshold, 10) || 5;
      const productPrice = parseFloat(price) || 0;

      const insertRes = await client.query(
        `INSERT INTO products (sku, name, category, price, current_stock, min_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [sku.trim().toUpperCase(), name.trim(), category.trim(), productPrice, initialStock, minThreshold]
      );

      const created = insertRes.rows[0];

      // Insert audit log
      if (initialStock > 0) {
        await client.query(
          `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes)
           VALUES ($1, $2, 'MANUAL_ADJUST', $3, 0, $3, 'Initial product creation stock')`,
          [created.id, created.sku, initialStock]
        );
      }

      // Check alerts
      if (initialStock === 0) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message)
           VALUES ($1, 'OUT_OF_STOCK', $2)`,
          [created.id, `Stok awal produk ${created.name} (${created.sku}) adalah 0.`]
        );
      } else if (initialStock <= minThreshold) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message)
           VALUES ($1, 'LOW_STOCK', $2)`,
          [created.id, `Stok awal produk ${created.name} (${created.sku}) berada di batas kritis (${initialStock} unit).`]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Produk ${created.name} (${created.sku}) berhasil didaftarkan ke gudang!`,
        product: created,
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan produk' },
      { status: 500 }
    );
  }
}
