# [GitHub Desktop](https://desktop.github.com) - The Linux Fork (desktop-drac)

[![CI / Linux](https://github.com/xi72yow/desktop-drac/actions/workflows/ci-linux.yml/badge.svg)](https://github.com/xi72yow/desktop-drac/actions/workflows/ci-linux.yml)

[GitHub Desktop](https://desktop.github.com/) is an open-source [Electron](https://www.electronjs.org/)-based
GitHub app. It is written in [TypeScript](https://www.typescriptlang.org) and
uses [React](https://reactjs.org/).

**desktop-drac** is a community-maintained Linux fork, originally based on
[shiftkey/desktop](https://github.com/shiftkey/desktop) (no longer actively maintained),
now synced directly with the official [desktop/desktop](https://github.com/desktop/desktop) upstream.

<picture>
  <source
    src="https://github.com/user-attachments/assets/211838b3-89d7-4a07-97c9-32ed612d0b35"
    media="(prefers-color-scheme: dark)"
  />
  <img
    width="1072"
    src="https://github.com/user-attachments/assets/211838b3-89d7-4a07-97c9-32ed612d0b35"
    alt="A screenshot of the GitHub Desktop Dracula Theme"
  />
</picture>


<picture>
  <source
    srcset="https://user-images.githubusercontent.com/634063/202742848-63fa1488-6254-49b5-af7c-96a6b50ea8af.png"
    media="(prefers-color-scheme: dark)"
  />
  <img
    width="1072"
    src="https://user-images.githubusercontent.com/634063/202742985-bb3b3b94-8aca-404a-8d8a-fd6a6f030672.png"
    alt="A screenshot of the GitHub Desktop application showing changes being viewed and committed with two attributed co-authors"
  />
</picture>


## Installation

### Debian/Ubuntu (APT)

```sh
# Import GPG key
curl -fsSL https://xi72yow.github.io/desktop-drac/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/desktop-drac.gpg

# Add repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/desktop-drac.gpg] https://xi72yow.github.io/desktop-drac stable main" | sudo tee /etc/apt/sources.list.d/desktop-drac.list

# Install
sudo apt update && sudo apt install github-desktop
```

Updates are delivered via `sudo apt upgrade`.

### AppImage

Download the latest `.AppImage` from the [Releases](https://github.com/xi72yow/desktop-drac/releases) page.

```sh
chmod +x GitHubDesktop-linux-x86_64-*.AppImage
./GitHubDesktop-linux-x86_64-*.AppImage
```

## Available Packages

| Format | Architecture | Description |
|---|---|---|
| `.deb` | amd64 | Debian/Ubuntu package |
| `.AppImage` | x86_64 | Portable, runs on any Linux distro |

## Known Issues

If you're having troubles with Desktop, please refer to the [Known issues](docs/known-issues.md#linux)
document for guidance and workarounds for common limitations.

## Building from Source

```sh
# Prerequisites: Node.js 24.x, libsecret-1-dev, Python 3.11+
node vendor/yarn-1.21.1.js install
node vendor/yarn-1.21.1.js build:prod
node vendor/yarn-1.21.1.js run package
```

See [agents.md](agents.md) for a detailed build log and development notes.

## More Information

Please check out the upstream [GitHub Desktop project](https://github.com/desktop/desktop) and
[desktop.github.com](https://desktop.github.com) for more product-oriented
information about GitHub Desktop.

See the [getting started documentation](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop) for more information on how to set up, authenticate, and configure GitHub Desktop.

## License

**[MIT](LICENSE)**

The MIT license grant is not for GitHub's trademarks, which include the logo
designs. GitHub reserves all trademark and copyright rights in and to all
GitHub trademarks. GitHub's logos include, for instance, the stylized
Invertocat designs that include "logo" in the file title in the following
folder: [logos](app/static/logos).

GitHub® and its stylized versions and the Invertocat mark are GitHub's
Trademarks or registered Trademarks. When using GitHub's logos, be sure to
follow the GitHub [logo guidelines](https://github.com/logos).
