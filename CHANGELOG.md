# Changelog

Public releases start at **v1.0**; internal build numbers are kept only for the
development trail (v1 … v5.7) and are not release versions.

## v1.3 — hot-plugged disks start aria2

- **Plugging a disk in after boot now starts aria2.** v1.2 only created the download
  directory in the block hotplug; if the disk arrived after boot, the daemon stayed off.
  The hotplug now enables and starts it on add, and stops/disables it on remove.
- **The boot-time check waits up to 20 s for the fstab mount**, so `delay_root` cannot make
  it decide "no disk" before the mount lands.
- Verified on the unit: ext4 stick at `/mnt/usb`, download completed to the stick,
  checksum matches.

## v1.2 — removable storage works out of the box

- **FAT32 support added** (`kmod-fs-vfat`, `kmod-nls-cp437`, `kmod-nls-iso8859-1`). The
  v1.1 image could detect a USB stick but not mount a FAT partition, which is what most
  sticks are formatted with.
- **`mkfs.ext4` (e2fsprogs) and `mkfs.fat` (dosfstools) are in the image**, so a disk can be
  formatted from the router instead of a PC.
- **aria2 gets a writable download directory automatically**: a block hotplug script creates
  `/mnt/usb/downloads` and chowns it to the `aria2` user after the disk is mounted; without
  that, aria2 aborts every download with "Download aborted".
- **aria2 starts only when `/mnt/usb` is mounted** (`rtac3200-autostart`), so no disk means no
  daemon and no RAM use.

## v1.1 — 5 GHz at 40 MHz, conditional remote access

- **5 GHz moved from 20 MHz to 40 MHz.** Measured on the unit: `VHT80` is refused by the
  driver (`channel is disabled`) regardless of the regulatory domain, `VHT40` works. Both
  5 GHz radios now run 40 MHz on 36+40 and 44+48. Channel 149+ stays refused even with a US
  domain, so the upper bands are out.
- **Tailscale and cloudflared only run once they are configured** (`rtac3200-autostart`,
  S99): a node key in the Tailscale state or a tunnel token enables the daemon; otherwise it
  stays disabled and quiet. Logging in once is enough for every later boot.
- **LuCI**: the menu entry is now `★ RT-AC3200`, and the device-tree model reads
  `ASUS RT-AC3200 (mod by ImAthanasia)`, so the overview shows whose build it is.
- **Page**: `?redact=1` masks MAC addresses in the neighbour list, used for screenshots.
- Build profile includes `qrencode` (QR join), `libopenssl-legacy` (aria2 TLS).

## v1.0 — first public release (internal build v5.7)

Verified on the unit on 2026-11-13: all three radios up (ch 36 / 1 / 44, VHT20), Wi-Fi
configured on first boot without intervention, LED triggers correct, QR endpoint returning SVG,
all page links resolving.

First image that is both feature-complete and verified on the unit.

### Fixed
- **All three radios were disabled.** The stock `wireless` config ships every
  `wifi-device` with `disabled '1'`; the first-boot script only enabled the
  interfaces, so the router came up wired-only.
- **5 GHz would not start.** `VHT80` fails on this driver
  (`nl80211: kernel reports: (extension) channel is disabled`); `VHT20` works.
- **LED triggers were reset late in boot.** `/etc/init.d/led-late` (S100) re-applies
  the configured triggers after the wireless/GPIO init settles.
- **v5.4 never booted.** It was a bad flash write, not a config fault — the same
  files boot fine. Flash with the ASUS utility; if it does not come up, write it again.

### Added
- **Tri-band AP:** `AC3200-2G` (ch 1), `AC3200-5G` (ch 36), `AC3200-5G-2` (ch 44),
  all VHT20/20 MHz, WPA2-PSK.
- **In-router page** at `/rtac3200.html`: live tiles (temp, load, RAM, uptime, clients,
  WAN), per-radio cards, ARP device list, ping test, one-click diagnostics, Wi-Fi restart,
  QR codes for joining (qrencode), and a LED chase for fun.
- **LED chase**: `rtac3200-ledchase` — a small C helper that detaches the triggers,
  sweeps power → WPS → WAN → WPS with a longer dwell at the ends, then hands the lamps back.
- **Downloads**: `aria2` + AriaNg + LuCI. **Files**: LuCI file manager. **Storage**: `hd-idle`.
  **Port mapping**: `natmap`. **IRQ spreading**: `irqbalance`. **Signal LED**: `rssileds`.
- **Favicon**, logo (router + wizard hat + Tux), and a LuCI menu entry with ACL.
- **Docs**: flash guide, build notes, hardware, limitations, CLM research,
  notes from the Merlin era, optional-package menu.

### Changed
- Log ring buffer 64 → 256 KB (RAM only; nothing is written to NAND for logs).
- README and docs updated for tri-band, the new UI, and the recovery procedure.
