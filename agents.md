# Desktop-Drac: Linux Fork von GitHub Desktop - Arbeitsprotokoll

## Projektzusammenfassung

**desktop-drac** ist ein Linux-Fork von GitHub Desktop (Electron/TypeScript/React).
Forkchain: `desktop/desktop` -> `shiftkey/desktop` -> `xi72yow/desktop-drac`

Der shiftkey-Fork wird nicht mehr aktiv gepflegt. Ziel ist es, den Fork aktuell zu halten
und mit dem offiziellen upstream (`desktop/desktop`) zu synchronisieren.

## Umgebung

| Tool | Version |
|---|---|
| Node.js | 24.11.1 (via nvm, pinned in `.node-version` / `.nvmrc`) |
| Yarn | 1.21.1 (vendored in `vendor/yarn-1.21.1.js`) |
| Electron | 40.1.0 |
| Python | 3.13.5 |
| OS | Linux (Debian/amd64) |

### Systemabhängigkeiten (apt)

- `libsecret-1-dev` - Credential Storage (keytar)
- `libxss1` - X11 Screen Saver Extension
- `libgconf-2-4` - GNOME Config (optional, je nach Distro)

## Git Remotes

| Remote | URL | Beschreibung |
|---|---|---|
| `origin` | `https://github.com/xi72yow/desktop-drac.git` | Eigener Fork |
| `upstream` | `https://github.com/shiftkey/desktop.git` | Alter Linux-Fork (shiftkey) |
| `upstream-official` | `https://github.com/desktop/desktop.git` | Offizielles GitHub Desktop |

## Was wir gemacht haben

### 1. Umgebung geprüft

- Node.js 22 war installiert, aber das Projekt brauchte Node 20.17.0 (pre-merge)
- `nvm install 20.17.0` und `nvm use 20.17.0` zum Wechseln
- `libsecret-1-dev` musste nachinstalliert werden (`sudo apt install libsecret-1-dev`)
- Yarn ist im Projekt vendored - muss nicht global installiert sein

### 2. Offizielles Upstream eingerichtet

```bash
git remote add upstream-official https://github.com/desktop/desktop.git
git fetch upstream-official
```

Hinweis: Der Fetch des `gemoji`-Submoduls schlägt fehl (veraltete Referenz) - ist nicht kritisch.

### 3. Stand analysiert

- **47 Linux-spezifische Commits** auf dem `linux` Branch (Tooling, ARM-Support, Flatpak, Linux-UI-Fixes)
- **1.649 Commits** ist das offizielle upstream voraus

Linux-spezifische Commits umfassen:
- ARM32/ARM64 Build-Support
- Debian/RPM/AppImage Packaging
- Flatpak-Integration (Code-Editoren erkennen)
- Linux-spezifische UI-Fixes (Titlebar, About-Dialog, Argument-Parsing)
- CI/CD Workflows für den Fork
- Dependabot-Updates

