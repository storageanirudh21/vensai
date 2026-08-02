import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_J2KS2wfBpcJ0iBGUC_DioebgL2U088o",
  authDomain: "vensai.firebaseapp.com",
  projectId: "vensai",
  storageBucket: "vensai.firebasestorage.app",
  messagingSenderId: "800762605172",
  appId: "1:800762605172:web:96157ea0ec1abf8bbc6b21",
  measurementId: "G-628BETXJEY"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
