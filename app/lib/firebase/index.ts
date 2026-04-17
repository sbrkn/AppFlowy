// Client-side Firebase exports
export { app, auth, db, storage, analytics } from './config';
export * from './auth';
// Note: admin.ts (getAdminAuth, getAdminFirestore, verifyIdToken, getUserFromRequest)
// is server-only – import directly from '@/lib/firebase/admin' in API routes
