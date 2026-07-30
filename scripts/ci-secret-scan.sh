#!/usr/bin/env bash

set -euo pipefail

readonly TRUFFLEHOG_VERSION="3.96.0"
readonly TRUFFLEHOG_LINUX_AMD64_SHA256="7105f1cd6577f058a9e39d0578f1a99c8a1e481e4d3512cd8a09acfe22a0fdc0"
readonly TEMPORARY_ROOT="${RUNNER_TEMP:-/tmp}"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  printf '%s\n' "This pinned scanner entrypoint requires a Linux x86_64 runner." >&2
  exit 1
fi

scan_directory="${GITHUB_WORKSPACE:-$PWD}"
temporary_directory="$(mktemp -d "${TEMPORARY_ROOT%/}/mystoreday-trufflehog.XXXXXX")"
archive_path="${temporary_directory}/trufflehog.tar.gz"
binary_path="${temporary_directory}/trufflehog"
results_path="${temporary_directory}/results.jsonl"

cleanup() {
  case "$temporary_directory" in
    "${TEMPORARY_ROOT%/}"/mystoreday-trufflehog.*)
      rm -rf -- "$temporary_directory"
      ;;
    *)
      printf '%s\n' "Refusing to remove an unexpected temporary directory." >&2
      ;;
  esac
}
trap cleanup EXIT

curl \
  --fail \
  --location \
  --proto '=https' \
  --show-error \
  --silent \
  --tlsv1.2 \
  --output "$archive_path" \
  "https://github.com/trufflesecurity/trufflehog/releases/download/v${TRUFFLEHOG_VERSION}/trufflehog_${TRUFFLEHOG_VERSION}_linux_amd64.tar.gz"

actual_sha256="$(sha256sum "$archive_path")"
actual_sha256="${actual_sha256%% *}"
if [[ "$actual_sha256" != "$TRUFFLEHOG_LINUX_AMD64_SHA256" ]]; then
  printf '%s\n' "TruffleHog archive checksum mismatch." >&2
  exit 1
fi

tar --extract --gzip --file "$archive_path" --directory "$temporary_directory" trufflehog
if [[ "$("$binary_path" --version)" != *"${TRUFFLEHOG_VERSION}"* ]]; then
  printf '%s\n' "Unexpected TruffleHog version." >&2
  exit 1
fi

"$binary_path" \
  --no-update \
  --json \
  git "file://${scan_directory}" \
  --results=verified,unknown,unverified \
  --fail-on-scan-errors \
  > "$results_path"

node scripts/check-secret-scan-results.mjs "$results_path"
