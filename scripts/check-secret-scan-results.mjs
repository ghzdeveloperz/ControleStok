import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const PUBLIC_FIREBASE_API_KEY_SHA256 =
  "c79d1902745b454a8e9a585f8019cf742227a2cc130eda51ab4210a2e2e64ed7";

const resultsPath = process.argv[2];

function sanitizeLogValue(value, maxLength) {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127 ? "?" : character;
  })
    .join("")
    .slice(0, maxLength);
}

if (!resultsPath || process.argv.length !== 3) {
  console.error("Usage: node scripts/check-secret-scan-results.mjs <jsonl-path>");
  process.exitCode = 1;
} else {
  const lines = createInterface({
    input: createReadStream(resultsPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let allowedPublicFirebaseKey = 0;
  let rejected = 0;
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    const normalizedLine =
      lineNumber === 1 ? line.replace(/^\uFEFF/u, "") : line;
    if (!normalizedLine.trim()) continue;
    let result;
    try {
      result = JSON.parse(normalizedLine);
    } catch {
      console.error(`Invalid TruffleHog JSON on line ${lineNumber}.`);
      rejected += 1;
      continue;
    }

    const raw = typeof result?.Raw === "string" ? result.Raw : null;
    const rawSha256 = raw
      ? createHash("sha256").update(raw).digest("hex")
      : null;
    const isKnownPublicFirebaseKey =
      result?.DetectorName === "GoogleGeminiAPIKey" &&
      result?.Verified === false &&
      result?.ExtraData?.active_google_key === "true" &&
      rawSha256 === PUBLIC_FIREBASE_API_KEY_SHA256;
    if (isKnownPublicFirebaseKey) {
      allowedPublicFirebaseKey += 1;
      continue;
    }

    rejected += 1;
    const detector =
      typeof result?.DetectorName === "string"
        ? sanitizeLogValue(result.DetectorName, 80)
        : "unknown";
    const file =
      typeof result?.SourceMetadata?.Data?.Git?.file === "string"
        ? sanitizeLogValue(result.SourceMetadata.Data.Git.file, 200)
        : "unknown";
    console.error(
      `Secret scan rejected detector=${JSON.stringify(detector)} file=${JSON.stringify(file)}.`,
    );
  }

  if (allowedPublicFirebaseKey !== 1) {
    console.error(
      `Expected exactly one known public Firebase API key result, found ${allowedPublicFirebaseKey}.`,
    );
    rejected += 1;
  } else {
    console.log(
      "Allowed one exact public Firebase Web API key fingerprint; GCP API/referrer restrictions remain mandatory.",
    );
  }

  if (rejected > 0) {
    console.error(`Secret scan blocked ${rejected} unexpected result(s).`);
    process.exitCode = 1;
  } else {
    console.log("Secret scan approved: no unexpected credentials detected.");
  }
}
