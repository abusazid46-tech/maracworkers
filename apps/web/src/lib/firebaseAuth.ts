import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAglD8Ld1ATac5bLviAOpBLP0zq41yzfOY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "healthiqure.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "healthiqure",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "healthiqure.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "604190843285",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:604190843285:web:9654aac6c3127e7ec4969c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XC7B33FP79"
};

export const getFirebaseApp = () => {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export async function signInWithFirebaseGoogle(): Promise<{
  idToken: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  uid: string;
}> {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    idToken,
    name: user.displayName,
    email: user.email,
    photoUrl: user.photoURL,
    uid: user.uid
  };
}
