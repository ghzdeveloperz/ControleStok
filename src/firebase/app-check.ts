import type { FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { env } from "../config/env";

interface AppCheckCacheEntry {
  readonly instance: AppCheck;
  readonly debugEnabled: boolean;
}

interface AppCheckRuntimeGlobal {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: true;
  __mystoredayAppCheckInstances?: WeakMap<FirebaseApp, AppCheckCacheEntry>;
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

const getRuntimeGlobal = (): (typeof globalThis & AppCheckRuntimeGlobal) | null => {
  if (typeof window === "undefined" || typeof self === "undefined") {
    return null;
  }

  return globalThis as typeof globalThis & AppCheckRuntimeGlobal;
};

const validateDebugEnvironment = (): void => {
  if (!env.appCheck.debugEnabled) {
    return;
  }

  const isLocalHostname = LOCAL_HOSTNAMES.has(window.location.hostname);

  if (
    !import.meta.env.DEV ||
    import.meta.env.PROD ||
    !env.runtime.isDevelopment ||
    env.runtime.isProduction ||
    !isLocalHostname
  ) {
    throw new Error(
      "[App Check] O Debug Provider só pode ser habilitado em desenvolvimento executado localmente.",
    );
  }
};

export const initializeFirebaseAppCheck = (
  app: FirebaseApp,
): AppCheck | null => {
  const runtimeGlobal = getRuntimeGlobal();

  if (!runtimeGlobal || !env.appCheck.enabled) {
    return null;
  }

  validateDebugEnvironment();

  const cache =
    runtimeGlobal.__mystoredayAppCheckInstances ??
    new WeakMap<FirebaseApp, AppCheckCacheEntry>();
  runtimeGlobal.__mystoredayAppCheckInstances = cache;

  const cachedEntry = cache.get(app);

  if (cachedEntry) {
    if (cachedEntry.debugEnabled !== env.appCheck.debugEnabled) {
      throw new Error(
        "[App Check] O modo do provider mudou durante HMR. Recarregue a página por completo.",
      );
    }

    return cachedEntry.instance;
  }

  const siteKey = env.appCheck.siteKey;

  if (!siteKey) {
    throw new Error(
      "[App Check] A Site Key do reCAPTCHA Enterprise é obrigatória.",
    );
  }

  if (
    import.meta.env.DEV &&
    !import.meta.env.PROD &&
    env.appCheck.debugEnabled
  ) {
    (self as typeof globalThis & AppCheckRuntimeGlobal)
      .FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const instance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  cache.set(app, {
    instance,
    debugEnabled: env.appCheck.debugEnabled,
  });

  return instance;
};
