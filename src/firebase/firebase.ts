import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const useLocalEmulators =
  import.meta.env.DEV &&
  import.meta.env.VITE_ALLOW_PRODUCTION_FIREBASE !== "true";

const firebaseConfig = {
  apiKey: "AIzaSyBepnKOugtn_oiLMYFlQnmUILdpZ2tzDa4",
  authDomain: "controllstok.firebaseapp.com",
  projectId: useLocalEmulators ? "demo-mystoreday-local" : "controllstok",
  storageBucket: useLocalEmulators
    ? "demo-mystoreday-local.appspot.com"
    : "controllstok.firebasestorage.app",
  messagingSenderId: "653898186857",
  appId: "1:653898186857:web:7c48b21a4cb77d341b62f8",
  measurementId: "G-K7NRVE83DT",
};

const app = initializeApp(firebaseConfig);
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();

if (appCheckSiteKey && !useLocalEmulators) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");

if (useLocalEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
