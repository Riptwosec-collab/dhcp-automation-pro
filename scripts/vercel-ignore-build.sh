#!/usr/bin/env bash
# Vercel Ignored Build Step for DHCP Automation Pro.
# Exit 0 = skip deployment. Exit 1 = continue/build.
set -u

log() { printf '[dhcp-vercel-ignore] %s\n' "$*"; }
build() { log "BUILD: $*"; exit 1; }
skip() { log "SKIP: $*"; exit 0; }

current_sha="${VERCEL_GIT_COMMIT_SHA:-}"
previous_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [ -z "$current_sha" ]; then
  current_sha="$(git rev-parse HEAD 2>/dev/null || true)"
fi
[ -n "$current_sha" ] || build 'current commit SHA is unavailable'
[ -n "$previous_sha" ] || build 'previous successful deployment SHA is unavailable'

git cat-file -e "${current_sha}^{commit}" 2>/dev/null || build 'current commit is unavailable locally'
git cat-file -e "${previous_sha}^{commit}" 2>/dev/null || build 'previous deployed commit is unavailable locally'

changed_files="$(git diff --name-only --no-renames "$previous_sha" "$current_sha" -- 2>/dev/null)" || build 'git diff failed'
[ -n "$changed_files" ] || skip 'no file changes detected'

is_safe_to_skip() {
  case "$1" in
    README.md|README.*|*.md|*.mdx) return 0 ;;
    docs/*|.github/*|tests/*|__tests__/*|*/__tests__/*|coverage/*|*/coverage/*|reports/*|*/reports/*|artifacts/*|*/artifacts/*) return 0 ;;
    *.test.js|*.test.jsx|*.test.ts|*.test.tsx|*.spec.js|*.spec.jsx|*.spec.ts|*.spec.tsx) return 0 ;;

    # Generator inputs: CI materializes production output into index.html/uih.html,
    # so skip this source commit and let the generated-output commit deploy once.
    system-owner-finder.html|voip-finder.html|local-ip-reputation.js|api/ip-reputation.js) return 0 ;;
    assets/system-owner-finder-payload-*.txt|assets/voip-finder-payload-*.txt) return 0 ;;
    scripts/patch-traffic-log.py|scripts/add-traffic-ip-reputation.py|scripts/add-system-owner-finder.py|scripts/add-responsive-fit.py|scripts/add-business-hours.py|scripts/add-operations-visual-refresh.py|scripts/fit-uih-viewport.py|scripts/add-thai-down-since.py|scripts/fullscreen-bilingual-uih.py|scripts/add-downsince-language-toggle.py) return 0 ;;
    scripts/test-traffic-log-layout.py|scripts/test-ip-reputation.py|scripts/test-system-owner-finder.py|scripts/test-responsive-fit.py|scripts/test-business-hours.js|scripts/test-operations-visual-refresh.js|scripts/test-downsince-bilingual.js|scripts/test-ip-reputation-api.js|scripts/test-local-ip-reputation.js) return 0 ;;
    *) return 1 ;;
  esac
}

while IFS= read -r file; do
  [ -n "$file" ] || continue
  if ! is_safe_to_skip "$file"; then
    build "production-impacting path changed: $file"
  fi
done <<EOF_CHANGED
$changed_files
EOF_CHANGED

skip 'all changed files are docs/test/CI/generator-source changes'
