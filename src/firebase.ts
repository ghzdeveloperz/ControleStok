// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Sua configuração atual do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBepnKOugtn_oiLMYFlQnmUILdpZ2tzDa4",
  authDomain: "controllstok.firebaseapp.com",
  projectId: "controllstok",
  storageBucket: "controllstok.firebasestorage.app",
  messagingSenderId: "653898186857",
  appId: "1:653898186857:web:7c48b21a4cb77d341b62f8",
  measurementId: "G-K7NRVE83DT"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializa Auth e Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
