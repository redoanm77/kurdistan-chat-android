import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCC2aH21670Khp95Hs1MoEiAupOheKHvAM",
  authDomain: "kurd-4cc81.firebaseapp.com",
  databaseURL: "https://kurd-4cc81-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kurd-4cc81",
  storageBucket: "kurd-4cc81.firebasestorage.app",
  messagingSenderId: "814756551942",
  appId: "1:814756551942:android:b4debfb4fcb2d1bee61287",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
