import type { Analytics } from "firebase/analytics";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { env } from "../config/env";
import { initializeFirebaseAppCheck } from "./app-check";

const DEFAULT_FIREBASE_APP_NAME = "[DEFAULT]";
const FUNCTIONS_REGION = "southamerica-east1";

interface FirebaseRuntimeGlobal {
  __mystoredayEmulatorConnections?: WeakSet<object>;
}

const existingDefaultApp = getApps().find(
  (candidate) => candidate.name === DEFAULT_FIREBASE_APP_NAME,
);

export const app: FirebaseApp = existingDefaultApp
  ? getApp()
  : initializeApp(env.firebase);

export const appCheck = initializeFirebaseAppCheck(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);

const connectEmulatorOnce = (service: object, connect: () => void): void => {
  const runtimeGlobal = globalThis as typeof globalThis & FirebaseRuntimeGlobal;
  const connections =
    runtimeGlobal.__mystoredayEmulatorConnections ?? new WeakSet<object>();
  runtimeGlobal.__mystoredayEmulatorConnections = connections;

  if (connections.has(service)) {
    return;
  }

  connect();
  connections.add(service);
};

if (env.emulators.enabled) {
  connectEmulatorOnce(auth, () => {
    connectAuthEmulator(auth, env.emulators.authUrl, {
      disableWarnings: true,
    });
  });
  connectEmulatorOnce(db, () => {
    connectFirestoreEmulator(
      db,
      env.emulators.firestoreHost,
      env.emulators.firestorePort,
    );
  });
  connectEmulatorOnce(functions, () => {
    connectFunctionsEmulator(
      functions,
      env.emulators.functionsHost,
      env.emulators.functionsPort,
    );
  });
}

const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (
    typeof window === "undefined" ||
    env.emulators.enabled ||
    !env.firebase.measurementId
  ) {
    return null;
  }

  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");

    if (!(await isSupported())) {
      return null;
    }

    return getAnalytics(app);
  } catch {
    console.warn(
      "[Firebase] Analytics indisponível neste ambiente; o bootstrap principal continuará normalmente.",
    );
    return null;
  }
};

export const analyticsPromise = initializeAnalytics();
