import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const allowlistPath = join(
  repositoryRoot,
  "security",
  "npm-audit-allowlist.json",
);

const auditTargets = [
  {
    scope: "root",
    directory: repositoryRoot,
    lockfile: join(repositoryRoot, "package-lock.json"),
  },
  {
    scope: "functions",
    directory: join(repositoryRoot, "functions"),
    lockfile: join(repositoryRoot, "functions", "package-lock.json"),
  },
  {
    scope: "firebase-cli",
    directory: join(repositoryRoot, "tools", "firebase-cli"),
    lockfile: join(
      repositoryRoot,
      "tools",
      "firebase-cli",
      "package-lock.json",
    ),
  },
];

class AuditGateError extends Error {}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJson(path, description) {
  let contents;

  try {
    contents = readFileSync(path, "utf8");
  } catch (error) {
    throw new AuditGateError(
      `Nao foi possivel ler ${description} em ${path}: ${error.message}`,
    );
  }

  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new AuditGateError(
      `${description} contem JSON invalido em ${path}: ${error.message}`,
    );
  }
}

function validateDate(date, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AuditGateError(`${field} deve usar o formato YYYY-MM-DD.`);
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new AuditGateError(`${field} nao representa uma data valida.`);
  }
}

function installedVersions(lock, packageName) {
  if (!isObject(lock.packages)) {
    throw new AuditGateError(
      "O package-lock.json nao possui o mapa packages esperado (lockfile v2+).",
    );
  }

  const packageSuffix = `/node_modules/${packageName}`;
  const versions = new Set();

  for (const [packagePath, metadata] of Object.entries(lock.packages)) {
    const normalizedPath = packagePath.replaceAll("\\", "/");
    if (
      normalizedPath !== `node_modules/${packageName}` &&
      !normalizedPath.endsWith(packageSuffix)
    ) {
      continue;
    }

    if (!isObject(metadata) || typeof metadata.version !== "string") {
      throw new AuditGateError(
        `A entrada ${packagePath} nao possui uma versao valida no lockfile.`,
      );
    }
    versions.add(metadata.version);
  }

  return [...versions].sort();
}

