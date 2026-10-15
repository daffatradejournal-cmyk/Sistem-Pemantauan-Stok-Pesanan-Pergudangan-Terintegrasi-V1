import { Pool, PoolConfig } from 'pg';

let poolInstance: Pool | null = null;
let currentConnectionString: string | null = null;

export function getDatabaseUrl(): string {
  if (process.env.APP_DATABASE_URL_OVERRIDE) {
    return process.env.APP_DATABASE_URL_OVERRIDE;
  }
  return process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/warehouse_db?sslmode=disable';
}

export function setDatabaseUrlOverride(url: string) {
  process.env.APP_DATABASE_URL_OVERRIDE = url;
  if (poolInstance) {
    poolInstance.end().catch(() => {});
    poolInstance = null;
    currentConnectionString = null;
  }
}

export function getPool(): Pool {
  const connectionString = getDatabaseUrl();

  if (poolInstance && currentConnectionString === connectionString) {
    return poolInstance;
  }

  if (poolInstance) {
    poolInstance.end().catch(() => {});
  }

  const isCloudOrSsl = 
    connectionString.includes('neon.tech') || 
    connectionString.includes('supabase.co') || 
    connectionString.includes('pooler.supabase.com') ||
    connectionString.includes('railway.app') || 
    connectionString.includes('render.com') ||
    connectionString.includes('sslmode=require');

  const config: PoolConfig = {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
  };

  poolInstance = new Pool(config);
  currentConnectionString = connectionString;

  poolInstance.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return poolInstance;
}

export async function testConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  database?: string;
  tableCount?: number;
  error?: string;
  tables?: string[];
}> {
  const start = performance.now();
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT current_database() as db_name, NOW() as server_time');
      const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('products', 'orders', 'stock_logs', 'stock_alerts')
      `);
      const latencyMs = Math.round((performance.now() - start) * 10) / 10;
      const tables = tableRes.rows.map(r => r.table_name);
      return {
        connected: true,
        latencyMs,
        database: res.rows[0]?.db_name || 'unknown',
        tableCount: tables.length,
        tables,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    return {
      connected: false,
      latencyMs,
      error: err.message || 'Gagal terhubung ke database PostgreSQL',
    };
  }
}

export async function initDatabase(): Promise<{ success: boolean; message: string; tables: string[] }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Table products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
        min_stock_threshold INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Table orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(64) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_location VARCHAR(255) NOT NULL DEFAULT 'Gudang Utama',
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        total_price NUMERIC(12, 2) NOT NULL,
        status VARCHAR(32) NOT NULL, -- 'DELIVERED', 'PROCESSED', or 'CANCELLED'
        execution_ms NUMERIC(8, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table stock_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_logs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(64) NOT NULL,
        change_type VARCHAR(32) NOT NULL, -- 'BARCODE_IN', 'BARCODE_OUT', 'ORDER_DEDUCTION', 'MANUAL_ADJUST'
        quantity_change INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Table stock_alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        alert_type VARCHAR(32) NOT NULL, -- 'LOW_STOCK' or 'OUT_OF_STOCK'
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create useful indexes for high performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON stock_alerts(is_resolved, created_at DESC);
    `);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Semua 4 tabel (products, orders, stock_logs, stock_alerts) dan index berhasil diinisialisasi!',
      tables: ['products', 'orders', 'stock_logs', 'stock_alerts'],
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw new Error(`Gagal inisialisasi tabel PostgreSQL: ${err.message}`);
  } finally {
    client.release();
  }
}

