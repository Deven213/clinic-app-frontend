import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase.js';

const AuthContext = createContext(null);

const ROLE_KEY = (uid) => `ayurclinic_profile_${uid}`;

// Helpers to persist/read role from localStorage
export function saveUserProfile(uid, { name, role }) {
  localStorage.setItem(ROLE_KEY(uid), JSON.stringify({ name, role }));
}

export function readUserProfile(uid) {
  try {
    const raw = localStorage.getItem(ROLE_KEY(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);       // 'Doctor' | 'Receptionist' | 'Admin'
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = readUserProfile(firebaseUser.uid);
        setRole(profile?.role || 'Doctor');
        setUserName(profile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User');
      } else {
        setRole(null);
        setUserName('');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ─── Auth actions ─────────────────────────────────────────────────────────
  const loginWithEmail = (email, password) => {
    if (!isFirebaseConfigured) throw new Error('firebase-not-configured');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (name, email, password, selectedRole) => {
    if (!isFirebaseConfigured) throw new Error('firebase-not-configured');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Persist role + name to localStorage immediately
    saveUserProfile(cred.user.uid, { name, role: selectedRole });
    setRole(selectedRole);
    setUserName(name);
    // Try syncing to backend (non-blocking)
    try {
      const token = await cred.user.getIdToken();
      await fetch(`https://medical-project-h6yc.vercel.app/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, role: selectedRole }),
      });
    } catch (_) { /* backend might not be running yet */ }
    return cred;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error('firebase-not-configured');
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = readUserProfile(cred.user.uid);
    if (!existing) {
      // New Google user — do NOT assign a role yet; caller must call setupNewUser()
      return { cred, isNewUser: true };
    }
    setRole(existing.role);
    setUserName(existing.name || cred.user.displayName || cred.user.email?.split('@')[0] || 'User');
    return { cred, isNewUser: false };
  };

  // Called after Google sign-in when user is brand-new and picks a role
  const setupNewUser = (role) => {
    if (!auth?.currentUser) return;
    const u = auth.currentUser;
    const name = u.displayName || u.email?.split('@')[0] || 'User';
    saveUserProfile(u.uid, { name, role });
    setRole(role);
    setUserName(name);
  };

  const logout = () => {
    if (!auth) return Promise.resolve();
    return signOut(auth);
  };

  const resetPassword = (email) => {
    if (!isFirebaseConfigured) throw new Error('firebase-not-configured');
    return sendPasswordResetEmail(auth, email);
  };

  const getToken = async () => {
    if (!user) return null;
    return user.getIdToken();
  };

  // Fetch helper that auto-attaches Authorization header (memoized to prevent infinite re-renders)
  const authFetch = useCallback(async (url, options = {}) => {
    const token = user ? await user.getIdToken() : null;
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        userName,
        loading,
        isFirebaseConfigured,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        getToken,
        authFetch,
        setupNewUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
