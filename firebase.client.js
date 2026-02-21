import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "forexprosapp.firebaseapp.com",
  projectId: "forexprosapp",
  storageBucket: "forexprosapp.firebasestorage.app",
  messagingSenderId: "782620072994",
  appId: "1:782620072994:web:1a32abe052fec00a93fe7b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

