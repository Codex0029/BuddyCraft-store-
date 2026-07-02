import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

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

    if (user.isBanned) {
      return NextResponse.json({ error: 'This account is banned.' }, { status: 403 });
    }

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

// Support updating user settings (like changing password or linking/unlinking Discord)
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('user-token-', '');

    const db = await getDb();
    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await req.json();
    const user = db.users[userIndex];

    if (body.action === 'change-password') {
      const { oldPassword, newPassword } = body;
      if (user.passwordHash !== oldPassword) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }
      user.passwordHash = newPassword;
    } else if (body.action === 'link-discord') {
      const { discordUsername, discordId, discordAvatar } = body;
      user.discordId = discordId || `ds-${Date.now()}`;
      user.discordUsername = discordUsername || 'DiscordGamer#0001';
      user.discordAvatar = discordAvatar || 'https://picsum.photos/seed/discord/150/150';
    } else if (body.action === 'unlink-discord') {
      delete user.discordId;
      delete user.discordUsername;
      delete user.discordAvatar;
    } else if (body.action === 'update-username') {
      const { username } = body;
      if (!username) {
        return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
      }
      // Check if username already exists
      const exists = db.users.some((u) => u.id !== userId && u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
      }
      user.username = username;
    }

    db.users[userIndex] = user;
    await saveDb(db);

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
