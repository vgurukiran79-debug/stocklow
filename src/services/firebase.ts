import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { User, UserRole } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with specific database ID if available
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test as per Firebase integration specification
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return false;
    }
    // Any permission error still indicates successful network connection to Firestore
    return true;
  }
}

// Test connection on startup
testFirestoreConnection().catch(() => {});

// Fetch user profile from Firestore, fallback to local storage or defaults
export async function fetchUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: uid,
        name: data.displayName || 'Store Staff',
        email: data.email || '',
        role: (data.role as UserRole) || 'Admin',
        avatarUrl: data.photoURL,
        storeName: data.storeName,
      };
    }
  } catch (err) {
    console.warn('Could not fetch Firestore user profile, falling back to local session:', err);
  }
  return null;
}

// Save or update user profile in Firestore
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(
      userDocRef,
      {
        uid: user.id,
        displayName: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName || '',
        photoURL: user.avatarUrl || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

// Google Sign-In
export async function signInWithGoogle(defaultRole: UserRole = 'Admin'): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if profile exists, otherwise create new
  let profile = await fetchUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Store User',
      email: fbUser.email || '',
      role: defaultRole,
      avatarUrl: fbUser.photoURL || undefined,
      storeName: 'My Store',
    };
    await syncUserProfile(profile);
  }
  return profile;
}

// Email & Password Sign-In
export async function signInEmail(email: string, pass: string): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = res.user;

  let profile = await fetchUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0],
      email: fbUser.email || email,
      role: 'Admin',
      storeName: 'My Store',
    };
    await syncUserProfile(profile);
  }
  return profile;
}

// Email & Password Registration
export async function registerEmail(
  email: string,
  pass: string,
  fullName: string,
  role: UserRole = 'Admin',
  storeName: string = 'My Store'
): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = res.user;

  if (fullName) {
    try {
      await updateProfile(fbUser, { displayName: fullName });
    } catch {}
  }

  const profile: User = {
    id: fbUser.uid,
    name: fullName || email.split('@')[0],
    email: fbUser.email || email,
    role,
    storeName,
  };

  await syncUserProfile(profile);
  return profile;
}

// Sign Out
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

// Observer for auth state changes
export function subscribeToFirebaseAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    const profile = await fetchUserProfile(fbUser.uid);
    if (profile) {
      callback(profile);
    } else {
      callback({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Store Owner',
        email: fbUser.email || '',
        role: 'Admin',
        avatarUrl: fbUser.photoURL || undefined,
      });
    }
  });
}
