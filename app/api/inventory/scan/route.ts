import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    await ensureTablesExist();
    const body = await request.json();
    const { sku, action, quantity = 1, notes = '', transactionDate } = body;

    const trimmedSku = (sku || '').trim().toUpperCase();
    const scanAction = (action || '').toUpperCase();
    const qty = parseInt(quantity, 10);
    const txDate = transactionDate ? new Date(transactionDate) : new Date();

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

      // Lock product row
      const productRes = await client.query(
        `SELECT id, sku, name, category, price, current_stock, min_stock_threshold 
         FROM products 
         WHERE sku = $1 
         FOR UPDATE`,
        [trimmedSku]
      );

      if (productRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: `Produk dengan SKU / Barcode "${trimmedSku}" tidak ditemukan di database toko.`,
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
          `UPDATE products SET current_stock = $1, updated_at = $2 WHERE id = $3`,
          [newStock, txDate, product.id]
        );

        // If restocked above threshold, resolve pending alerts
        if (newStock > minThreshold) {
          await client.query(
            `UPDATE stock_alerts 
             SET is_resolved = true 
             WHERE product_id = $1 AND is_resolved = false`,
            [product.id]
          );
          alertActionMessage = 'Status peringatan stok menipis diselesaikan otomatis karena stok telah pulih.';
        }
      } else {
        // scanAction === 'OUT' (Barang Keluar / Penjualan Kasir)
        if (previousStock < qty) {
          await client.query('ROLLBACK');
          return NextResponse.json({
            success: false,
            error: `Gagal Scan Barang Keluar: Sisa stok ${product.name} saat ini hanya ${previousStock} pcs, tidak mencukupi untuk pengeluaran ${qty} pcs.`,
          }, { status: 400 });
        }

        newStock = previousStock - qty;
        logType = 'BARCODE_OUT';
        qtyChange = -qty;

        await client.query(
          `UPDATE products SET current_stock = $1, updated_at = $2 WHERE id = $3`,
          [newStock, txDate, product.id]
        );

        // Catat sebagai pesanan penjualan kasir agar otomatis masuk ke omzet dan dashboard!
        const orderNumber = `SCAN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
        const unitPrice = parseFloat(product.price) || 0;
        const totalPrice = unitPrice * qty;
        const customerName = notes && notes.trim() ? notes.trim() : 'Pembeli Langsung (Kasir Scan)';
        const executionMs = Math.round((performance.now() - startTime) * 100) / 100;

        await client.query(
          `INSERT INTO orders (order_number, customer_name, customer_location, product_id, quantity, total_price, status, execution_ms, created_at)
           VALUES ($1, $2, 'Kasir Toko (Barcode Scan)', $3, $4, $5, 'DELIVERED', $6, $7)`,
          [orderNumber, customerName, product.id, qty, totalPrice, executionMs, txDate]
        );

        // Check if falls below threshold
        if (newStock === 0) {
          await client.query(
            `INSERT INTO stock_alerts (product_id, alert_type, message, created_at)
             VALUES ($1, 'OUT_OF_STOCK', $2, $3)`,
            [product.id, `PERINGATAN STOK HABIS: Pemindaian barcode keluar membuat ${product.name} (${product.sku}) habis total (0 pcs).`, txDate]
          );
          alertActionMessage = 'Peringatan stok habis otomatis dipicu!';
        } else if (newStock <= minThreshold) {
          await client.query(
            `INSERT INTO stock_alerts (product_id, alert_type, message, created_at)
             VALUES ($1, 'LOW_STOCK', $2, $3)`,
            [product.id, `PERINGATAN STOK MENIPIS: Stok ${product.name} (${product.sku}) menyentuh ${newStock} pcs (Batas min: ${minThreshold} pcs).`, txDate]
          );
          alertActionMessage = 'Peringatan stok menipis otomatis dipicu!';
        }
      }

      // Record to audit trail / mutasi barang
      const noteText = notes.trim() || `Barcode Scan ${scanAction === 'IN' ? 'Barang Masuk (Kulakan)' : 'Barang Keluar (Penjualan Kasir)'}`;
      await client.query(
        `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [product.id, product.sku, logType, qtyChange, previousStock, newStock, noteText, txDate]
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
          transactionDate: txDate.toISOString(),
        },
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses pemindaian barcode' },
      { status: 500 }
    );
  }
}