### 4. Dependencies installiert und Pre-Merge Build getestet

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 20.17.0
node vendor/yarn-1.21.1.js install
node vendor/yarn-1.21.1.js build:dev
```

- Alle 5 Webpack-Targets kompiliert: main, renderer, crash, cli, highlighter
- App lief erfolgreich im Dev-Modus

### 5. Merge von upstream-official/development (1.649 Commits)

```bash
git merge upstream-official/development
```

**15 Dateien mit Konflikten**, alle manuell gelöst:

| Datei | Lösung |
|---|---|
| `docs/technical/shell-integration.md` | Beide Shells behalten (Black Box + Ghostty) |
| `.github/workflows/ci.yml` | Upstream Runner übernommen (macos-14-xlarge, windows-2022) |
| `script/build.ts` | Unbenutzten Import `OfficialArch` und `os` entfernt |
| `package.json` | Linux-Pakete behalten (electron-builder, parallel-webpack, patch-package, optionalDependencies), upstream-Versionen übernommen (Electron 40.1.0, neue Deps) |
| `app/package.json` | `keytar-forked` behalten, `windows-argv-parser` nicht übernommen (Linux-Fork hat es entfernt), `which` übernommen |
| `app/src/lib/shells/linux.ts` | Beide Shells hinzugefügt (BlackBox + Ghostty) |
| `app/src/lib/custom-integration.ts` | Doppelte Imports bereinigt, `windows-argv-parser` Import nicht übernommen |
| `app/src/lib/editors/launch.ts` | Upstream's schlanke `launchEditor` Helper übernommen, Linux/Flatpak `spawnEditor` Support eingebaut |
| `app/src/lib/ipc-shared.ts` | `TitleBarStyle` Import behalten, `desktop-notifications` Import-Pfade auf upstream aktualisiert |
| `app/src/main-process/main.ts` | `handlePossibleProtocolLauncherArgs` durch `handleCommandLineArguments` ersetzt, Linux URL-Argument-Parsing in `handleCommandLineArguments` beibehalten, upstream Security-Fix (`return` nach `--protocol-launcher`) übernommen |
| `app/src/models/popup.ts` | `ConfirmRestart` (Linux) behalten + alle neuen upstream PopupTypes übernommen |
| `app/src/ui/about/about.tsx` | Linux "View Releases" Link behalten, `this.state` -> `this.props` für updateState (upstream Refactor) |
| `app/src/ui/app.tsx` | `ConfirmRestart` Import behalten + alle neuen upstream Popup-Renderer übernommen |
| `yarn.lock` + `app/yarn.lock` | Upstream-Version übernommen, durch `yarn install` regeneriert |

### 6. Post-Merge Fixes

- **`postinstall-postinstall`** Paket entfernt - inkompatibel mit npm 11 (Node 24), war redundant da `patch-package` bereits im `post-install.ts` aufgerufen wird
- **Node-Version auf 24.11.1** hochgestuft (upstream Anforderung, `process-proxy@0.5.0` braucht Node >= 22)
- **`custom-integration.ts`**: Doppelte `child_process` Imports bereinigt, unbenutzten `ChildProcess` Import entfernt
- **`linux-test.ts`**: Von Jest auf `node:test` + `node:assert` migriert (upstream hat Test-Framework gewechselt)

### 7. Tests

```
874 Tests, 871 bestanden, 2 fehlgeschlagen, 1 übersprungen
```

Die 2 Failures sind vorbestehende Edge-Cases (Git-Befehle in Nicht-Git-Verzeichnis), nicht durch Merge verursacht.

### 8. Packaging verbessert

**`script/package.ts`** angepasst: Automatische Distro-Erkennung via `/etc/os-release`:
- Debian/Ubuntu -> nur `.deb` + AppImage
- Fedora/RHEL/SUSE -> nur `.rpm` + AppImage
- Unbekannt -> beides (wie bisher)

So muss `rpmbuild` nicht auf Debian installiert sein und umgekehrt.

### 9. Prod-Build und Packaging erfolgreich

```bash
node vendor/yarn-1.21.1.js build:prod   # Prod-Build
node vendor/yarn-1.21.1.js run package  # Packaging
```

Ergebnis:
- `dist/GitHubDesktop-linux-x86_64-3.5.5.AppImage` (178 MB)
- `dist/GitHubDesktop-linux-amd64-3.5.5.deb` (130 MB)
- SHA256 Checksummen generiert
- `.deb` installiert und getestet - funktioniert!

### 10. CI/CD vereinfacht (Debian First)

Strategie: **Debian first** - nur amd64, nur `.deb` + AppImage. Kein ARM, kein RPM.

**`.github/workflows/ci-linux.yml`** komplett umgeschrieben:
- ARM-Jobs (`arm64`, `arm`) entfernt
- shiftkey Container-Actions durch direkte Build-Steps ersetzt (`actions/setup-node`, `apt-get install`)
- `amd64` Job: Ubuntu-latest Runner, Node 24.11.1, vendored Yarn
- Publish-Job: Node 24.11.1, `tsx` statt `ts-node`, `softprops/action-gh-release@v2`
- Artifacts: nur `*.AppImage`, `*.deb`, `*.sha256`

**`script/generate-release-notes.ts`** angepasst:
- `SUCCESSFUL_RELEASE_FILE_COUNT` von `3 * 3 * 2 = 18` auf `1 * 2 * 2 = 4` (1 Arch x 2 Formate x 2 Dateien)

**Versionsschema**: `release-{upstream-version}-linux{revision}`
- Beispiel: `release-3.5.5-linux1` (erster Linux-Release von upstream 3.5.5)
- `-linux1`: zieht automatisch upstream Changelog
- `-linux2`+: manuelle Release Notes (eigene Änderungen)

### 11. Upstream-Workflows aufgeräumt

Alle irrelevanten upstream-Workflows gelöscht:
- `ci.yml` (Mac/Windows CI)
- `create-draft-release.yml`, `sync-with-upstream.yml`, `release-pr.yml` (upstream Release-Infra)
- `triage-prs.yml`, `triage-issues.yml`, `triage-scheduled-tasks.yml` (upstream Triage-Bots)

Behalten:
- `ci-linux.yml` (unsere CI)
- `codeql.yml` (Security Scanning, kostenlos für öffentliche Repos)

**Achtung**: Beim nächsten upstream-Merge kommen diese Workflows wieder rein und müssen erneut gelöscht werden.

### 12. wrap-ansi Fix für Node 24

`electron-builder` bundelt `cliui`/`yargs` die `wrap-ansi` nutzen. Version 8.x ist ESM-only und crasht unter Node 24 (`TypeError: mixin.wrap is not a function`).

Fix: `wrap-ansi` auf 7.0.0 (letzte CJS-Version) gepinnt via Yarn Resolution in `package.json`:
```json
"resolutions": {
  "wrap-ansi": "7.0.0"
}
```

**Achtung**: Beim nächsten upstream-Merge kann `yarn.lock` überschrieben werden. Danach `yarn install` laufen lassen damit die Resolution greift.

### 13. Release-Workflow + APT-Repo auf GitHub Pages

**`workflow_dispatch` Trigger** in `ci-linux.yml`:
- GitHub Actions Tab -> "Run workflow" -> Version eingeben (z.B. `3.5.5-linux1`)
- Tag wird automatisch erstellt und gepusht
- GitHub Release (draft) mit .deb, AppImage, sha256
- Ohne Version: nur Build (dry run)

**APT-Repository** auf GitHub Pages (`https://xi72yow.github.io/desktop-drac`):
- `scripts/update-apt-repo.sh` baut Repo-Struktur (`dpkg-scanpackages`, GPG-Signierung)
- Automatisch deployed nach jedem Release
- Gleicher GPG-Key wie zed-deb Repo
- Benötigt `GPG_PRIVATE_KEY` Secret im GitHub Repo

