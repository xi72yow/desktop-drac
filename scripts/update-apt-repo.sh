#!/usr/bin/env bash
set -euo pipefail

# Build an APT repository structure from .deb files
# Usage: ./scripts/update-apt-repo.sh <deb-dir>
#
# Expects GPG_PRIVATE_KEY env var for signing.
# Output: repo/ directory ready for GitHub Pages deployment.

DEB_DIR="${1:?Usage: update-apt-repo.sh <deb-dir>}"
REPO_DIR="repo"
POOL_DIR="${REPO_DIR}/pool"
DIST_DIR="${REPO_DIR}/dists/stable"
BINARY_DIR="${DIST_DIR}/main/binary-amd64"

rm -rf "${REPO_DIR}"
mkdir -p "${POOL_DIR}" "${BINARY_DIR}"

# Copy .deb files into pool
cp "${DEB_DIR}"/*.deb "${POOL_DIR}/"

# Generate Packages index
cd "${REPO_DIR}"
dpkg-scanpackages --multiversion pool/ > "dists/stable/main/binary-amd64/Packages"
gzip -k "dists/stable/main/binary-amd64/Packages"
cd - > /dev/null

# Generate Release file
cat > "${DIST_DIR}/Release" <<EOF
Origin: desktop-drac
Label: GitHub Desktop for Linux
Suite: stable
Codename: stable
Architectures: amd64
Components: main
Description: GitHub Desktop for Linux APT repository
Date: $(date -Ru)
EOF

# Append checksums
{
  echo "SHA256:"
  for f in "${BINARY_DIR}/Packages" "${BINARY_DIR}/Packages.gz"; do
    SIZE=$(stat -c%s "$f")
    HASH=$(sha256sum "$f" | cut -d' ' -f1)
    REL_PATH="${f#${DIST_DIR}/}"
    printf " %s %s %s\n" "$HASH" "$SIZE" "$REL_PATH"
  done
} >> "${DIST_DIR}/Release"

# GPG sign
if [ -n "${GPG_PRIVATE_KEY:-}" ]; then
  echo "${GPG_PRIVATE_KEY}" | gpg --batch --import 2>/dev/null
  GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format long 2>/dev/null | grep sec | head -1 | awk '{print $2}' | cut -d'/' -f2)
  gpg --batch --yes --default-key "${GPG_KEY_ID}" --detach-sign --armor -o "${DIST_DIR}/Release.gpg" "${DIST_DIR}/Release"
  gpg --batch --yes --default-key "${GPG_KEY_ID}" --clearsign -o "${DIST_DIR}/InRelease" "${DIST_DIR}/Release"
  gpg --batch --yes --armor --export "${GPG_KEY_ID}" > "${REPO_DIR}/pubkey.gpg"
  echo "APT repo signed with key ${GPG_KEY_ID}"
else
  echo "WARNING: GPG_PRIVATE_KEY not set, repo will be unsigned"
fi

echo "APT repo built in ${REPO_DIR}/"
ls -la "${POOL_DIR}/"
