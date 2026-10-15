import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureTablesExist();
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const yearParam = searchParams.get('year') || now.getFullYear().toString();
  const monthParam = searchParams.get('month') || (now.getMonth() + 1).toString();

  const year = parseInt(yearParam, 10) || now.getFullYear();
  const month = parseInt(monthParam, 10) || (now.getMonth() + 1);

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNamesId[month - 1] || `Bulan ${month}`;

  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // 1. Monthly Financial KPI Summary
      const summaryRes = await client.query(`
        SELECT 
          COUNT(CASE WHEN o.status = 'DELIVERED' THEN 1 END) as approved_orders,
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN o.quantity ELSE 0 END), 0) as items_sold,
          COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN o.total_price ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN (o.quantity * COALESCE(p.cost_price, 0)) ELSE 0 END), 0) as total_cost,
          COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN (o.total_price - (o.quantity * COALESCE(p.cost_price, 0))) ELSE 0 END), 0) as net_profit
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE EXTRACT(YEAR FROM o.created_at) = $1
          AND EXTRACT(MONTH FROM o.created_at) = $2
      `, [year, month]);

      // Stock movements count (inflow vs outflow)
      const stockMovementSummaryRes = await client.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN sl.quantity_change > 0 THEN sl.quantity_change ELSE 0 END), 0) as inflow,
          COALESCE(SUM(CASE WHEN sl.quantity_change < 0 THEN ABS(sl.quantity_change) ELSE 0 END), 0) as outflow,
          COUNT(*) as total_logs
        FROM stock_logs sl
        WHERE EXTRACT(YEAR FROM sl.created_at) = $1
          AND EXTRACT(MONTH FROM sl.created_at) = $2
      `, [year, month]);

      // 2. Breakdown Barang Laku / Terjual di Bulan Ini
      const topProductsRes = await client.query(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          COALESCE(p.price, 0) as price,
          COALESCE(p.cost_price, 0) as cost_price,
          COALESCE(SUM(o.quantity), 0) as total_sold,
          COALESCE(SUM(o.total_price), 0) as total_revenue,
          COALESCE(SUM(o.quantity * COALESCE(p.cost_price, 0)), 0) as total_cost,
          COALESCE(SUM(o.total_price - (o.quantity * COALESCE(p.cost_price, 0))), 0) as net_profit,
          COUNT(o.id) as order_count
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE EXTRACT(YEAR FROM o.created_at) = $1
          AND EXTRACT(MONTH FROM o.created_at) = $2
          AND o.status = 'DELIVERED'
        GROUP BY p.id, p.sku, p.name, p.category, p.price, p.cost_price
        ORDER BY total_sold DESC, total_revenue DESC
      `, [year, month]);

      // 3. Log Mutasi Keluar & Masuk Bulan Ini
      const stockLogsRes = await client.query(`
        SELECT 
          sl.id,
          sl.sku,
          sl.change_type,
          sl.quantity_change,
          sl.previous_stock,
          sl.new_stock,
          sl.notes,
          sl.created_at,
          p.name as product_name,
          p.category as product_category
        FROM stock_logs sl
        JOIN products p ON sl.product_id = p.id
        WHERE EXTRACT(YEAR FROM sl.created_at) = $1
          AND EXTRACT(MONTH FROM sl.created_at) = $2
        ORDER BY sl.created_at DESC
        LIMIT 200
      `, [year, month]);

      const sum = summaryRes.rows[0];
      const stockSum = stockMovementSummaryRes.rows[0];

      const totalRevenue = parseFloat(sum.total_revenue) || 0;
      const totalCost = parseFloat(sum.total_cost) || 0;
      const netProfit = parseFloat(sum.net_profit) || 0;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          period: {
            year,
            month,
            monthName,
            formattedLabel: `${monthName} ${year}`,
          },
          summary: {
            approvedOrders: parseInt(sum.approved_orders, 10) || 0,
            totalOrders: parseInt(sum.total_orders, 10) || 0,
            itemsSold: parseInt(sum.items_sold, 10) || 0,
            totalRevenue,
            totalCost,
            netProfit,
            profitMargin: Math.round(profitMargin * 10) / 10,
            inflowQty: parseInt(stockSum.inflow, 10) || 0,
            outflowQty: parseInt(stockSum.outflow, 10) || 0,
            totalMovements: parseInt(stockSum.total_logs, 10) || 0,
          },
          topProducts: topProductsRes.rows.map(r => {
            const rev = parseFloat(r.total_revenue) || 0;
            const cost = parseFloat(r.total_cost) || 0;
            const prof = parseFloat(r.net_profit) || 0;
            const margin = rev > 0 ? (prof / rev) * 100 : 0;
            return {
              id: r.id,
              sku: r.sku,
              name: r.name,
              category: r.category,
              price: parseFloat(r.price) || 0,
              costPrice: parseFloat(r.cost_price) || 0,
              totalSold: parseInt(r.total_sold, 10) || 0,
              totalRevenue: rev,
              totalCost: cost,
              netProfit: prof,
              profitMargin: Math.round(margin * 10) / 10,
              orderCount: parseInt(r.order_count, 10) || 0,
            };
          }),
          stockMovements: stockLogsRes.rows.map(r => ({
            id: r.id,
            sku: r.sku,
            productName: r.product_name,
            productCategory: r.product_category,
            changeType: r.change_type,
            quantityChange: parseInt(r.quantity_change, 10) || 0,
            previousStock: parseInt(r.previous_stock, 10) || 0,
            newStock: parseInt(r.new_stock, 10) || 0,
            notes: r.notes || '',
            createdAt: r.created_at,
          })),
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Gagal memuat rincian transaksi bulanan',
    }, { status: 500 });
  }
}
