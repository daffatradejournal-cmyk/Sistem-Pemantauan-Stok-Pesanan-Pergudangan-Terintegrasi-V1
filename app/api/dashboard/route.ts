import { NextResponse } from 'next/server';
import { getPool, ensureTablesExist } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureTablesExist();
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // 1. KPI Cards data
      const kpiRes = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'DELIVERED') as approved_orders,
          (SELECT COALESCE(SUM(current_stock), 0) FROM products) as total_units,
          (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'DELIVERED') as total_revenue,
          (SELECT COALESCE(SUM(o.quantity * COALESCE(p.cost_price, 0)), 0) FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status = 'DELIVERED') as total_cost,
          (SELECT COALESCE(SUM(o.total_price - (o.quantity * COALESCE(p.cost_price, 0))), 0) FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status = 'DELIVERED') as net_profit,
          (SELECT COUNT(*) FROM orders WHERE status = 'CANCELLED') as blocked_orders,
          (SELECT COALESCE(SUM(current_stock * price), 0) FROM products) as inventory_valuation,
          (SELECT COALESCE(SUM(current_stock * cost_price), 0) FROM products) as inventory_valuation_cost,
          (SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = false) as active_alerts_count
      `);

      // 2. Donut 1: Stock Status (Safe, Low Stock, Out of Stock)
      const stockStatusRes = await client.query(`
        SELECT 
          COUNT(CASE WHEN current_stock > min_stock_threshold THEN 1 END) as safe_count,
          COUNT(CASE WHEN current_stock > 0 AND current_stock <= min_stock_threshold THEN 1 END) as low_count,
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_count,
          COUNT(*) as total_products
        FROM products
      `);

      // 3. Donut 2: Order Health (Delivered vs Cancelled vs Processed)
      const orderRatioRes = await client.query(`
        SELECT 
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
          COUNT(CASE WHEN status = 'PROCESSED' THEN 1 END) as processed_count,
          COUNT(*) as total_orders
        FROM orders
      `);

      // 4. Bar Chart: Sales & Profit Dynamics per month (1 to 12)
      const monthlyRes = await client.query(`
        WITH months AS (
          SELECT generate_series(1, 12) AS m
        )
        SELECT 
          to_char(to_date(m::text, 'MM'), 'Mon') as month_name,
          m as month_num,
          COALESCE(SUM(o.total_price), 0) as total_sales,
          COALESCE(SUM(o.quantity * COALESCE(p.cost_price, 0)), 0) as total_cost,
          COALESCE(SUM(o.total_price - (o.quantity * COALESCE(p.cost_price, 0))), 0) as net_profit,
          COALESCE(COUNT(o.id), 0) as order_count
        FROM months
        LEFT JOIN orders o ON EXTRACT(MONTH FROM o.created_at) = m 
          AND EXTRACT(YEAR FROM o.created_at) = $1
          AND o.status = 'DELIVERED'
        LEFT JOIN products p ON o.product_id = p.id
        GROUP BY m
        ORDER BY m ASC
      `, [year]);

      // 5. Line Chart: Stock Activity from stock_logs per month (inflow vs outflow)
      const stockActivityRes = await client.query(`
        WITH months AS (
          SELECT generate_series(1, 12) AS m
        )
        SELECT 
          to_char(to_date(m::text, 'MM'), 'Mon') as month_name,
          m as month_num,
          COALESCE(SUM(CASE WHEN sl.quantity_change > 0 THEN sl.quantity_change ELSE 0 END), 0) as inflow,
          COALESCE(SUM(CASE WHEN sl.quantity_change < 0 THEN ABS(sl.quantity_change) ELSE 0 END), 0) as outflow,
          COALESCE(COUNT(sl.id), 0) as total_movements
        FROM months
        LEFT JOIN stock_logs sl ON EXTRACT(MONTH FROM sl.created_at) = m 
          AND EXTRACT(YEAR FROM sl.created_at) = $1
        GROUP BY m
        ORDER BY m ASC
      `, [year]);

      // 6. Recent Orders for Customer Order Table
      const recentOrdersRes = await client.query(`
        SELECT 
          o.id,
          o.order_number,
          o.customer_name,
          o.customer_location,
          o.quantity,
          o.total_price,
          o.status,
          o.execution_ms,
          o.created_at,
          p.name as product_name,
          p.sku as product_sku
        FROM orders o
        JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);

      const kpi = kpiRes.rows[0];
      const stockStatus = stockStatusRes.rows[0];
      const orderRatio = orderRatioRes.rows[0];

      return NextResponse.json({
        success: true,
        data: {
          kpi: {
            orders: parseInt(kpi.total_orders, 10) || 0,
            approved: parseInt(kpi.approved_orders, 10) || 0,
            totalUnits: parseInt(kpi.total_units, 10) || 0,
            revenue: parseFloat(kpi.total_revenue) || 0,
            totalCost: parseFloat(kpi.total_cost) || 0,
            netProfit: parseFloat(kpi.net_profit) || 0,
            blockedOrders: parseInt(kpi.blocked_orders, 10) || 0,
            inventoryValuation: parseFloat(kpi.inventory_valuation) || 0,
            inventoryValuationCost: parseFloat(kpi.inventory_valuation_cost) || 0,
            activeAlertsCount: parseInt(kpi.active_alerts_count, 10) || 0,
          },
          donuts: {
            stockStatus: {
              safe: parseInt(stockStatus.safe_count, 10) || 0,
              low: parseInt(stockStatus.low_count, 10) || 0,
              out: parseInt(stockStatus.out_count, 10) || 0,
              total: parseInt(stockStatus.total_products, 10) || 0,
            },
            orderHealth: {
              delivered: parseInt(orderRatio.delivered_count, 10) || 0,
              cancelled: parseInt(orderRatio.cancelled_count, 10) || 0,
              processed: parseInt(orderRatio.processed_count, 10) || 0,
              total: parseInt(orderRatio.total_orders, 10) || 0,
            },
          },
          monthlyDynamics: monthlyRes.rows.map(r => ({
            month: r.month_name,
            monthNum: Number(r.month_num),
            sales: parseFloat(r.total_sales) || 0,
            cost: parseFloat(r.total_cost) || 0,
            netProfit: parseFloat(r.net_profit) || 0,
            orders: parseInt(r.order_count, 10) || 0,
          })),
          stockActivity: stockActivityRes.rows.map(r => ({
            month: r.month_name,
            monthNum: Number(r.month_num),
            inflow: parseInt(r.inflow, 10) || 0,
            outflow: parseInt(r.outflow, 10) || 0,
            movements: parseInt(r.total_movements, 10) || 0,
          })),
          recentOrders: recentOrdersRes.rows.map(r => ({
            id: r.id,
            orderNumber: r.order_number,
            customerName: r.customer_name,
            customerLocation: r.customer_location,
            quantity: r.quantity,
            totalPrice: parseFloat(r.total_price),
            status: r.status,
            executionMs: parseFloat(r.execution_ms),
            createdAt: r.created_at,
            productName: r.product_name,
            productSku: r.product_sku,
          })),
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Database query error',
    }, { status: 500 });
  }
}
