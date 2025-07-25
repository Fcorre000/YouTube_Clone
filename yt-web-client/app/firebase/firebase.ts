// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";
import{
    getAuth, 
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
}from "firebase/auth";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
export const functions = getFunctions();

/**
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials
 */
export function signInWithGoogle(){
    return signInWithPopup(auth, new GoogleAuthProvider())
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut(){
    return auth.signOut();
}

/**
 * Trigger a callback whenn user auth state changes.
 * @returns A function to unsubcribe callback.
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void){
    return onAuthStateChanged(auth,callback);
}