function sameStringSet(left, right) {
  const normalizedLeft = [...new Set(left)].sort();
  const normalizedRight = [...new Set(right)].sort();
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function loadAndValidateAllowlist(locksByScope) {
  const config = readJson(allowlistPath, "a allowlist de npm audit");

  if (!isObject(config) || config.schemaVersion !== 1) {
    throw new AuditGateError(
      "A allowlist deve ser um objeto com schemaVersion igual a 1.",
    );
  }
  if (!Array.isArray(config.allowlist)) {
    throw new AuditGateError("A propriedade allowlist deve ser uma lista.");
  }

  const validScopes = new Set(auditTargets.map(({ scope }) => scope));
  const entries = new Map();
  const today = new Date().toISOString().slice(0, 10);

  for (const [index, entry] of config.allowlist.entries()) {
    const field = `allowlist[${index}]`;
    if (!isObject(entry)) {
      throw new AuditGateError(`${field} deve ser um objeto.`);
    }
    if (!validScopes.has(entry.scope)) {
      throw new AuditGateError(`${field}.scope nao e um escopo auditado valido.`);
    }
    if (!/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(entry.advisoryId)) {
      throw new AuditGateError(`${field}.advisoryId nao e um identificador GHSA valido.`);
    }

    const expectedUrl = `https://github.com/advisories/${entry.advisoryId}`;
    if (entry.url !== expectedUrl) {
      throw new AuditGateError(
        `${field}.url deve ser exatamente ${expectedUrl}.`,
      );
    }
    if (
      typeof entry.package !== "string" ||
      entry.package.length === 0 ||
      entry.package.includes("\\") ||
      entry.package.includes("..")
    ) {
      throw new AuditGateError(`${field}.package nao e um nome de pacote valido.`);
    }
    if (
      !Array.isArray(entry.allowedInstalledVersions) ||
      entry.allowedInstalledVersions.length === 0 ||
      entry.allowedInstalledVersions.some(
        (version) => typeof version !== "string" || version.length === 0,
      )
    ) {
      throw new AuditGateError(
        `${field}.allowedInstalledVersions deve conter ao menos uma versao.`,
      );
    }
    if (
      new Set(entry.allowedInstalledVersions).size !==
      entry.allowedInstalledVersions.length
    ) {
      throw new AuditGateError(
        `${field}.allowedInstalledVersions nao pode conter duplicatas.`,
      );
    }
    if (typeof entry.expiresOn !== "string") {
      throw new AuditGateError(`${field}.expiresOn deve ser uma data.`);
    }
    validateDate(entry.expiresOn, `${field}.expiresOn`);
    if (today > entry.expiresOn) {
      throw new AuditGateError(
        `${entry.advisoryId} no escopo ${entry.scope} expirou em ${entry.expiresOn}.`,
      );
    }
    if (typeof entry.reason !== "string" || entry.reason.trim().length < 30) {
      throw new AuditGateError(
        `${field}.reason deve registrar uma justificativa objetiva.`,
      );
    }

    const key = advisoryKey(entry.scope, entry.url, entry.package);
    if (entries.has(key)) {
      throw new AuditGateError(
        `Entrada duplicada para ${entry.advisoryId}, ${entry.package}, escopo ${entry.scope}.`,
      );
    }

    const versions = installedVersions(locksByScope.get(entry.scope), entry.package);
    if (!sameStringSet(versions, entry.allowedInstalledVersions)) {
      throw new AuditGateError(
        `${entry.advisoryId} (${entry.scope}) permite ${entry.package} ` +
          `[${entry.allowedInstalledVersions.join(", ")}], mas o lockfile contem ` +
          `[${versions.join(", ") || "nenhuma versao"}]. Revise a excecao.`,
      );
    }

    entries.set(key, { ...entry, used: false, installedVersions: versions });
  }

  return entries;
}

function advisoryKey(scope, url, packageName) {
  return `${scope}\u0000${url}\u0000${packageName}`;
}

function runNpmAudit(target) {
  const commonOptions = {
    cwd: target.directory,
    encoding: "utf8",
    env: {
      ...process.env,
      NO_COLOR: "1",
      NPM_CONFIG_COLOR: "false",
      NPM_CONFIG_AUDIT_LEVEL: "low",
    },
    maxBuffer: 50 * 1024 * 1024,
    timeout: 120_000,
    windowsHide: true,
  };

  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec || "cmd.exe",
          ["/d", "/s", "/c", "npm audit --json --package-lock-only"],
          commonOptions,
        )
      : spawnSync(
          "npm",
          ["audit", "--json", "--package-lock-only"],
          commonOptions,
        );

  if (result.error) {
    throw new AuditGateError(
      `${target.scope}: npm audit nao pode ser executado: ${result.error.message}`,
    );
  }
  if (result.signal) {
    throw new AuditGateError(
      `${target.scope}: npm audit foi interrompido pelo sinal ${result.signal}.`,
    );
  }
  if (result.status !== 0 && result.status !== 1) {
    const stderr = result.stderr?.trim();
    throw new AuditGateError(
      `${target.scope}: npm audit terminou com codigo ${result.status}` +
        `${stderr ? `: ${stderr}` : "."}`,
    );
  }

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch (error) {
    throw new AuditGateError(
      `${target.scope}: npm audit retornou JSON invalido: ${error.message}`,
    );
  }

  if (
    !isObject(report) ||
    report.auditReportVersion !== 2 ||
    !isObject(report.vulnerabilities) ||
    !isObject(report.metadata) ||
    !isObject(report.metadata.vulnerabilities) ||
    isObject(report.error)
  ) {
    throw new AuditGateError(
      `${target.scope}: npm audit retornou uma estrutura inesperada ou um erro de registry.`,
    );
  }
  if (result.status === 1 && Object.keys(report.vulnerabilities).length === 0) {
    throw new AuditGateError(
      `${target.scope}: npm audit falhou sem registrar vulnerabilidades.`,
    );
  }

  return report;
}

function resolveAdvisories(vulnerabilityName, vulnerabilities, stack = []) {
  if (stack.includes(vulnerabilityName)) {
    throw new AuditGateError(
      `Ciclo invalido na cadeia via: ${[...stack, vulnerabilityName].join(" -> ")}.`,
    );
  }

  const vulnerability = vulnerabilities[vulnerabilityName];
  if (!isObject(vulnerability)) {
    throw new AuditGateError(
      `A cadeia via referencia ${vulnerabilityName}, ausente no relatorio.`,
    );
  }
  if (!Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    throw new AuditGateError(
      `${vulnerabilityName} nao possui uma cadeia via resolvivel.`,
    );
  }

  const nextStack = [...stack, vulnerabilityName];
  const advisories = [];

  for (const via of vulnerability.via) {
    if (typeof via === "string") {
      for (const advisory of resolveAdvisories(via, vulnerabilities, nextStack)) {
        advisories.push({
          ...advisory,
          chain: [vulnerabilityName, ...advisory.chain],
        });
      }
      continue;
    }

    if (!isObject(via)) {
      throw new AuditGateError(
        `${vulnerabilityName} contem uma entrada via em formato invalido.`,
      );
    }
    if (typeof via.url !== "string" || !via.url.startsWith("https://")) {
      throw new AuditGateError(
        `${vulnerabilityName} contem um advisory sem URL HTTPS valida.`,
      );
    }

    const advisoryPackage = via.name || via.dependency;
    if (typeof advisoryPackage !== "string" || advisoryPackage.length === 0) {
      throw new AuditGateError(
        `${vulnerabilityName} contem um advisory sem pacote de origem.`,
      );
    }
    if (
      typeof via.name === "string" &&
      typeof via.dependency === "string" &&
      via.name !== via.dependency
    ) {
      throw new AuditGateError(
        `${vulnerabilityName} contem name/dependency divergentes no advisory.`,
      );
    }
    if (advisoryPackage !== vulnerabilityName) {
      throw new AuditGateError(
        `${vulnerabilityName} aponta diretamente para um advisory de ${advisoryPackage}.`,
      );
    }

    advisories.push({
      url: via.url,
      package: advisoryPackage,
      title: typeof via.title === "string" ? via.title : "Sem titulo",
      severity:
        typeof via.severity === "string" ? via.severity : vulnerability.severity,
      chain: [vulnerabilityName],
    });
  }

  return advisories;
}

