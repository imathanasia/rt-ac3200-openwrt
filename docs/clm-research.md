# 5 GHz channels on BCM43602 — what the internet already knows

Short version: the missing `brcmfmac43602-pcie.clm_blob` is **not** obtainable, but the missing
**NVRAM board file** (`brcmfmac43602-pcie.txt`) is, and that is what actually unlocks the channels.
Our board's NVRAM is still intact on the router, so this is worth trying.

## What we hit

```
brcmfmac: Direct firmware load for brcm/brcmfmac43602-pcie.txt failed with error -2
brcmfmac: Direct firmware load for brcm/brcmfmac43602-pcie.clm_blob failed with error -2
brcmfmac: brcm_c_process_clm_blob: no clm_blob available (err=-2), device may have limited channels available
```

Result: the PHY advertises 5170-5825 MHz, but the per-PHY regulatory domain stays "world" and
anything above channel 48 is refused. Both 5 GHz radios would land on ch36, so one is left disabled.

## Prior work

| Source | What they found |
|---|---|
| [openwrt#20514](https://github.com/openwrt/openwrt/issues/20514) — Netgear R8000, three BCM43602 | Extracted several Netgear stock firmwares with binwalk: **no CLM or TXCAP blobs present**. linux-firmware and mirrors do not ship them for 43602 PCIe. They hand-built an NVRAM `.txt`: *"partial improvement, but TX queue timeouts persist"*. |
| [openwrt#26369](https://github.com/openwrt/openwrt/issues/26369) — SmartRG SR400ac, BCM43602 rev3 | Firmware init fails outright; notes the missing `.bin/.txt/.clm_blob` may not even be the root cause. |
| [omarchy#7672](https://github.com/omacom/omarchy/issues/7672) + [PR #7671](https://github.com/omacom/omarchy/pulls/7671) — 2017 Touch Bar MacBooks, **same BCM43602** | Under `brcmfmac` they only saw 2.4 GHz. Installing a **calibrated NVRAM** (`brcmfmac43602-pcie.txt`) fixed it: 2437 MHz → **5745 MHz (ch149)**, -66 → -40 dBm, 104/144 → 867/650 Mbit/s. The `no clm_blob` warning **stays** in the log — so the `.txt` is what matters. |
| [csk-grit42 HOWTO-wifi.md](https://github.com/csk-grit42/OmarchyOnMacBookPro14.2-HOWTO) | The field recipe behind that PR: a per-board NVRAM dump with per-channel tx-power tables (`pa_5g_*`, `aa5g=0`). Notably **per board** — a dump from another machine is not a drop-in. |

## What that means for the RT-AC3200

1. **Do not chase the CLM blob.** Two independent attempts came up empty.
2. **Do build the NVRAM `.txt`.** It must come from *this* board. Two sources:
   * `mtd1` ("nvram", 1.5 MB) — never written by OpenWrt, still holds the ASUS factory variables.
   * `RT-AC3200_384.13_10.trx` — the vendor firmware's own defaults (`nvram` defaults live in the
     bootloader/`dhd.ko`; the calibration values are in the NVRAM partition).
3. Parse the ASUS keys (`wl0_*`, `wl1_*`, `wl2_*`, `boardflags`, `pa_*`, `ccode`) and emit
   `/lib/firmware/brcm/brcmfmac43602-pcie.txt` with the per-chip keys the driver expects.
4. Reboot, then check `iw phy phy0 info | grep -A3 "Band 2"` and `iw list | grep -c "5[0-9][0-9][0-9] MHz"`.

**Effort:** about 1–2 hours now that the direction is known (mostly mapping key names).
**Odds:** decent for more channels; the R8000 report warns that TX queue timeouts can appear, which is
why this is a test branch and not something to bake blindly.

**Fallback:** if it misbehaves, delete the `.txt` and reboot — the driver goes back to the current
state. The stock image and this build are both recoverable, so the risk is contained.
