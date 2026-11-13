# Verified hardware facts

Taken from the running unit (`ubus call system board`, `dmesg`, `/proc/mtd`, `iw`), and from the
ASUS/Merlin boot log of the same board.

```
model         ASUS RT-AC3200        board_name  asus,rt-ac3200
kernel        6.12.116              OpenWrt     25.12-SNAPSHOT r0-4e96425
CPU           ARMv7 Cortex-A9, 2 cores @ 1 GHz (MPCORE, L310 L2)
RAM           248 MiB usable (256 MiB DDR3)
NAND          128 MiB, AMD/Spansion id 01 f1, 2 KiB page, 64 B OOB, BCH8
  mtd0 boot      0x000000-0x080000   512 KiB
  mtd1 nvram     0x080000-0x200000   1.5 MiB   (intact, holds MACs/calibration)
  mtd2 firmware  0x200000-0x8000000  126 MiB   (UBI: kernel + rootfs + overlay)
Radios        3x BCM43602 (14e4:aa52) behind a PLX PEX8603 PCIe switch
              phy0 5 GHz  MAC xx:xx:xx:xx:xx:xx
              phy1 2.4 GHz MAC xx:xx:xx:xx:xx:xx
              phy2 5 GHz  MAC xx:xx:xx:xx:xx:xx
Switch        BCM53012 in the SoC, 4 LAN + 1 WAN GbE
USB           1x USB 3.0 (xHCI), 2x USB 2.0 (EHCI 2 ports, OHCI 2 ports)
Serial        ttyS0 @ 0x18000300, 115200 8N1 (vendor cmdline used ttyS0,115200)
Regulatory    global PL: UNII-1/2A/2C/3 allowed; per-PHY (brcmfmac) limited to UNII-1
              because brcmfmac43602-pcie.clm_blob is not available upstream
```

## Notes on the flash layout
ASUS/Merlin use 62 MB firmware + 64 MB `jffs2`. OpenWrt uses the **whole 126 MB as one UBI**
(kernel ~7 MB + squashfs rootfs + UBIFS overlay), which gives ~65 MB of writable space on the
shipped v3 image. `nvram` (mtd1) is never touched, so the MAC addresses stay correct.

## Radio capability vs. what is allowed
`iw phy phy0 info` lists 5170–5825 MHz (all of UNII-1/2A/2C/3), so the hardware supports
channels 36–165. The *allowed* set comes from the CLM blob; without it brcmfmac falls back to a
world domain that accepts only 36–48, and any attempt to set 100/149 silently falls back to 36.
