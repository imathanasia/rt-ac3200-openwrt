# Flashing the RT-AC3200 (no serial console)

## Why not the web UI
Stock ASUS and Asuswrt-Merlin accept only **ASUS-signed** images. Our image is a valid ASUS TRX
(it carries the `RT-AC3200` product ID) but it is not signed, so the web UI answers:
*"Invalid Firmware Upload — to comply with regulatory amendments… uncertified third party firmware."*
Recovery mode performs no signature check.

## Entering recovery mode
1. Power the router **off**.
2. Unplug the DC jack. Hold **Reset** with a paperclip.
3. Plug the DC jack back in **while still holding Reset**.
4. Keep holding until the **leftmost LED starts blinking slowly** (about 5-10 s), then let go.
   That blink is the only reliable sign you are in recovery mode.
5. The CFE bootloader now waits at **192.168.1.1**.
6. Upload the image (ASUS utility or TFTP, below), wait for the reboot, and it comes up as OpenWrt.

**Unplug it from the rest of the LAN while you do this.** In recovery mode the box takes
`192.168.1.1`, which is also the usual upstream gateway, and it re-initialises its switch. If it is
still cabled to the main network, clients see an address conflict and the whole LAN can drop for
the duration of the flash. Connect the PC directly to one of its LAN ports, flash, then plug it back
in. That is why flashing "takes down the network" even though it is only sitting on ports 1-4.

## From Windows — ASUS Firmware Restoration
Download it from the ASUS support page for the RT-AC3200
(<https://www.asus.com/us/supportonly/rt-ac3200/helpdesk_download/> → *Driver & Utility*).
Set the PC to static **192.168.1.10 / 255.255.255.0 / gateway 192.168.1.1**, cable into a **LAN** port,
run the utility, pick the `.trx`, Upload. It finds the router on 192.168.1.1, the router reboots
once, and the image is written. Takes a few minutes.

## From Linux/macOS — TFTP
```sh
ip addr add 192.168.1.10/24 dev eth0      # your wired NIC, adjust the name
curl -T openwrt-bcm53xx-generic-asus_rt-ac3200-squashfs.trx tftp://192.168.1.1/
# or:  tftp 192.168.1.1   →  binary  →  put <file>  →  quit
```

## Verify the download first
```sh
sha256sum openwrt-bcm53xx-generic-asus_rt-ac3200-squashfs.trx
# must match the value in SHA256SUMS of the same release
```

## After the first boot
* LuCI: <http://192.168.1.200> (or the address printed by `ip -4 addr` on the LAN)
* SSH: `ssh root@192.168.1.200` — password `ac3200-admin` (change it: `passwd`)
* AdGuard Home: <http://192.168.1.200:3000> — `admin` / `ac3200-admin`
* Wi-Fi: `AC3200-5G` / `AC3200-2G`, WPA2, password `ac3200-change-me-now`

## Going back to ASUS firmware
Same recovery procedure with `RT-AC3200_384.13_10.trx` (Asuswrt-Merlin 384.13_10, the last build
ASUS/Merlin ever made for this model). Keep it — it is the guaranteed revert path.

## Things not to do
* **Never** 30-30-30 a Broadcom ARM router.
* Do not interrupt power during the write; if the router seems dead afterwards, it is almost always
  still in recovery mode — re-enter it and flash again.
* Keep a NVRAM backup if you ever go back to stock: Merlin → *Tools → NVRAM Backup*.
