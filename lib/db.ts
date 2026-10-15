import { Pool, PoolConfig } from 'pg';
import { cookies } from 'next/headers';

let poolInstance: Pool | null = null;
let currentConnectionString: string | null = null;

export function getDatabaseUrl(): string {
  if (process.env.APP_DATABASE_URL_OVERRIDE) {
    return process.env.APP_DATABASE_URL_OVERRIDE;
  }
  try {
    const cookieStore = cookies();
    const cookieDbUrl = cookieStore.get('app_db_url')?.value;
    if (cookieDbUrl) {
      const decoded = decodeURIComponent(cookieDbUrl);
      if (decoded.startsWith('postgres')) {
        return decoded;
      }
    }
  } catch (err) {
    // Di luar request context
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
        AND table_name IN ('products', 'orders', 'stock_logs', 'stock_alerts', 'store_profile')
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

    // 5. Table store_profile (Profil Pemilik Toko UMKM)
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_profile (
        id SERIAL PRIMARY KEY,
        owner_name VARCHAR(255) NOT NULL DEFAULT 'Muhammad',
        store_name VARCHAR(255) NOT NULL DEFAULT 'StokPintar UMKM',
        role_title VARCHAR(100) NOT NULL DEFAULT 'Pemilik Usaha (UMKM)',
        avatar_url TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO store_profile (id, owner_name, store_name, role_title, avatar_url)
      VALUES (1, 'Muhammad', 'StokPintar UMKM', 'Pemilik Usaha (UMKM)', '')
      ON CONFLICT (id) DO NOTHING;
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
      message: 'Semua 5 tabel (products, orders, stock_logs, stock_alerts, store_profile) dan index berhasil diinisialisasi!',
      tables: ['products', 'orders', 'stock_logs', 'stock_alerts', 'store_profile'],
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw new Error(`Gagal inisialisasi tabel PostgreSQL: ${err.message}`);
  } finally {
    client.release();
  }
}

let hasEnsuredTables = false;
export async function ensureTablesExist(): Promise<void> {
  if (hasEnsuredTables) return;
  try {
    await initDatabase();
    hasEnsuredTables = true;
  } catch (err) {
    console.error('Auto migration check failed (will retry next time):', err);
  }
}

export async function getStoreProfile(): Promise<{
  ownerName: string;
  storeName: string;
  roleTitle: string;
  avatarUrl: string;
}> {
  try {
    const pool = getPool();
    const res = await pool.query('SELECT owner_name, store_name, role_title, avatar_url FROM store_profile WHERE id = 1');
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        ownerName: row.owner_name || 'Muhammad',
        storeName: row.store_name || 'StokPintar UMKM',
        roleTitle: row.role_title || 'Pemilik Usaha (UMKM)',
        avatarUrl: row.avatar_url || '',
      };
    }
  } catch (err) {
    // If table doesn't exist yet, return default
  }
  return {
    ownerName: 'Muhammad',
    storeName: 'StokPintar UMKM',
    roleTitle: 'Pemilik Usaha (UMKM)',
    avatarUrl: '',
  };
}

