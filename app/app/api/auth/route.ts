import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminAuth, verifyIdToken } from '@/lib/firebase/admin';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json() as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await verifyIdToken(idToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Issue a short-lived session JWT
    const sessionToken = await new SignJWT({
      uid: decoded.uid,
      email: decoded.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, uid: decoded.uid });

    response.cookies.set('__session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('__session');
  return response;
}
