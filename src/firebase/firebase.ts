import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBepnKOugtn_oiLMYFlQnmUILdpZ2tzDa4",
  authDomain: "controllstok.firebaseapp.com",
  projectId: "controllstok",
  storageBucket: "controllstok.firebasestorage.app",
  messagingSenderId: "653898186857",
  appId: "1:653898186857:web:7c48b21a4cb77d341b62f8",
  measurementId: "G-K7NRVE83DT",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");