export async function updateStoreProfile(profile: {
  ownerName?: string;
  storeName?: string;
  roleTitle?: string;
  avatarUrl?: string;
}): Promise<{
  ownerName: string;
  storeName: string;
  roleTitle: string;
  avatarUrl: string;
}> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_profile (
      id SERIAL PRIMARY KEY,
      owner_name VARCHAR(255) NOT NULL DEFAULT 'Muhammad',
      store_name VARCHAR(255) NOT NULL DEFAULT 'StokPintar UMKM',
      role_title VARCHAR(100) NOT NULL DEFAULT 'Pemilik Usaha (UMKM)',
      avatar_url TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const res = await pool.query(`
    INSERT INTO store_profile (id, owner_name, store_name, role_title, avatar_url, updated_at)
    VALUES (1, $1, $2, $3, $4, NOW())
    ON CONFLICT (id) DO UPDATE
    SET owner_name = EXCLUDED.owner_name,
        store_name = EXCLUDED.store_name,
        role_title = EXCLUDED.role_title,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
    RETURNING owner_name, store_name, role_title, avatar_url;
  `, [
    profile.ownerName || 'Muhammad',
    profile.storeName || 'StokPintar UMKM',
    profile.roleTitle || 'Pemilik Usaha (UMKM)',
    profile.avatarUrl || '',
  ]);

  const row = res.rows[0];
  return {
    ownerName: row.owner_name,
    storeName: row.store_name,
    roleTitle: row.role_title,
    avatarUrl: row.avatar_url,
  };
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
        sku: 'BRG-BML-001',
        name: 'Minyak Goreng Sawit Bimoli Pouch 2 Liter',
        category: 'Sembako & Minyak',
        price: 36000,
        stock: 45,
        min: 10,
      },
      {
        sku: 'BRG-BRS-002',
        name: 'Beras Pandan Wangi Super Ramos 5 Kg',
        category: 'Bahan Pokok & Beras',
        price: 74000,
        stock: 30,
        min: 8,
      },
      {
        sku: 'BRG-GLA-003',
        name: 'Gula Pasir Kristal Putih Gulaku 1 Kg',
        category: 'Sembako & Pemanis',
        price: 18500,
        stock: 4, // Stok menipis untuk demo alert
        min: 10,
      },
      {
        sku: 'BRG-KOP-004',
        name: 'Kopi Bubuk Robusta Asli Dampit 250 Gram',
        category: 'Kopi & Minuman',
        price: 28000,
        stock: 0, // Stok habis untuk demo alert out of stock
        min: 5,
      },
      {
        sku: 'BRG-TPG-005',
        name: 'Tepung Terigu Serbaguna Segitiga Biru 1 Kg',
        category: 'Bahan Kue & Dapur',
        price: 13500,
        stock: 60,
        min: 15,
      },
      {
        sku: 'BRG-KRP-006',
        name: 'Keripik Singkong Balado Pedas Manis UMKM 200g',
        category: 'Snack & Camilan UMKM',
        price: 16000,
        stock: 25,
        min: 6,
      },
      {
        sku: 'BRG-THS-007',
        name: 'Teh Celup Melati Sosro Kotak Isi 30 Kantong',
        category: 'Kopi & Minuman',
        price: 7500,
        stock: 3, // Stok menipis untuk demo alert
        min: 8,
      },
      {
        sku: 'BRG-SNL-008',
        name: 'Sabun Cuci Piring Sunlight Jeruk Nipis 750 ml',
        category: 'Kebutuhan Toko & Rumah',
        price: 17000,
        stock: 40,
        min: 10,
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
         VALUES ($1, $2, 'BARCODE_IN', $3, 0, $3, 'Stok awal setup inventaris toko / kulakan pertama')`,
        [res.rows[0].id, res.rows[0].sku, p.stock]
      );

      // Check alerts
      if (p.stock === 0) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message, is_resolved)
           VALUES ($1, 'OUT_OF_STOCK', $2, false)`,
          [res.rows[0].id, `PERINGATAN: Stok barang ${p.name} (${p.sku}) habis total (0 unit)! Segera lakukan kulakan ulang.`]
        );
      } else if (p.stock <= p.min) {
        await client.query(
          `INSERT INTO stock_alerts (product_id, alert_type, message, is_resolved)
           VALUES ($1, 'LOW_STOCK', $2, false)`,
          [res.rows[0].id, `PERINGATAN: Stok barang ${p.name} (${p.sku}) tersisa ${p.stock} unit (Batas aman toko: ${p.min} unit).`]
        );
      }
    }

    // Insert sample orders matching Indonesian UMKM clients
    const sampleOrders = [
      {
        order_number: 'ORD-UMKM-0801',
        customer_name: 'Warung Bu Siti',
        customer_location: 'Pasar Minggu, Jaksel',
        product_index: 0,
        qty: 3,
        status: 'DELIVERED',
        exec_ms: 12.2,
        date_offset_hours: 2,
      },
      {
        order_number: 'ORD-UMKM-0802',
        customer_name: 'Toko Berkah Mandiri',
        customer_location: 'Cinere, Depok',
        product_index: 1,
        qty: 2,
        status: 'PROCESSED',
        exec_ms: 15.5,
        date_offset_hours: 5,
      },
      {
        order_number: 'ORD-UMKM-0803',
        customer_name: 'Kafe Kopi Sahabat',
        customer_location: 'Dago, Bandung',
        product_index: 3, // Produk kopi stok 0
        qty: 4,
        status: 'CANCELLED',
        exec_ms: 19.8,
        date_offset_hours: 10,
      },
      {
        order_number: 'ORD-UMKM-0804',
        customer_name: 'Kedai Makan Mas Budi',
        customer_location: 'Galaxy, Bekasi',
        product_index: 4,
        qty: 5,
        status: 'DELIVERED',
        exec_ms: 11.4,
        date_offset_hours: 20,
      },
      {
        order_number: 'ORD-UMKM-0805',
        customer_name: 'Koperasi Warga Barokah',
        customer_location: 'Tebet, Jakarta',
        product_index: 5,
        qty: 8,
        status: 'DELIVERED',
        exec_ms: 14.1,
        date_offset_hours: 32,
      },
      {
        order_number: 'ORD-UMKM-0806',
        customer_name: 'Grosir Sembako Rezeki',
        customer_location: 'Cibubur, Ciracas',
        product_index: 6,
        qty: 20,
        status: 'CANCELLED', // Ditolak karena stok fisik tersisa 3 unit
        exec_ms: 21.0,
        date_offset_hours: 44,
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
