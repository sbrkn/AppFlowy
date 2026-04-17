import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, UserPreferences } from '@/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  autoSave: true,
  defaultView: 'list',
};

// Convert Firebase user to app User
async function firebaseUserToAppUser(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      role: data.role ?? 'editor',
      preferences: data.preferences ?? DEFAULT_PREFERENCES,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
  }

  // New user – create Firestore document
  const newUser: Omit<User, 'id'> = {
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: 'editor',
    preferences: DEFAULT_PREFERENCES,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(userRef, {
    ...newUser,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: firebaseUser.uid, ...newUser };
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return firebaseUserToAppUser(credential.user);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return firebaseUserToAppUser(credential.user);
}

export async function signInWithGoogle(): Promise<{ user: User; driveTokens: string | null }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = await firebaseUserToAppUser(result.user);

  // Capture Google OAuth credentials for Drive access
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const driveTokens = credential?.accessToken ?? null;

  return { user, driveTokens };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await firebaseUserToAppUser(firebaseUser);
        callback(user);
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

export async function getIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

export async function refreshIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(true);
}
