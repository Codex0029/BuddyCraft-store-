import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('user-token-', '');

    const db = await getDb();
    const user = db.users.find((u) => u.id === userId);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    // Compute basic statistics
    const totalUsers = db.users.length;
    const completedOrders = db.orders.filter((o) => o.status === 'COMPLETED');
    const totalOrdersCount = db.orders.length;

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    // Popular products computation
    const productFrequency: Record<string, { name: string; category: string; count: number; revenue: number }> = {};
    for (const order of completedOrders) {
      for (const item of order.items) {
        if (!productFrequency[item.productId]) {
          productFrequency[item.productId] = {
            name: item.productName,
            category: item.category,
            count: 0,
            revenue: 0,
          };
        }
        productFrequency[item.productId].count += item.quantity;
        productFrequency[item.productId].revenue += item.price * item.quantity;
      }
    }

    const popularProducts = Object.values(productFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Compute mock chart data for revenue over past 7 days (including real order values mapped to their dates)
    const dailyAnalytics: Record<string, { date: string; revenue: number; orders: number }> = {};
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDateStr = d.toISOString().split('T')[0];
      dailyAnalytics[isoDateStr] = {
        date: dateStr,
        revenue: 0,
        orders: 0,
      };
    }

    // Map actual completed orders onto our daily tracker
    for (const order of completedOrders) {
      const orderIsoDate = order.createdAt.split('T')[0];
      if (dailyAnalytics[orderIsoDate]) {
        dailyAnalytics[orderIsoDate].revenue += order.total;
        dailyAnalytics[orderIsoDate].orders += 1;
      }
    }

    const chartData = Object.values(dailyAnalytics);

    // Sort logs by latest
    const logs = [...db.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      stats: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders: totalOrdersCount,
        completedOrders: completedOrders.length,
        totalUsers,
        averageOrderValue: completedOrders.length > 0 ? Number((totalRevenue / completedOrders.length).toFixed(2)) : 0,
      },
      popularProducts,
      chartData,
      auditLogs: logs.slice(0, 30),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
