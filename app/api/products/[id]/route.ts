import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTablesExist();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, price, min_stock_threshold } = body;

    const pool = getPool();
    const res = await pool.query(
      `UPDATE products 
       SET 
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         price = COALESCE($3, price),
         min_stock_threshold = COALESCE($4, min_stock_threshold),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, category, price ? parseFloat(price) : null, min_stock_threshold ? parseInt(min_stock_threshold, 10) : null, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data produk berhasil diperbarui',
      product: res.rows[0],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const pool = getPool();
    
    // Check if there are orders referencing this product
    const orderCheck = await pool.query('SELECT COUNT(*) as count FROM orders WHERE product_id = $1', [id]);
    if (parseInt(orderCheck.rows[0].count, 10) > 0) {
      return NextResponse.json({
        success: false,
        error: `Produk tidak dapat dihapus karena memiliki riwayat ${orderCheck.rows[0].count} transaksi pesanan di database.`,
      }, { status: 400 });
    }

    const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Produk ${res.rows[0].name} (${res.rows[0].sku}) berhasil dihapus dari sistem.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
