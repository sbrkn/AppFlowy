import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export async function verifyIdToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  authHeader: string | null
): Promise<admin.auth.DecodedIdToken | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyIdToken(token);
}
