'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { getUserProfile, logoutUser } from '@/lib/auth';
import type { User, AuthState } from '@/types/user';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Only initialize Firebase on the client side
    if (typeof window === 'undefined') {
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
      return;
    }

    // Get Firebase auth instance (this will initialize Firebase if needed)
    const firebaseAuth = getFirebaseAuth();
    
    // Check if Firebase is properly initialized
    if (!firebaseAuth) {
      console.error('Firebase auth not initialized');
      setAuthState({
        user: null,
        loading: false,
        error: 'Firebase authentication not properly configured. Please check environment variables.'
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          
          if (userProfile) {
            setAuthState({
              user: userProfile,
              loading: false,
              error: null
            });
          } else {
            // User exists in Firebase Auth but not in Firestore
            setAuthState({
              user: null,
              loading: false,
              error: 'User profile not found. Please contact admin.'
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuthState({
            user: null,
            loading: false,
            error: 'Failed to load user profile. Please try again.'
          });
        }
      } else {
        // User is not authenticated
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function (called after successful authentication)
  const login = (user: User) => {
    setAuthState({
      user,
      loading: false,
      error: null
    });
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await logoutUser();
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to logout. Please try again.'
      }));
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!authState.user) return;

    try {
      const userProfile = await getUserProfile(authState.user.uid);
      if (userProfile) {
        setAuthState(prev => ({ ...prev, user: userProfile }));
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}