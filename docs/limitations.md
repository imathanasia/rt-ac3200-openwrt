# Limitations, and what would fix them

| # | Limitation | Cause | Fix |
|---|---|---|---|
| 1 | 5 GHz only on ch 36–48; second 5 GHz radio disabled | `brcmfmac` has no `brcmfmac43602-pcie.clm_blob`, so the per-PHY regulatory domain stays "world" | Obtain the CLM blob from the vendor firmware (`dhd.ko` inside `RT-AC3200_384.13_10.trx`) or rebuild the board data from the intact `nvram` partition (mtd1) and install it as `/lib/firmware/brcm/brcmfmac43602-pcie.clm_blob` (+ `.txt`) |
| 2 | ~600–900 Mbit/s NAT ceiling | no hardware NAT offload on Broadcom; OpenWrt has software flow offload only | enable `flow_offloading` in the firewall (helps a little); a faster SoC is the real fix |
| 3 | Wi-Fi is AP-mode only | brcmfmac FullMAC cannot do station/WDS | use a USB Wi-Fi adapter or Ethernet for a WISP/STA setup |
| 4 | No AiMesh / AiProtection / guest-network wizard | those are ASUS userspace features | `luci-app-wifischedule`, `pbr`, `banip`, AdGuard cover most of the practical need |
| 5 | LuCI 25.12 has no "pretty" third-party themes | LuCI was rewritten client-side in 24.10+; argon-era themes are unmaintained | the built-in theme; the visual payoff is the Statistics/dashboard stack |
| 6 | AdGuard Home does not filter before first boot | it needs a config; ours is pre-seeded, so this only applies to a blank install | bake `scripts/first-boot/adguardhome.yaml` (already done in v2/v3) |

### Update (2026-11-13): 5 GHz does work — at 20 MHz

Earlier notes here said the second 5 GHz radio had to stay off and that only UNII-1 was usable in
theory. Measured on the unit:

* `VHT80` on channel 36 fails: hostapd logs `nl80211: kernel reports: (extension) channel is disabled`.
* `VHT40` and `VHT20` on the same channel come up immediately (`AP-ENABLED`).
* Changing the regulatory domain does not help: `US` and `DE` give the same VHT80 refusal.
* Channel 149+ is refused as well, even with a US domain, so the upper UNII bands are out.
* Channels 52-140 are `no IR, radar detection` — usable as a client, not as an AP without DFS.
* Channels 149-165 are marked `disabled`.

So both BCM43602 5 GHz radios run as APs at **40 MHz** on two adjacent 40 MHz blocks
(**36+40** and **44+48**), and the 2.4 GHz radio at 20 MHz on channel 1. That is a working
tri-band AP, just not an 80 MHz one.

The vendor NVRAM partition does carry per-radio board data (`boardtype 0x072F`,
`boardrev 0x1421`, PA gain tables), but `brcmfmac` does not consume the ASUS NVRAM partition —
it loads one firmware blob (`brcmfmac43602-pcie.bin`) and no CLM file, so that data cannot be
fed to this driver as-is. A vendor `clm_blob` would have to be produced with Broadcom's CLM
compiler, which is not public. The 80 MHz refusal is a driver/firmware limitation, not regulatory.
Also worth knowing: the stock wireless config ships every `wifi-device` with `disabled '1'`, so a
first-boot script must enable the radios, not only the interfaces.

### Front-panel Wi-Fi LEDs stay dark

The 2.4G / 5G lamps on the front are not in `/sys/class/leds`. Only three lamps are exposed to
Linux (`white:power`, `white:wps`, `red:wan`); the Wi-Fi lamps are wired to the radios' status
pins and were driven by the vendor `wl` driver, which `brcmfmac` replaces. Nothing in userspace
can light them, and there is no GPIO mapping to fake it. If you want a visible Wi-Fi indicator,
point `white:wps` at a trigger (`netdev` or `rssileds`) — that is the closest this board allows.
