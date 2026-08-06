import type { FirebaseOptions } from "firebase/app";

const LOCAL_EMULATOR_PROJECT_ID = "demo-mystoreday-local";
const EXAMPLE_PLACEHOLDER_PREFIX = "replace-with-";

type BooleanEnvironmentValue = "true" | "false";

interface FirebaseClientConfig extends FirebaseOptions {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId?: string;
}

interface RawFirebaseEnvironment {
  readonly apiKey: string | undefined;
  readonly authDomain: string | undefined;
  readonly projectId: string | undefined;
  readonly storageBucket: string | undefined;
  readonly messagingSenderId: string | undefined;
  readonly appId: string | undefined;
  readonly measurementId: string | undefined;
}

const normalize = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const parseBoolean = (
  name: string,
  value: BooleanEnvironmentValue | string | undefined,
): boolean => {
  const normalized = normalize(value)?.toLowerCase();

  if (normalized === undefined || normalized === "false") {
    return false;
  }

  if (normalized === "true") {
    return true;
  }

  throw new Error(
    `[Config] ${name} deve ser definido exclusivamente como "true" ou "false".`,
  );
};

const rawFirebaseEnvironment: RawFirebaseEnvironment = {
  apiKey: normalize(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: normalize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: normalize(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: normalize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalize(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: normalize(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: normalize(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

const requiredFirebaseValues = [
  ["VITE_FIREBASE_API_KEY", rawFirebaseEnvironment.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", rawFirebaseEnvironment.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", rawFirebaseEnvironment.projectId],
  ["VITE_FIREBASE_STORAGE_BUCKET", rawFirebaseEnvironment.storageBucket],
  [
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    rawFirebaseEnvironment.messagingSenderId,
  ],
  ["VITE_FIREBASE_APP_ID", rawFirebaseEnvironment.appId],
] as const;

const missingFirebaseVariables = requiredFirebaseValues
  .filter(([, value]) => value === undefined)
  .map(([name]) => name);

if (missingFirebaseVariables.length > 0) {
  throw new Error(
    `[Config] Variáveis obrigatórias ausentes: ${missingFirebaseVariables.join(", ")}.`,
  );
}

const placeholderFirebaseVariables = requiredFirebaseValues
  .filter(([, value]) =>
    value?.toLowerCase().startsWith(EXAMPLE_PLACEHOLDER_PREFIX),
  )
  .map(([name]) => name);

if (placeholderFirebaseVariables.length > 0) {
  throw new Error(
    `[Config] Substitua os placeholders de exemplo: ${placeholderFirebaseVariables.join(", ")}.`,
  );
}

const isProduction =
  import.meta.env.PROD || import.meta.env.MODE === "production";
const isDevelopment =
  import.meta.env.DEV && import.meta.env.MODE !== "production";
const allowProductionFirebase = parseBoolean(
  "VITE_ALLOW_PRODUCTION_FIREBASE",
  import.meta.env.VITE_ALLOW_PRODUCTION_FIREBASE,
);
const useLocalEmulators = isDevelopment && !allowProductionFirebase;
const appCheckDebugEnabled = parseBoolean(
  "VITE_FIREBASE_APP_CHECK_DEBUG",
  import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG,
);

if (appCheckDebugEnabled && (!isDevelopment || isProduction)) {
  throw new Error(
    "[Config] O Firebase App Check Debug Provider não pode ser habilitado fora do desenvolvimento local.",
  );
}

if (appCheckDebugEnabled && useLocalEmulators) {
  throw new Error(
    "[Config] O App Check não é inicializado nos emuladores locais. Para validar um token de debug contra o projeto remoto, habilite conscientemente VITE_ALLOW_PRODUCTION_FIREBASE.",
  );
}

const primaryAppCheckSiteKey = normalize(
  import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
);
const legacyAppCheckSiteKey = normalize(
  import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY,
);

if (
  primaryAppCheckSiteKey &&
  legacyAppCheckSiteKey &&
  primaryAppCheckSiteKey !== legacyAppCheckSiteKey
) {
  throw new Error(
    "[Config] VITE_FIREBASE_APP_CHECK_SITE_KEY e a variável legada VITE_FIREBASE_APPCHECK_SITE_KEY não podem divergir.",
  );
}

const appCheckSiteKey = primaryAppCheckSiteKey ?? legacyAppCheckSiteKey;
const appCheckEnabled = !useLocalEmulators;

if (
  appCheckSiteKey?.toLowerCase().startsWith(EXAMPLE_PLACEHOLDER_PREFIX)
) {
  throw new Error(
    "[Config] Substitua o placeholder de VITE_FIREBASE_APP_CHECK_SITE_KEY.",
  );
}

if (appCheckEnabled && !appCheckSiteKey) {
  throw new Error(
    "[Config] Variável obrigatória ausente: VITE_FIREBASE_APP_CHECK_SITE_KEY.",
  );
}

const remoteFirebaseConfig: FirebaseClientConfig = Object.freeze({
  apiKey: rawFirebaseEnvironment.apiKey as string,
  authDomain: rawFirebaseEnvironment.authDomain as string,
  projectId: rawFirebaseEnvironment.projectId as string,
  storageBucket: rawFirebaseEnvironment.storageBucket as string,
  messagingSenderId: rawFirebaseEnvironment.messagingSenderId as string,
  appId: rawFirebaseEnvironment.appId as string,
  ...(rawFirebaseEnvironment.measurementId
    ? { measurementId: rawFirebaseEnvironment.measurementId }
    : {}),
});

const firebaseConfig: FirebaseClientConfig = useLocalEmulators
  ? Object.freeze({
      ...remoteFirebaseConfig,
      projectId: LOCAL_EMULATOR_PROJECT_ID,
      storageBucket: `${LOCAL_EMULATOR_PROJECT_ID}.appspot.com`,
    })
  : remoteFirebaseConfig;

export const env = Object.freeze({
  firebase: firebaseConfig,
  appCheck: Object.freeze({
    enabled: appCheckEnabled,
    debugEnabled: appCheckDebugEnabled,
    siteKey: appCheckSiteKey,
  }),
  emulators: Object.freeze({
    enabled: useLocalEmulators,
    authUrl: "http://127.0.0.1:9099",
    firestoreHost: "127.0.0.1",
    firestorePort: 8080,
    functionsHost: "127.0.0.1",
    functionsPort: 5001,
  }),
  runtime: Object.freeze({
    isDevelopment,
    isProduction,
  }),
});
