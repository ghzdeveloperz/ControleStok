import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import {
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";

const PROJECT_ID = "demo-mystoreday-storage-rules";
const rules = readFileSync(
  new URL("../storage.rules", import.meta.url),
  "utf8",
);
const emulatorAddress =
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199";
const emulatorSeparator = emulatorAddress.lastIndexOf(":");
const emulatorHost = emulatorAddress.slice(0, emulatorSeparator);
const emulatorPort = Number(emulatorAddress.slice(emulatorSeparator + 1));

let testEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      host: emulatorHost,
      port: emulatorPort,
      rules,
    },
  });
});

after(async () => {
  if (testEnvironment) await testEnvironment.cleanup();
});

test("nega leitura e escrita no Storage para clientes autenticados e anonimos", async () => {
  const authenticatedStorage = testEnvironment
    .authenticatedContext("member-a")
    .storage();
  const unauthenticatedStorage = testEnvironment
    .unauthenticatedContext()
    .storage();
  const payload = new Uint8Array([1, 2, 3]);

  await assertFails(
    uploadBytes(ref(authenticatedStorage, "workspaces/a/products/file.bin"), payload),
  );
  await assertFails(
    uploadBytes(ref(unauthenticatedStorage, "public/file.bin"), payload),
  );
  await assertFails(
    getBytes(ref(authenticatedStorage, "workspaces/a/products/file.bin")),
  );
});
