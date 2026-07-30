import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const firebaseConfig = JSON.parse(
  await readFile(new URL("../firebase.json", import.meta.url), "utf8"),
);

test("Hosting serve o build com configuracao restritiva e pacote Functions minimo", async () => {
  const verificationBaseUrl = (
    process.env.HOSTING_VERIFY_URL ?? "http://127.0.0.1:5000"
  ).replace(/\/+$/u, "");
  const verifyRuntimeHeaders = process.env.HOSTING_VERIFY_URL !== undefined;
  const response = await fetch(`${verificationBaseUrl}/`, {
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<div id="root"><\/div>/u);

  const globalRule = firebaseConfig.hosting.headers.find(
    (rule) => rule.source === "**",
  );
  assert.ok(globalRule, "A regra global de headers nao existe.");
  const configuredHeaders = new Map(
    globalRule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  const csp = configuredHeaders.get("content-security-policy") ?? "";
  assert.match(csp, /default-src 'self'/u);
  assert.match(
    csp,
    /https:\/\/southamerica-east1-controllstok\.cloudfunctions\.net/u,
  );
  assert.doesNotMatch(csp, /\*\.cloudfunctions\.net/u);
  assert.doesNotMatch(csp, /firebaseio\.com/u);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/u);
  assert.doesNotMatch(csp, /'unsafe-eval'/u);
  assert.equal(configuredHeaders.get("x-content-type-options"), "nosniff");
  assert.equal(configuredHeaders.get("x-frame-options"), "DENY");
  assert.equal(
    configuredHeaders.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(configuredHeaders.get("cross-origin-opener-policy"), "same-origin");

  if (verifyRuntimeHeaders) {
    for (const [key, expectedValue] of configuredHeaders) {
      assert.equal(
        response.headers.get(key),
        expectedValue,
        `Hosting publicado nao serviu o header ${key}.`,
      );
    }
    const assetPath = html.match(
      /(?:src|href)="(\/assets\/[^"]+\.(?:css|js))"/u,
    )?.[1];
    assert.ok(assetPath, "O build publicado nao referencia asset versionado.");
    const assetResponse = await fetch(`${verificationBaseUrl}${assetPath}`, {
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(assetResponse.status, 200);
    assert.match(
      assetResponse.headers.get("cache-control") ?? "",
      /public,\s*max-age=31536000,\s*immutable/iu,
    );
  }

  const functionsIgnore = new Set(firebaseConfig.functions[0].ignore);
  for (const requiredPattern of [
    "scripts/**",
    ".env*",
    "coverage/**",
    "**/*.log",
  ]) {
    assert.equal(
      functionsIgnore.has(requiredPattern),
      true,
      `Functions nao ignora ${requiredPattern}.`,
    );
  }
});
