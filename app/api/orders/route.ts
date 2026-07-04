import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Order, OrderItem, AuditLog } from '@/lib/db';

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

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // If Admin, they can query ALL orders
    if (user.isAdmin) {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search');
      let orders = [...db.orders];

      if (search) {
        const query = search.toLowerCase();
        orders = orders.filter(
          (o) =>
            o.id.toLowerCase().includes(query) ||
            o.username.toLowerCase().includes(query) ||
            o.email.toLowerCase().includes(query) ||
            (o.couponCode && o.couponCode.toLowerCase().includes(query))
        );
      }

      // Sort by latest order first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ orders });
    }

    // Otherwise, regular users only get their own orders
    const userOrders = db.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders: userOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// Checkout - place an order
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated. Please log in to complete your purchase.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('user-token-', '');

    const db = await getDb();
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { items, couponCode, paymentGateway, transactionId, orderId, utr, screenshot, discordUsername, minecraftUsername } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Shopping cart is empty.' }, { status: 400 });
    }

    if (!paymentGateway) {
      return NextResponse.json({ error: 'Payment gateway must be selected.' }, { status: 400 });
    }

    // Re-verify items and calculate price server-side to prevent client-side price modification!
    let subtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of items) {
      const dbProduct = db.products.find((p) => p.id === item.productId && p.visible);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product with ID ${item.productId} is not available.` }, { status: 400 });
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Invalid quantity for product ${dbProduct.name}.` }, { status: 400 });
      }

      subtotal += dbProduct.price * qty;
      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        category: dbProduct.category,
        price: dbProduct.price,
        quantity: qty,
      });
    }

    // Verify and apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.visible);
      if (coupon) {
        // Double check expiration and limits
        const expiry = new Date(coupon.expiryDate);
        const now = new Date();
        if (expiry >= now && coupon.usageCount < coupon.usageLimit) {
          if (coupon.type === 'percentage') {
            discount = Number(((subtotal * coupon.value) / 100).toFixed(2));
          } else {
            discount = Math.min(coupon.value, subtotal);
          }
          // Increment usage count
          coupon.usageCount += 1;
        }
      }
    }

    // Apply Tax
    const taxRate = db.settings.taxRate || 0.05;
    const taxBeforeRound = (subtotal - discount) * taxRate;
    const tax = Number(taxBeforeRound.toFixed(2));

    const total = Number((subtotal - discount + tax).toFixed(2));

    // Determine order ID
    let finalOrderId = orderId;
    if (!finalOrderId) {
      if (paymentGateway === 'upi') {
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        finalOrderId = `BC-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        finalOrderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // Create Order
    const newOrder: Order = {
      id: finalOrderId,
      userId: user.id,
      username: minecraftUsername || user.username,
      email: user.email,
      items: validatedItems,
      subtotal,
      discount,
      tax,
      total,
      couponCode: couponCode || undefined,
      status: paymentGateway === 'upi' ? 'PENDING' : 'COMPLETED',
      paymentGateway,
      paymentId: utr || transactionId || `tx_${Math.random().toString(36).substring(2, 11)}`,
      utr: utr || (paymentGateway === 'upi' ? (transactionId || '') : undefined),
      screenshot: screenshot || undefined,
      discordUsername: discordUsername || undefined,
      createdAt: new Date().toISOString(),
    };

    db.orders.push(newOrder);
    await saveDb(db);

    return NextResponse.json({
      order: newOrder,
      message: paymentGateway === 'upi' 
        ? 'Payment details submitted! Order is now pending verification.'
        : 'Purchase completed successfully!',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// PUT /api/orders: Update order status (Cancel / Refund - Admin only)
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required.' }, { status: 400 });
    }

    const orderIndex = db.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const existingOrder = db.orders[orderIndex];
    existingOrder.status = status;
    
    let luckpermsLogs: string[] = [];
    if (status === 'COMPLETED') {
      existingOrder.verifiedAt = new Date().toISOString();
      
      // Look for ranks or keys or coins inside the order and simulate commands!
      for (const item of existingOrder.items) {
        if (item.category === 'ranks') {
          const rankCommand = `/lp user ${existingOrder.username} parent add ${item.productName.toLowerCase()}`;
          luckpermsLogs.push(rankCommand);
        } else if (item.category === 'crates') {
          const crateCommand = `/crate give ${existingOrder.username} ${item.productName.replace(' CRATE', '').toLowerCase()} ${item.quantity}`;
          luckpermsLogs.push(crateCommand);
        } else if (item.category === 'coins') {
          const coinsCount = item.productName.toLowerCase().includes('500') ? 500 : item.productName.toLowerCase().includes('1000') ? 1000 : item.productName.toLowerCase().includes('2500') ? 2500 : item.productName.toLowerCase().includes('5000') ? 5000 : 10000;
          const coinsCommand = `/coins give ${existingOrder.username} ${coinsCount * item.quantity}`;
          luckpermsLogs.push(coinsCommand);
        }
      }
    }
    
    db.orders[orderIndex] = existingOrder;

    // Create Audit Log
    const commandLogDetails = luckpermsLogs.length > 0 
      ? `\nExecuted In-Game Commands:\n${luckpermsLogs.map(cmd => ` > ${cmd}`).join('\n')}` 
      : '';
      
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: `ORDER_${status}`,
      details: `Updated Order status of ${orderId} to ${status}.${commandLogDetails}`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ 
      order: existingOrder, 
      luckpermsLogs,
      message: status === 'COMPLETED' 
        ? `Order successfully Verified! Executed LuckPerms/Server commands.` 
        : `Order status updated to ${status}!` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