export async function seedDatabase(): Promise<{ success: boolean; message: string; count: number }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Make sure tables exist
    await initDatabase();

    // Check existing products count
    const existing = await client.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(existing.rows[0].count, 10) > 0) {
      // Clean previous data for fresh seed
      await client.query('DELETE FROM stock_alerts');
      await client.query('DELETE FROM stock_logs');
      await client.query('DELETE FROM orders');
      await client.query('DELETE FROM products');
    }

    const sampleProducts = [
      {
        sku: 'SKU-LOG-001',
        name: 'Barcode Scanner Handheld 2D USB',
        category: 'Peralatan Scanning',
        price: 850000,
        stock: 35,
        min: 10,
      },
      {
        sku: 'SKU-LOG-002',
        name: 'Thermal Label Roll 100x150mm (500pcs)',
        category: 'Packaging & Consumables',
        price: 95000,
        stock: 120,
        min: 25,
      },
      {
        sku: 'SKU-LOG-003',
        name: 'Hand Pallet Jack Hydraulic 3 Ton',
        category: 'Heavy Material Handling',
        price: 4750000,
        stock: 4, // Low stock on purpose
        min: 5,
      },
      {
        sku: 'SKU-LOG-004',
        name: 'Stretch Film Industri 50cm x 300m',
        category: 'Packaging & Consumables',
        price: 78000,
        stock: 0, // Out of stock on purpose
        min: 15,
      },
      {
        sku: 'SKU-LOG-005',
        name: 'Industrial Heavy Duty Storage Rack 4-Tier',
        category: 'Pergudangan & Storage',
        price: 3200000,
        stock: 12,
        min: 3,
      },
      {
        sku: 'SKU-LOG-006',
        name: 'Safety Helmet Pro Vented + Chinstrap',
        category: 'Safety & PPE',
        price: 135000,
        stock: 48,
        min: 10,
      },
      {
        sku: 'SKU-LOG-007',
        name: 'RFID UHF Warehouse Inventory Tag (Pack 100)',
        category: 'Peralatan Scanning',
        price: 450000,
        stock: 3, // Low stock on purpose
        min: 8,
      },
      {
        sku: 'SKU-LOG-008',
        name: 'Manual Box Strapping Tool Tensioner',
        category: 'Packaging & Consumables',
        price: 260000,
        stock: 22,
        min: 5,
      },
    ];

    const insertedProducts: Array<{ id: number; sku: string; price: number; stock: number; min: number; name: string }> = [];

    for (const p of sampleProducts) {
      const res = await client.query(
        `INSERT INTO products (sku, name, category, price, current_stock, min_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, sku, price, current_stock, min_stock_threshold, name`,
        [p.sku, p.name, p.category, p.price, p.stock, p.min]
      );
      insertedProducts.push({
        id: res.rows[0].id,
        sku: res.rows[0].sku,
        price: Number(res.rows[0].price),
        stock: res.rows[0].current_stock,
        min: res.rows[0].min_stock_threshold,
        name: res.rows[0].name,
      });

      // Initial stock log
      await client.query(
        `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes)
         VALUES ($1, $2, 'BARCODE_IN', $3, 0, $3, 'Initial inventory setup / stock opname')`,
        [res.rows[0].id, res.rows[0].sku, p.stock]
      );

      // Check alerts
      if (p.stock === 0) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message, is_resolved)
           VALUES ($1, 'OUT_OF_STOCK', $2, false)`,
          [res.rows[0].id, `PERINGATAN: Stok produk ${p.name} (${p.sku}) habis total (0 unit)! Segera lakukan pengadaan.`]
        );
      } else if (p.stock <= p.min) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message, is_resolved)
           VALUES ($1, 'LOW_STOCK', $2, false)`,
          [res.rows[0].id, `PERINGATAN: Stok produk ${p.name} (${p.sku}) tersisa ${p.stock} unit (Batas minimum: ${p.min} unit).`]
        );
      }
    }

    // Insert sample orders (matches the reference image order table)
    const sampleOrders = [
      {
        order_number: 'ORD-2024-0801',
        customer_name: 'Press Logistika',
        customer_location: 'London Depot #4',
        product_index: 0,
        qty: 1,
        status: 'DELIVERED',
        exec_ms: 14.2,
        date_offset_hours: 2,
      },
      {
        order_number: 'ORD-2024-0802',
        customer_name: 'Marina Sentosa',
        customer_location: 'Manchester Hub',
        product_index: 1,
        qty: 4,
        status: 'PROCESSED',
        exec_ms: 18.5,
        date_offset_hours: 6,
      },
      {
        order_number: 'ORD-2024-0803',
        customer_name: 'Alex Warehouse Ltd',
        customer_location: 'Unknown Facility B',
        product_index: 3, // Out of stock product
        qty: 5,
        status: 'CANCELLED',
        exec_ms: 22.8,
        date_offset_hours: 12,
      },
      {
        order_number: 'ORD-2024-0804',
        customer_name: 'Robert Logistics',
        customer_location: 'New York Cargo Terminal',
        product_index: 4,
        qty: 1,
        status: 'DELIVERED',
        exec_ms: 12.1,
        date_offset_hours: 24,
      },
      {
        order_number: 'ORD-2024-0805',
        customer_name: 'PT Mitra Sukses Gudang',
        customer_location: 'Jakarta Hub 1',
        product_index: 5,
        qty: 10,
        status: 'DELIVERED',
        exec_ms: 16.4,
        date_offset_hours: 36,
      },
      {
        order_number: 'ORD-2024-0806',
        customer_name: 'Surabaya Express DC',
        customer_location: 'Surabaya Timur',
        product_index: 6,
        qty: 15,
        status: 'CANCELLED', // Rejected by row lock insufficient stock
        exec_ms: 25.0,
        date_offset_hours: 48,
      },
    ];

    for (const ord of sampleOrders) {
      const prod = insertedProducts[ord.product_index];
      const totalPrice = prod.price * ord.qty;

      await client.query(
        `INSERT INTO orders (order_number, customer_name, customer_location, product_id, quantity, total_price, status, execution_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' hours')::INTERVAL)`,
        [
          ord.order_number,
          ord.customer_name,
          ord.customer_location,
          prod.id,
          ord.qty,
          totalPrice,
          ord.status,
          ord.exec_ms,
          ord.date_offset_hours,
        ]
      );

      if (ord.status === 'DELIVERED') {
        await client.query(
          `INSERT INTO stock_logs (product_id, sku, change_type, quantity_change, previous_stock, new_stock, notes, created_at)
           VALUES ($1, $2, 'ORDER_DEDUCTION', $3, $4, $5, $6, NOW() - ($7 || ' hours')::INTERVAL)`,
          [
            prod.id,
            prod.sku,
            -ord.qty,
            prod.stock + ord.qty,
            prod.stock,
            `Auto-deduction order ${ord.order_number}`,
            ord.date_offset_hours,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return {
      success: true,
      message: `Berhasil mengisi database dengan ${sampleProducts.length} produk katalog gudang, ${sampleOrders.length} transaksi pesanan awal, log mutasi stok, dan notifikasi peringatan stok!`,
      count: sampleProducts.length,
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw new Error(`Gagal seeding database PostgreSQL: ${err.message}`);
  } finally {
    client.release();
  }
}
