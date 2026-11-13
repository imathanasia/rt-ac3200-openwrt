# What the old ASUS/Merlin firmware told us

The stock boot log (Merlin 384.13_10, Linux 2.6.36.4brcmarm) was used as ground truth for the build:

* kernel 2.6.36.4brcmarm — reason the old firmware is not a safe place to stay
* CPU `413fc090` = Cortex-A9, 2 cores, 1998.84 BogoMIPS (~1 GHz each)
* NAND: AMD/Spansion 128 MiB, 128 KiB blocks, 2 KiB pages, 64 B OOB, 8-bit ECC
* partitions: boot 0x0-0x80000 · nvram 0x80000-0x200000 · linux 0x200000-0x4000000 ·
  rootfs at 0x3b2ea4 · a second `brcmnand` region 0x4000000-0x8000000 (jffs2)
* three `dhd` interfaces (eth1/eth2/eth3) with MACs `…:f4`, `…:f0`, `…:f8` → the 2.4/5/5 mapping
  used to label the radios in the first-boot script
* `acsd` picked ch9 (2.4 GHz), ch36/80 and ch100/80 (5 GHz) → proof the hardware can do UNII-1
  and UNII-2C, and that the DFS channel we cannot use in OpenWrt is a CLM-blob problem
* USB stack already loaded qmi_wwan/cdc_mbim/cdc_ncm → the board was designed for USB modems
* `Tuxera` NTFS/HFS+/FAT drivers in stock → we replace them with ntfs3/exfat (free, in-kernel)