function evaluateReport(target, report, allowlist) {
  const observed = new Map();

  for (const vulnerabilityName of Object.keys(report.vulnerabilities).sort()) {
    const advisories = resolveAdvisories(
      vulnerabilityName,
      report.vulnerabilities,
    );

    for (const advisory of advisories) {
      const key = advisoryKey(target.scope, advisory.url, advisory.package);
      const aggregate = observed.get(key) || {
        ...advisory,
        chains: new Set(),
      };
      aggregate.chains.add(advisory.chain.join(" -> "));
      observed.set(key, aggregate);
    }
  }

  const rejected = [];
  const accepted = [];

  for (const [key, advisory] of observed) {
    const allowed = allowlist.get(key);
    if (!allowed) {
      rejected.push(advisory);
      continue;
    }

    allowed.used = true;
    accepted.push({ advisory, allowed });
  }

  return { accepted, rejected };
}

function printAccepted(scope, accepted) {
  if (accepted.length === 0) {
    console.log(`[security-audit] ${scope}: nenhum advisory encontrado.`);
    return;
  }

  for (const { advisory, allowed } of accepted) {
    console.log(
      `[security-audit] ${scope}: EXCECAO TEMPORARIA ${allowed.advisoryId} ` +
        `(${allowed.package}@${allowed.installedVersions.join(",")}, expira ${allowed.expiresOn}).`,
    );
    console.log(`[security-audit] Motivo: ${allowed.reason}`);
    console.log(
      `[security-audit] Cadeias verificadas: ${[...advisory.chains].sort().join("; ")}`,
    );
  }
}

function printRejected(scope, rejected) {
  for (const advisory of rejected) {
    console.error(
      `[security-audit] ${scope}: NAO PERMITIDO ${advisory.package} ` +
        `(${advisory.severity || "severidade desconhecida"}) - ${advisory.url}`,
    );
    console.error(`[security-audit] Titulo: ${advisory.title}`);
    console.error(
      `[security-audit] Cadeias: ${[...advisory.chains].sort().join("; ")}`,
    );
  }
}

function main() {
  const locksByScope = new Map();
  for (const target of auditTargets) {
    locksByScope.set(
      target.scope,
      readJson(target.lockfile, `o lockfile do escopo ${target.scope}`),
    );
  }

  const allowlist = loadAndValidateAllowlist(locksByScope);
  let rejectedCount = 0;

  for (const target of auditTargets) {
    console.log(`[security-audit] ${target.scope}: executando npm audit...`);
    const report = runNpmAudit(target);
    const result = evaluateReport(target, report, allowlist);
    printAccepted(target.scope, result.accepted);
    printRejected(target.scope, result.rejected);
    rejectedCount += result.rejected.length;
  }

  let unusedExceptionCount = 0;
  for (const entry of allowlist.values()) {
    if (!entry.used) {
      unusedExceptionCount += 1;
      console.error(
        `[security-audit] EXCECAO OBSOLETA: ${entry.advisoryId} (${entry.scope}) ` +
          "nao apareceu no relatorio e deve ser removida.",
      );
    }
  }

  if (rejectedCount > 0 || unusedExceptionCount > 0) {
    throw new AuditGateError(
      `${rejectedCount} advisory(s) nao estao exatamente allowlisted e ` +
        `${unusedExceptionCount} excecao(oes) estao obsoletas. Corrija a ` +
        "dependencia ou documente uma revisao de risco com prazo curto.",
    );
  }

  console.log(
    "[security-audit] APROVADO: todos os advisories foram resolvidos ate a URL " +
      "de origem e correspondem exatamente a excecoes validas.",
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[security-audit] FALHA: ${message}`);
  process.exitCode = 1;
}