**User-Installation:**
```bash
# GPG Key importieren
curl -fsSL https://xi72yow.github.io/desktop-drac/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/desktop-drac.gpg

# Repo hinzufügen
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/desktop-drac.gpg] https://xi72yow.github.io/desktop-drac stable main" | sudo tee /etc/apt/sources.list.d/desktop-drac.list

# Installieren
sudo apt update && sudo apt install github-desktop
```

Getestet auf Debian Trixie - funktioniert!

## Nächste Schritte

- [ ] Electron 40 spezifische Änderungen prüfen (API-Deprecations etc.)
- [ ] Flatpak-Paket testen

## Nützliche Befehle

```bash
# nvm laden + Node 24 aktivieren (in jeder neuen Shell nötig)
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 24.11.1

# Dependencies installieren
node vendor/yarn-1.21.1.js install

# Dev-Build
node vendor/yarn-1.21.1.js build:dev

# App starten (Dev-Modus mit Live-Reload)
node vendor/yarn-1.21.1.js start

# Prod-Build + Packaging
node vendor/yarn-1.21.1.js build:prod
node vendor/yarn-1.21.1.js run package

# Tests
GIT_TERMINAL_PROMPT=0 node vendor/yarn-1.21.1.js test:unit

# Linux-spezifische Commits anzeigen
git log upstream-official/development..linux --oneline

# Upstream-Commits die noch fehlen
git log linux..upstream-official/development --oneline | wc -l
```
