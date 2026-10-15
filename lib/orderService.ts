import { getPool } from './db';

export interface OrderInput {
  productId: number;
  customerName: string;
  customerLocation?: string;
  quantity: number;
}

export interface OrderResult {
  success: boolean;
  orderNumber: string;
  customerName: string;
  customerLocation: string;
  productId: number;
  productName: string;
  sku: string;
  requestedQuantity: number;
  totalPrice: number;
  status: 'DELIVERED' | 'CANCELLED';
  previousStock: number;
  remainingStock: number;
  executionMs: number;
  message: string;
}

export async function processOrderWithLock(input: OrderInput): Promise<OrderResult> {
  const startTime = performance.now();
  const pool = getPool();
  const client = await pool.connect();

  const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${Date.now()}-${timestampSuffix}`;
  const customerLoc = input.customerLocation || 'Gudang Utama';

  let productSnapshot: {
    id: number;
    sku: string;
    name: string;
    price: number;
    current_stock: number;
    min_stock_threshold: number;
  } | null = null;

  try {
    await client.query('BEGIN');

    // 1. SELECT ... FOR UPDATE (Row-Level Locking on PostgreSQL)
    const selectRes = await client.query(
      `SELECT id, sku, name, price, current_stock, min_stock_threshold 
       FROM products 
       WHERE id = $1 
       FOR UPDATE`,
      [input.productId]
    );

    if (selectRes.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new Error(`Produk dengan ID ${input.productId} tidak ditemukan.`);
    }

    productSnapshot = {
      id: selectRes.rows[0].id,
      sku: selectRes.rows[0].sku,
      name: selectRes.rows[0].name,
      price: parseFloat(selectRes.rows[0].price),
      current_stock: parseInt(selectRes.rows[0].current_stock, 10),
      min_stock_threshold: parseInt(selectRes.rows[0].min_stock_threshold, 10),
    };

    const previousStock = productSnapshot.current_stock;
    const requestedQty = input.quantity;
    const totalPrice = productSnapshot.price * requestedQty;

    // 2. Evaluate current_stock >= requestedQty
    if (previousStock >= requestedQty) {
      const newStock = previousStock - requestedQty;

      // Update stock
      await client.query(
        `UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2`,
        [newStock, productSnapshot.id]
      );

      // Record successful order in DB
      const execMs = Math.round((performance.now() - startTime) * 100) / 100;
      await client.query(
        `INSERT INTO orders (order_number, customer_name, customer_location, product_id, quantity, total_price, status, execution_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'DELIVERED', $7, NOW())`,
        [orderNumber, input.customerName, customerLoc, productSnapshot.id, requestedQty, totalPrice, execMs]
      );

      // Record audit log
      await client.query(
        `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes)
         VALUES ($1, $2, 'ORDER_DEDUCTION', $3, $4, $5, $6)`,
        [
          productSnapshot.id,
          productSnapshot.sku,
          -requestedQty,
          previousStock,
          newStock,
          `Pesanan Berhasil: ${orderNumber} (${input.customerName})`,
        ]
      );

      // Stock Alert trigger check
      if (newStock === 0) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message)
           VALUES ($1, 'OUT_OF_STOCK', $2)`,
          [productSnapshot.id, `STOK HABIS: Produk ${productSnapshot.name} (${productSnapshot.sku}) telah mencapai 0 unit akibat pesanan ${orderNumber}.`]
        );
      } else if (newStock <= productSnapshot.min_stock_threshold) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message)
           VALUES ($1, 'LOW_STOCK', $2)`,
          [productSnapshot.id, `STOK MENIPIS: Produk ${productSnapshot.name} (${productSnapshot.sku}) tersisa ${newStock} unit (Batas min: ${productSnapshot.min_stock_threshold}).`]
        );
      }

      await client.query('COMMIT');

      return {
        success: true,
        orderNumber,
        customerName: input.customerName,
        customerLocation: customerLoc,
        productId: productSnapshot.id,
        productName: productSnapshot.name,
        sku: productSnapshot.sku,
        requestedQuantity: requestedQty,
        totalPrice,
        status: 'DELIVERED',
        previousStock,
        remainingStock: newStock,
        executionMs: execMs,
        message: `Pesanan berhasil diproses! Stok berkurang dari ${previousStock} menjadi ${newStock}.`,
      };
    } else {
      // Stock is insufficient -> ROLLBACK product change
      await client.query('ROLLBACK');

      const execMs = Math.round((performance.now() - startTime) * 100) / 100;

      // Insert rejected order record outside rollback transaction
      await pool.query(
        `INSERT INTO orders (order_number, customer_name, customer_location, product_id, quantity, total_price, status, execution_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'CANCELLED', $7, NOW())`,
        [orderNumber, input.customerName, customerLoc, productSnapshot.id, requestedQty, totalPrice, execMs]
      );

      return {
        success: false,
        orderNumber,
        customerName: input.customerName,
        customerLocation: customerLoc,
        productId: productSnapshot.id,
        productName: productSnapshot.name,
        sku: productSnapshot.sku,
        requestedQuantity: requestedQty,
        totalPrice,
        status: 'CANCELLED',
        previousStock,
        remainingStock: previousStock,
        executionMs: execMs,
        message: `Pesanan DITOLAK oleh DB Lock: Stok tersisa ${previousStock}, sedangkan permintaan sejumlah ${requestedQty}. Sistem mencegah stok menjadi minus!`,
      };
    }
  } catch (err: any) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}
