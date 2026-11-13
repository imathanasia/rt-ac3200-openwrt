# Firmware images

The `.trx` images are **not** stored in this repository (they are large binaries). They are published
as **GitHub Releases** for this repository, organised by version:

| Build | Size | Notes |
|---|---|---|
| **v1.4** | 59.1 MB | **current** — tri-band 40 MHz, USB/FAT, aria2 on demand, verified on the unit (448 packages) |
| **v2-ac3200-full-featured** | 34 MB | **known-good fallback** (315 packages) |
| v1.0 - v1.3 | 58.7-59.1 MB | earlier releases |
| v5.x and older | 53-57 MB | internal builds from the bisect history |

**Reverting to ASUS firmware:** download the stock firmware and the *Firmware Restoration* utility
from the [ASUS RT-AC3200 support page](https://www.asus.com/us/supportonly/rt-ac3200/helpdesk_download/)
and flash it through recovery mode — the same way this image is installed.

Every release includes a `SHA256SUMS` file — verify before flashing.
