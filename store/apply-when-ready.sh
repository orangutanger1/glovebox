#!/usr/bin/env bash
# Push the localized listings, but only once the store record can take them.
#
# Version 1.0 is in review. Adding fifteen localizations to a version Apple is
# actively looking at either restarts the review clock or gets the whole
# submission flagged, so this script refuses to run until the version has left
# review - READY_FOR_SALE means 1.0 shipped and the localizations land on the
# live listing; PREPARE_FOR_SUBMISSION means a new version is open and they land
# on the draft. Anything else is a no.
#
#   ./store/apply-when-ready.sh            # check state, then apply for real
#   ./store/apply-when-ready.sh --dry-run  # check state, then print the plan
#
# The apply is additive by construction: `asc metadata apply` without
# `--allow-deletes` treats a remote locale missing locally as a no-op, and the
# dry run of this exact directory reported 105 adds, 0 updates, 0 deletes - the
# en-US listing that is already live is not touched by any of it.
set -euo pipefail

APP_ID="${ASC_APP_ID:-6797103341}"
VERSION="${ASC_VERSION:-1.0}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fail before the network if a listing grew past a limit since it was written.
python3 "$DIR/stage-locales.py" --check >/dev/null

state=$(asc versions list --app "$APP_ID" --output json \
  | python3 -c '
import json,sys
want = sys.argv[1]
for v in json.load(sys.stdin)["data"]:
    if v["attributes"]["versionString"] == want:
        print(v["attributes"]["appStoreState"])
        break
else:
    print("NO_SUCH_VERSION")
' "$VERSION")

echo "version $VERSION is $state"
case "$state" in
  READY_FOR_SALE|PREPARE_FOR_SUBMISSION|DEVELOPER_REJECTED|REJECTED) ;;
  *)
    echo "refusing to touch a version in $state - wait for review to finish" >&2
    exit 1
    ;;
esac

if [ "${1:-}" = "--dry-run" ]; then
  exec asc metadata apply --app "$APP_ID" --version "$VERSION" --dir "$DIR" --dry-run
fi

# Twice, on purpose. The first pass has no remote localization to write into for a
# new locale, so it creates the empty version localization and reports the fields
# as added while storing none of them - observed live: fifteen locales came back
# with a name and subtitle but a zero-length description. The second pass sees the
# rows and fills them. It is idempotent, so a run that needed only one pass writes
# nothing the second time.
asc metadata apply --app "$APP_ID" --version "$VERSION" --dir "$DIR"
asc metadata apply --app "$APP_ID" --version "$VERSION" --dir "$DIR"
echo
echo "pushed. now check what Apple actually stored:"
echo "  asc metadata keywords audit --app $APP_ID --version $VERSION"
