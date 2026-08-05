import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../../backend/models/user';
import {
  auth,
  signInWithFirebaseEmail,
  signUpWithFirebaseEmail,
  signOutFromFirebase,
  signInWithFirebaseGoogle,
} from '../lib/firebase';

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithFirebaseGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        // Set user immediately so UI can render
        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'User',
          givenName: fbUser.displayName?.split(' ')[0] || 'User',
          familyName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
          picture: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.email || '')}`,
          authProvider: fbUser.providerData[0]?.providerId || 'password',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        
        setLoading(false); // Unblock UI immediately!

        // Upsert user profile to Firestore asynchronously in background
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
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          // Get full profile to update context with accurate data
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setUser(prev => prev ? {
              ...prev,
              name: data.name || prev.name,
              givenName: data.name?.split(' ')[0] || prev.givenName,
              familyName: data.name?.split(' ').slice(1).join(' ') || prev.familyName,
              picture: data.photoURL || prev.picture,
              authProvider: data.provider || prev.authProvider,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || prev.createdAt,
            } : null);
          }
        } catch (error) {
          console.error('[Auth] Failed to sync profile to Firestore:', error);
          // We already set a fallback user above, so no need to do anything here.
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithFirebaseGoogleContext = async (): Promise<void> => {
    await signInWithFirebaseGoogle();
    // onAuthStateChanged will handle the rest
  };

  const loginWithEmailContext = async (email: string, pass: string): Promise<void> => {
    await signInWithFirebaseEmail(email, pass);
  };

  const registerWithEmailContext = async (
    email: string,
    pass: string,
    name: string
  ): Promise<void> => {
    await signUpWithFirebaseEmail(email, pass, name);
  };

  const resetPasswordContext = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    signOutFromFirebase().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithFirebaseGoogle: loginWithFirebaseGoogleContext,
        loginWithEmail: loginWithEmailContext,
        registerWithEmail: registerWithEmailContext,
        resetPassword: resetPasswordContext,
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
