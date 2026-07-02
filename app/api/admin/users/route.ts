import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, AuditLog } from '@/lib/db';

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

    // Return users without password hashes
    const safeUsers = db.users.map(({ passwordHash: _, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('user-token-', '');

    const db = await getDb();
    const adminUser = db.users.find((u) => u.id === userId);

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, value } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Target user ID and action are required.' }, { status: 400 });
    }

    const targetIndex = db.users.findIndex((u) => u.id === targetUserId);
    if (targetIndex === -1) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    const targetUser = db.users[targetIndex];

    // Prevent administrators from editing/demoting or deleting themselves to maintain system integrity!
    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: 'For security reasons, you cannot modify your own administrative record.' }, { status: 400 });
    }

    let actionDetails = '';

    if (action === 'toggle-ban') {
      targetUser.isBanned = Boolean(value);
      actionDetails = `${targetUser.isBanned ? 'Banned' : 'Unbanned'} user ${targetUser.username} (${targetUser.email}).`;
    } else if (action === 'toggle-admin') {
      targetUser.isAdmin = Boolean(value);
      actionDetails = `${targetUser.isAdmin ? 'Promoted' : 'Demoted'} user ${targetUser.username} (${targetUser.email}) ${targetUser.isAdmin ? 'to' : 'from'} admin.`;
    } else if (action === 'reset-password') {
      if (!value || value.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      targetUser.passwordHash = value;
      actionDetails = `Reset password for user ${targetUser.username} (${targetUser.email}).`;
    }

    db.users[targetIndex] = targetUser;

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: adminUser.email,
      action: `USER_${action.toUpperCase().replace('-', '_')}`,
      details: actionDetails,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    const { passwordHash: _, ...safeUser } = targetUser;
    return NextResponse.json({ user: safeUser, message: 'User updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('user-token-', '');

    const db = await getDb();
    const adminUser = db.users.find((u) => u.id === userId);

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const targetIndex = db.users.findIndex((u) => u.id === targetUserId);
    if (targetIndex === -1) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const targetUser = db.users[targetIndex];

    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: 'You cannot delete yourself.' }, { status: 400 });
    }

    const username = targetUser.username;
    const email = targetUser.email;
    db.users.splice(targetIndex, 1);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminEmail: adminUser.email,
      action: 'USER_DELETE',
      details: `Permanently deleted user account ${username} (${email}).`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.push(newLog);

    await saveDb(db);

    return NextResponse.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
