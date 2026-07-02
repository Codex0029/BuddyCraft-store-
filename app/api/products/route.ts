import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Product, AuditLog } from '@/lib/db';

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

// GET all products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const adminMode = searchParams.get('adminMode') === 'true';

    const db = await getDb();
    let products = db.products;

    // Sort: ranks order, then crate keys order, then coins package order
    products = products.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (!adminMode) {
      products = products.filter((p) => p.visible);
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// POST: Add new product (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error || !authResult.db || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    const { user, db } = authResult;
    const body = await req.json();

    const { name, category, price, description, features, icon, gradient, bonusCoins, order, visible } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'Name, category, and price are required.' }, { status: 400 });
    }

    const newProduct: Product = {
      id: `${category}-${Date.now()}`,
      name,
      category,
      price: Number(price),
      description: description || '',
      features: features || [],
      icon: icon || 'Shield',
      gradient: gradient || 'from-indigo-500 to-purple-600',
      bonusCoins: bonusCoins ? Number(bonusCoins) : undefined,
      order: order !== undefined ? Number(order) : db.products.length + 1,
      visible: visible !== undefined ? Boolean(visible) : true,
    };

    db.products.push(newProduct);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'ADD_PRODUCT',
      details: `Added new product ${name} under category ${category}.`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ product: newProduct, message: 'Product added successfully!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// PUT: Edit product (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error || !authResult.db || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    const { user, db } = authResult;
    const body = await req.json();

    const { id, name, category, price, description, features, icon, gradient, bonusCoins, order, visible } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const productIndex = db.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existingProduct = db.products[productIndex];

    const updatedProduct: Product = {
      ...existingProduct,
      name: name !== undefined ? name : existingProduct.name,
      category: category !== undefined ? category : existingProduct.category,
      price: price !== undefined ? Number(price) : existingProduct.price,
      description: description !== undefined ? description : existingProduct.description,
      features: features !== undefined ? features : existingProduct.features,
      icon: icon !== undefined ? icon : existingProduct.icon,
      gradient: gradient !== undefined ? gradient : existingProduct.gradient,
      bonusCoins: bonusCoins !== undefined ? (bonusCoins ? Number(bonusCoins) : undefined) : existingProduct.bonusCoins,
      order: order !== undefined ? Number(order) : existingProduct.order,
      visible: visible !== undefined ? Boolean(visible) : existingProduct.visible,
    };

    db.products[productIndex] = updatedProduct;

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'EDIT_PRODUCT',
      details: `Updated product ${updatedProduct.name} (${id}).`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ product: updatedProduct, message: 'Product updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// DELETE: Delete product (Admin only)
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
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const productIndex = db.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const productName = db.products[productIndex].name;
    db.products.splice(productIndex, 1);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'DELETE_PRODUCT',
      details: `Deleted product ${productName} (${id}).`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ message: 'Product deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
