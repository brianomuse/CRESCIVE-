import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  auth,
  testConnection,
  signInWithGoogle as firebaseSignIn,
  signOutUser as firebaseSignOut,
  syncRealUserToFirestore,
  updateUserPresence,
  FirebaseUser,
} from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "../types";

interface FirebaseAuthContextType {
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  authError: string | null;
  dbConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncProfile: (profile: UserProfile | null) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(
  undefined
);

export const FirebaseAuthProvider: React.FC<{
  children: React.ReactNode;
  userProfile: UserProfile | null;
}> = ({ children, userProfile }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(false);

  // Initial connection test
  useEffect(() => {
    testConnection().then((connected) => {
      setDbConnected(connected);
    });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
        if (user) {
          try {
            await syncRealUserToFirestore(user, userProfile);
          } catch (err) {
            console.error("Initial profile sync error:", err);
          }
        }
      },
      (error) => {
        console.error("Auth listener error:", error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync whenever userProfile changes and user is signed in
  useEffect(() => {
    if (currentUser && userProfile) {
      syncRealUserToFirestore(currentUser, userProfile).catch((err) => {
        console.error("Auto profile sync error:", err);
      });
    }
  }, [currentUser, userProfile?.preferredName, userProfile?.avatarUrl, userProfile?.becoming]);

  // Window unload / visibility presence management
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateUserPresence(currentUser.uid, false);
      } else {
        updateUserPresence(currentUser.uid, true);
      }
    };

    const handleBeforeUnload = () => {
      updateUserPresence(currentUser.uid, false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      const user = await firebaseSignIn();
      setCurrentUser(user);
      await syncRealUserToFirestore(user, userProfile);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      // Ignore user closed popup errors gracefully
      if (error?.code !== "auth/popup-closed-by-user") {
        setAuthError(error?.message || "Sign in failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  }, [userProfile]);

  const signOut = useCallback(async () => {
    try {
      setAuthLoading(true);
      await firebaseSignOut();
      setCurrentUser(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      setAuthError(error?.message || "Sign out failed.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const syncProfile = useCallback(
    async (profile: UserProfile | null) => {
      if (currentUser) {
        await syncRealUserToFirestore(currentUser, profile);
      }
    },
    [currentUser]
  );

  return (
    <FirebaseAuthContext.Provider
      value={{
        currentUser,
        authLoading,
        authError,
        dbConnected,
        signInWithGoogle,
        signOut,
        syncProfile,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error(
      "useFirebaseAuth must be used within a FirebaseAuthProvider"
    );
  }
  return context;
};
