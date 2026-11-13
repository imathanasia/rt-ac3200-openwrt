# Optional packages — considered, not baked

Everything below was evaluated for this board and deliberately left out of the default image.
Most are one `opkg`/`apk` install away, or a package line in `.config` if you build your own.
Reasons are honest: RAM, flash, redundancy, or no hardware to drive.

## Wi-Fi / network
| Package | Why not baked |
|---|---|
| `luci-app-dawn` | alternative band-steering; `usteer` already does it, running both fights |
| `luci-app-dcwapd` | dynamic channel width — interesting, but 5 GHz is fixed at 20 MHz here |
| `luci-app-omcproxy` | IGMP/MLD proxy for IPTV; only useful with a multicast source |
| `luci-app-eoip` | Ethernet-over-IP bridge; a lab toy |
| `luci-app-travelmate` | already baked |
| `luci-app-mwan3` / `pbr` | both baked, but in AP mode neither has a job; candidates for removal |

## Downloads (aria2)
`aria2` + AriaNg are baked in, but **aria2 ships disabled** and points at
`/mnt/usb/downloads`. The default is deliberate: the router's own flash is small and
writes to it are slow and wearing. Attach a USB disk, mount it (LuCI → System → Mount
Points, or `mount /dev/sda1 /mnt/usb`), then enable aria2 in LuCI → Services → aria2,
or with `uci set aria2.main.enabled=1 && uci commit aria2 && /etc/init.d/aria2 restart`.
AriaNg then opens at `/ariang/` with the RPC secret `ac3200-aria2`.

The daemon runs as the `aria2` user, so the download directory has to be owned by it. That is
handled automatically: a block hotplug script creates `/mnt/usb/downloads` and chowns it after the
disk is mounted, and `rtac3200-autostart` only starts aria2 when `/mnt/usb` is actually mounted.

Filesystems: ext4, exFAT and NTFS3 are in the image, plus FAT32 (`vfat`) and `mkfs.ext4` /
`mkfs.vfat` so a stick can be formatted from the router.

If you want downloads that vanish on reboot instead, point `dir` at `/tmp/aria2`.

## Files, media, storage
| Package | Why not baked |
|---|---|
| `transmission` / `luci-app-transmission` | 30–50 MB RAM for what `aria2` does with a fraction |
| `luci-app-openlist` / `alist` | cloud-drive aggregator, 30–50 MB RAM |
| `luci-app-syncthing` | ~100 MB RAM — too much for 256 MB |
| `luci-app-filebrowser` | needs a `filebrowser` binary that is not in the 25.12 feed |
| `luci-app-minidlna` | baked (DLNA) |
| `luci-app-hd-idle` | baked (spin-down) |

## Server-ish web UIs
| Package | Why not baked |
|---|---|
| `luci-app-radicale3` | CalDAV/CardDAV server, ~30 MB RAM; good first pick if you want one |
| `luci-app-rustdesk-server` | RustDesk relay, ~30 MB; the CPU is weak |
| `luci-app-coovachilli`, `luci-app-openwisp` | captive portals; openwisp is heavy |
| `luci-app-squid`, `privoxy`, `tinyproxy` | HTTP proxies; niche |
| `luci-app-snmpd` | SNMP for Zabbix/LibreNMS; note: use the `nossl` variant, `-ssl` conflicts |
| `luci-app-keepalived` | VRRP; only with a second unit |
| `luci-app-rustdesk-server`, `luci-app-lorawan-basicstation` | need specific hardware/services |
| **Nginx UI**, **Navidrome**, **wg-easy**, **Glances**, **qBittorrent-nox**, **filebrowser** | not in the feed; each costs 20–50 MB RAM, add as an external feed/repo |

## Monitoring
| Package | Why not baked |
|---|---|
| `apinger` + `apinger-rrd` | WAN latency/loss history; pulls `rrdtool` (~3 MB) — skipped by request |
| `librespeed-go` | speedtest server, ~10–15 MB; skipped by request |
| `netdata` | gorgeous, ~40 MB RAM |
| `crowdsec` | Go, ~40 MB RAM for little gain on a home LAN |

## Security
| Package | Why not baked |
|---|---|
| `luci-app-fwknopd` | single-packet authentication; a niche tool |
| `luci-app-clamav` | antivirus; far too heavy |
| `luci-app-https-dns-proxy`, `nextdns`, `smartdns` | baked/overlapping with AdGuard Home |

## USB / serial
| Package | Why not baked |
|---|---|
| `usbip` (+ kernel modules) | export the USB port over IP; needs a client setup |
| `luci-app-p910nd`, `luci-app-ser2net`, `socat` | baked, tiny |
| `luci-app-nut` | baked (UPS), needs a UPS |

## Why the default image is lean
256 MB RAM and a 128 MB NAND. Every daemon is permanently resident, and the router's
job is forwarding packets. Services here are chosen so that the page you open is honest:
if it is listed, it works without extra installation.

## Adding one of these yourself
1. Build: append `CONFIG_PACKAGE_<name>=y` to `.config`, then `make -j$(nproc)`.
2. Runtime (if the feed matches the image): `apk add <name>` (25.12) or `opkg install <name>`.
3. External repos (4IceG LTE tools, `cake-autorate`, `mesh11sd`, `openNDS`): add a
   `src-git` line to `feeds.conf.default` and re-run `./scripts/feeds update -a`, or install
   at runtime. Check the licence before redistributing anything.
