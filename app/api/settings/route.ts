import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, StoreSettings, AuditLog } from '@/lib/db';

// GET settings
export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    return NextResponse.json({ settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// POST: Update settings (Admin only)
export async function POST(req: NextRequest) {
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
    const { storeName, serverIp, discordInvite, contactEmail, youtubeUrl, twitterUrl, currency, taxRate, themeColor } = body;

    const updatedSettings: StoreSettings = {
      storeName: storeName || db.settings.storeName,
      serverIp: serverIp || db.settings.serverIp,
      discordInvite: discordInvite || db.settings.discordInvite,
      contactEmail: contactEmail || db.settings.contactEmail,
      youtubeUrl: youtubeUrl || db.settings.youtubeUrl,
      twitterUrl: twitterUrl || db.settings.twitterUrl,
      currency: currency || db.settings.currency,
      taxRate: taxRate !== undefined ? Number(taxRate) : db.settings.taxRate,
      themeColor: themeColor || db.settings.themeColor,
    };

    db.settings = updatedSettings;

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: user.email,
      action: 'UPDATE_SETTINGS',
      details: 'Updated global store settings configurations.',
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ settings: updatedSettings, message: 'Settings saved successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
