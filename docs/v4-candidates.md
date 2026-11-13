# v4 candidate features — research notes

**Status: partly shipped.** Everything marked ✅ is in the v1.0 image now; the rest is the
shortlist for future builds. Install-at-runtime instructions are in
[optional-packages.md](optional-packages.md).

Method: checked the local **OpenWrt 25.12 feeds** (authoritative for whether a package exists for
`bcm53xx`), plus upstream GitHub projects for things that are *not* in the feeds. Availability
column: `feed` = can be baked into the image; `external` = would have to be vendored or added as an
extra feed; `kernel` = kernel module from `package/kernel`.

The board's real advantages are: **2× USB (3.0 + 2.0)**, **5× GbE**, **128 MB NAND + USB for
extroot**, **256 MB RAM**, and the possibility of a **USB LTE/5G stick**. (The second 5 GHz radio
stays unusable without the vendor CLM blob — see `limitations.md` — so ignore "tri-band" as a
selling point here.)

---

## A. Packages that fit this hardware (all in the 25.12 feeds)

### USB ports (the most under-used hardware)
| Feature | Package(s) | Why |
|---|---|---|
| **USB over IP** — share a USB disk/printer/SDR across the LAN | `usbip` (userspace) + `kmod-usbip`, `kmod-usbip-server`, `kmod-usbip-client` (kernel) | the box can export its USB port to another machine as if local |
| **USB printer server** | `luci-app-p910nd` | cheap network printer |
| **USB-serial over network** | `luci-app-ser2net` | talk to routers/UPS/Arduino from anywhere |
| **DLNA media** | `luci-app-minidlna` | TV/phone playback of the USB disk |
| **Download box** | `luci-app-aria2 ✅`, `luci-app-transmission`, `rclone` (+ `luci-app-alist`, `luci-app-filebrowser`, `luci-app-filemanager ✅`) | with extroot on USB this is a real NAS; mind RAM (transmission/aria2 ~40–70 MB) |

