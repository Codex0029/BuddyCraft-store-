import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, User } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const db = await getDb();

    // Check if email already registered
    const emailExists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    // Check if Minecraft username is in use
    const usernameExists = db.users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (usernameExists) {
      return NextResponse.json({ error: 'Minecraft username already in use.' }, { status: 400 });
    }

    // Create user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      username: username,
      passwordHash: password, // Store password
      isAdmin: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDb(db);

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({
      user: safeUser,
      token: `user-token-${newUser.id}`,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
