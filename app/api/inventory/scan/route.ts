import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    await ensureTablesExist();
    const body = await request.json();
    const { sku, action, quantity = 1, notes = '' } = body;

    const trimmedSku = (sku || '').trim().toUpperCase();
    const scanAction = (action || '').toUpperCase();
    const qty = parseInt(quantity, 10);

    if (!trimmedSku) {
      return NextResponse.json({ success: false, error: 'Kode Barcode / SKU wajib diisi atau dipindai!' }, { status: 400 });
    }

    if (scanAction !== 'IN' && scanAction !== 'OUT') {
      return NextResponse.json({ success: false, error: 'Aksi barcode harus IN (Barang Masuk) atau OUT (Barang Keluar)' }, { status: 400 });
    }

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'Kuantitas harus bernilai bilangan bulat lebih besar dari 0' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. SELECT ... FOR UPDATE by SKU
      const productRes = await client.query(
        `SELECT id, sku, name, current_stock, min_stock_threshold, price 
         FROM products 
         WHERE UPPER(sku) = $1 
         FOR UPDATE`,
        [trimmedSku]
      );

      if (productRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: `Barcode "${trimmedSku}" tidak terdaftar dalam database inventaris gudang!`,
        }, { status: 404 });
      }

      const product = productRes.rows[0];
      const previousStock = parseInt(product.current_stock, 10);
      const minThreshold = parseInt(product.min_stock_threshold, 10);

      let newStock = previousStock;
      let logType = '';
      let qtyChange = 0;
      let alertActionMessage = '';

      if (scanAction === 'IN') {
        newStock = previousStock + qty;
        logType = 'BARCODE_IN';
        qtyChange = qty;

        // Update product stock
        await client.query(
          `UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2`,
          [newStock, product.id]
        );

        // If restocked above threshold, resolve pending alerts
        if (newStock > minThreshold) {
          await client.query(
            `UPDATE stock_alerts 
             SET is_resolved = true 
             WHERE product_id = $1 AND is_resolved = false`,
            [product.id]
          );
          alertActionMessage = 'Status alert stok kritis diselesaikan otomatis karena stok telah pulih.';
        }
      } else {
        // scanAction === 'OUT'
        if (previousStock < qty) {
          await client.query('ROLLBACK');
          return NextResponse.json({
            success: false,
            error: `Gagal Scan Barang Keluar: Stok fisik produk ${product.name} saat ini hanya ${previousStock} unit, tidak mencukupi untuk pengeluaran ${qty} unit.`,
          }, { status: 400 });
        }

        newStock = previousStock - qty;
        logType = 'BARCODE_OUT';
        qtyChange = -qty;

        await client.query(
          `UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2`,
          [newStock, product.id]
        );

        // Check if falls below threshold
        if (newStock === 0) {
          await client.query(
            `INSERT INTO stock_alerts (product_id, alert_type, message)
             VALUES ($1, 'OUT_OF_STOCK', $2)`,
            [product.id, `ALERTA STOK HABIS: Pemindaian barcode keluar membuat ${product.name} (${product.sku}) habis total (0 unit).`]
          );
          alertActionMessage = 'Peringatan stok habis (OUT_OF_STOCK) otomatis dipicu!';
        } else if (newStock <= minThreshold) {
          await client.query(
            `INSERT INTO stock_alerts (product_id, alert_type, message)
             VALUES ($1, 'LOW_STOCK', $2)`,
            [product.id, `PERINGATAN STOK MENIPIS: Stok ${product.name} (${product.sku}) menyentuh ${newStock} unit (Batas min: ${minThreshold}).`]
          );
          alertActionMessage = 'Peringatan stok menipis (LOW_STOCK) otomatis dipicu!';
        }
      }

      // Record to audit trail
      const noteText = notes.trim() || `Barcode Scan ${scanAction === 'IN' ? 'Barang Masuk (Restock)' : 'Barang Keluar (Dispatch)'}`;
      await client.query(
        `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product.id, product.sku, logType, qtyChange, previousStock, newStock, noteText]
      );

      await client.query('COMMIT');

      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

      return NextResponse.json({
        success: true,
        message: `Pemindaian Barcode Berhasil: ${scanAction === 'IN' ? '+' : '-'}${qty} unit untuk ${product.name}`,
        data: {
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            previousStock,
            newStock,
            minStockThreshold: minThreshold,
          },
          action: scanAction,
          quantityChanged: qtyChange,
          alertStatus: alertActionMessage,
          executionMs: durationMs,
        },
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Gagal memproses pemindaian barcode ke database',
    }, { status: 500 });
  }
}