### Wi-Fi (dual-band radios)
| Feature | Package | Why |
|---|---|---|
| **Band steering / fast roaming** | `luci-app-usteer` or `luci-app-dawn` | one SSID across 2.4 + 5 GHz, clients moved to 5 GHz |
| **WISP / repeater client** | `luci-app-travelmate` | use the AC3200 as a Wi-Fi client + re-broadcaster (GL.iNet's "Repeater" equivalent) |
| **Wi-Fi schedule** | `luci-app-wifischedule` | radios off at night |

### Guest network / captive portal
| Feature | Package | Why |
|---|---|---|
| Captive portal with splash | `luci-app-coovachilli` or `luci-app-splash` (in feed) / **openNDS** (external, GPL) | guest Wi-Fi with a click-through page, voucher/limits |
| Guest isolation | built-in firewall zones | already possible; needs a VLAN/bridge for true separation |

### Reliability / monitoring / HA
| Feature | Package | Why |
|---|---|---|
| VRRP pair (two routers, one IP) | `luci-app-keepalived` | if you ever run two units |
| Neighbour discovery | `luci-app-lldpd` | shows switches/APs on the network |
| SNMP | `snmpd-nossl` + `luci-app-snmpd` | Zabbix/LibreNMS monitoring (use *-nossl only; the -ssl variant conflicts) |
| IDS-style blocking | `luci-app-crowdsec-firewall-bouncer` | community blocklists + local decisions |
| WAN watchdog | already have `watchcat`; **`gl-wan-monitor`** (external, GPL, zero-dep) is GL.iNet's variant |

### Mesh (only with a second unit)
`luci-app-bmx7`, `luci-app-olsr`, `luci-app-babeld` (feed); **mesh11sd** (external) automates 802.11s.

### Proxy / DNS extras
`luci-app-polipo` (ad-filtering HTTP proxy), `luci-app-privoxy`, `luci-app-tinyproxy`,
`luci-app-unbound`, `luci-app-adblock` (we ship AdGuard Home + adblock-fast already).

---

## B. External projects worth a look (not in the feeds)

| Project | License | Fit | Verdict |
|---|---|---|---|
| **cake-autorate** (`lynxthecat/cake-autorate`) | check repo (script, no SPDX seen) | Adaptive CAKE that tracks **variable bandwidth** (LTE, Starlink, cable). Explicitly supports OpenWrt **and Asuswrt-Merlin**. | ⭐ the single best match for a **USB LTE stick**; vendor or install from source |
| **openNDS** (`openNDS/openNDS`) | GPL-2.0 | Captive portal (splash, vouchers) | good if you want a guest portal; `coovachilli` is the in-feed alternative |
| **mesh11sd** | GPL-2.0 | 802.11s mesh automation | only with ≥2 units |
| **4IceG LTE suite** (Polish author, actively maintained) | mixed | `luci-app-modemband` (**LTE/5G band locking — B1/B3/B7/B20/B28**), `luci-app-3ginfo-lite` (signal stats), `luci-app-sms-tool-js` (SMS/USSD), `luci-app-atcommands`/`socat`/`atinout` (AT console), `luci-app-modeminfo`, `luci-app-lite-watchdog`, `openwrt-lte-keep-alive`, and a **CPU/RAM/Wi-Fi temperature panel** | ⭐ the best tooling for the SIM/LTE goal. **Licensing caveat:** only `luci-app-sms-tool-js` declares GPL-3.0; the others have **no license file** → do **not** vendor them into a GPL repo; use their repo as a runtime feed / install manually |
| **4IceG `Modem-extras` / `Modem-extras-apk`** | — | prebuilt modem packages repository | runtime repo only; check arch before use |
| **GL.iNet userspace bits** (`gl-wan-monitor`, `gl-modem-at`, `gl-portal-detect`) | GPL-2.0 / GPL-3.0 | zero-dependency shell tools | portable; see previous research |

---

## C. Rejected (and why)

* **GL.iNet `gl-sdk4-ui` / `gl-2b-ui`** — Vue SPA over GL-specific ubus APIs + nginx + GL kernel
  modules; replacing LuCI is a project and would break the 25.12 base.
* **GL `parental-control`** — it is a *kernel module* (`parental_control.ko`); a userspace rewrite
  (nftables sets + cron) is cheaper and kernel-proof.
* **argon / other LuCI skins** — not maintained for the client-side LuCI in 24.10+/25.12.
* **passwall / helloworld / openclash** — CN-oriented, heavy, and duplicate what we already have.
* **Docker/LXC, Home Assistant, Jellyfin, Pi-hole** — RAM/CPU/space; the box has 256 MB.
* **GL.iNet ipk repo (1.75 GB)** — arch mismatch (`mipsel_24kc`, `ipq*`, `aarch64`, hard-float
  armv7) vs our `arm_cortex-a9` soft-float.

---

## D. Proposed v4 shortlist (need your pick)

| # | Item | Type | Cost | Risk |
|---|---|---|---|---|
| 1 | `usbip` server (share USB over LAN) | feed + kernel | ~1 MB | low |
| 2 | `minidlna` + `p910nd` + `ser2net` | feed | ~4 MB | low |
| 3 | `usteer` (band steering) | feed | ~1 MB | low (brcmfmac caveat: no 802.11k/v? verify) |
| 4 | `sms-tool` + `modemmanager` baked; 4IceG `modemband` + `3ginfo-lite` + `sms-tool-js` installed at runtime | feed + external | ~6 MB | medium (modem-dependent) |
| 5 | `cake-autorate` vendored | external | <1 MB | medium (license + script) |
| 6 | `coovachilli` guest portal | feed | ~1 MB | medium (needs a guest VLAN) |
| 7 | `keepalived` (HA pair) | feed | ~1 MB | low |
| 8 | userspace parental control (nftables + cron) | our code | ~0 | low |

Recommended default: **1 + 2 + 3 + 4**, plus **8** if you want parental controls; 5 only if the LTE
stick becomes your primary or backup WAN.
