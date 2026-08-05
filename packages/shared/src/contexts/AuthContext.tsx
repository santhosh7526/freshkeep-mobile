import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../firebase/config';

export interface UserProfile {
  id: string;
  name: string;
  givenName: string;
  email: string;
  picture: string;
  authProvider: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth lazily to prevent eagerly warning before persistence is set
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const tempUser: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'User',
          givenName: fbUser.displayName?.split(' ')[0] || 'User',
          picture: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.email || '')}`,
          authProvider: fbUser.providerData[0]?.providerId || 'password',
          createdAt: new Date().toISOString(),
        };

        setUser(tempUser);
        setLoading(false);

        // Sync to Firestore in background
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: fbUser.uid,
              name: fbUser.displayName || '',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || null,
              provider: fbUser.providerData[0]?.providerId || 'password',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              name: data.name || tempUser.name,
              givenName: data.name?.split(' ')[0] || tempUser.givenName,
              picture: data.photoURL || tempUser.picture,
              authProvider: data.provider || tempUser.authProvider,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || tempUser.createdAt,
            });
          }
        } catch (error) {
          console.warn('[Auth] Failed to sync profile to Firestore:', error);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(result.user, { displayName: name }).catch(() => {});
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
