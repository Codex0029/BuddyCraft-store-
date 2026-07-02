import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Coupon, AuditLog } from '@/lib/db';

// Helper to verify admin status
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('user-token-', '');

  const db = await getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return { error: 'User not found', status: 404 };
  }

  if (!user.isAdmin) {
    return { error: 'Forbidden. Admin privileges required.', status: 403 };
  }

  return { user, db };
}

// GET all coupons (Admin) or GET single coupon verification (Player)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    const db = await getDb();

    // If "code" parameter is passed, it is a player verifying their coupon code during checkout!
    if (code) {
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.visible);

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 404 });
      }

      // Check expiry date
      const expiry = new Date(coupon.expiryDate);
      const now = new Date();
      if (expiry < now) {
        return NextResponse.json({ error: 'This coupon code has expired.' }, { status: 400 });
      }

      // Check usage limits
      if (coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'This coupon has reached its maximum usage limit.' }, { status: 400 });
      }

      return NextResponse.json({ coupon });
    }

    // Otherwise, require Admin status to view all coupons
    const authResult = await verifyAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    return NextResponse.json({ coupons: db.coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// POST: Add new coupon (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error || !authResult.db || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    const { user, db } = authResult;
    const body = await req.json();

    const { code, type, value, expiryDate, usageLimit, visible } = body;

    if (!code || !type || value === undefined || !expiryDate || usageLimit === undefined) {
      return NextResponse.json({ error: 'All coupon fields are required.' }, { status: 400 });
    }

    // Check if code already exists
    const codeExists = db.coupons.some((c) => c.code.toUpperCase() === code.toUpperCase());
    if (codeExists) {
      return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 400 });
    }

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: code.toUpperCase(),
      type,
      value: Number(value),
      expiryDate,
      usageLimit: Number(usageLimit),
      usageCount: 0,
      visible: visible !== undefined ? Boolean(visible) : true,
    };

    db.coupons.push(newCoupon);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'ADD_COUPON',
      details: `Created coupon ${newCoupon.code} (${type}: ${value}).`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ coupon: newCoupon, message: 'Coupon added successfully!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// PUT: Edit coupon (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error || !authResult.db || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    const { user, db } = authResult;
    const body = await req.json();

    const { id, code, type, value, expiryDate, usageLimit, visible } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const couponIndex = db.coupons.findIndex((c) => c.id === id);
    if (couponIndex === -1) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const existingCoupon = db.coupons[couponIndex];

    const updatedCoupon: Coupon = {
      ...existingCoupon,
      code: code !== undefined ? code.toUpperCase() : existingCoupon.code,
      type: type !== undefined ? type : existingCoupon.type,
      value: value !== undefined ? Number(value) : existingCoupon.value,
      expiryDate: expiryDate !== undefined ? expiryDate : existingCoupon.expiryDate,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : existingCoupon.usageLimit,
      visible: visible !== undefined ? Boolean(visible) : existingCoupon.visible,
    };

    db.coupons[couponIndex] = updatedCoupon;

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'EDIT_COUPON',
      details: `Updated coupon ${updatedCoupon.code}.`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ coupon: updatedCoupon, message: 'Coupon updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// DELETE: Delete coupon (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error || !authResult.db || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    const { user, db } = authResult;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const couponIndex = db.coupons.findIndex((c) => c.id === id);
    if (couponIndex === -1) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const couponCode = db.coupons[couponIndex].code;
    db.coupons.splice(couponIndex, 1);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'DELETE_COUPON',
      details: `Deleted coupon ${couponCode} (${id}).`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ message: 'Coupon deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
