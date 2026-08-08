# Local service icons

These SVGs are vendored from [Homarr Labs Dashboard Icons](https://github.com/homarr-labs/dashboard-icons) at commit `0d6481f2a87cf611e2bf25adcf8fb07351ed2440`. They identify known self-hosted services without depending on private favicon URLs at runtime.

Included icons: Cloudreve, Gitea, Grafana, Immich, Opengist, and TeslaMate. The upstream project is licensed under Apache-2.0; the complete license is preserved in `LICENSE.dashboard-icons`. The XML declaration and external DTD were removed from `cloudreve.svg`; its drawing data is unchanged. `manifest.json` records the vendored file hashes.

The application imports these files from source instead of loading them from a CDN. Vite fingerprints the production assets, and the API serves fingerprinted `/assets` files with a one-year immutable browser cache.
