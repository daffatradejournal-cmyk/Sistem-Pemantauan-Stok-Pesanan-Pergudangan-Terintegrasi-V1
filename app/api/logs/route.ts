import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    const pool = getPool();
    let query = `
      SELECT 
        l.id,
        l.product_id,
        l.sku,
        l.change_type,
        l.quantity_change,
        l.previous_stock,
        l.new_stock,
        l.notes,
        l.created_at,
        p.name as product_name
      FROM stock_logs l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && type !== 'ALL') {
      params.push(type);
      query += ` AND l.change_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (l.sku ILIKE $${params.length} OR p.name ILIKE $${params.length} OR l.notes ILIKE $${params.length})`;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      logs: res.rows.map(r => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name || 'Item Terhapus',
        sku: r.sku,
        changeType: r.change_type,
        quantityChange: r.quantity_change,
        previousStock: r.previous_stock,
        newStock: r.new_stock,
        notes: r.notes,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
