# Discoveries

OpenWrt 25.12 brought back to the ASUS RT-AC3200 (BCM4709A0 + 3× BCM4360),
documented as a homelab build with a router project page.

## Hardware and flash

- RT-AC3200 is `bcm53xx/generic`, `asus_rt-ac3200`; artifacts are TRX images flashed via ASUS recovery mode or `curl -T firmware.trx tftp://192.168.1.1/`.
- Recovery mode: power off, hold **Reset**, power on, release when the Power LED blinks slowly; set PC to `192.168.1.10/24` and use ASUS Firmware Restoration or TFTP.
- Never 30-30-30 on this board.
- No sysupgrade image path for this board in the shipped build flow; updates are recovery flashes of `.trx`.

## Radios and Wi-Fi

- Three radios (2.4G + 5G + 5G-2) are disabled by default in this build; enable on demand with `wifi-radio on/off/status`.
- AP mode is preconfigured for LAN `192.168.1.200` with DHCP off.

## Services and storage

- AdGuard Home, Tailscale, WireGuard, SQM, and other optional services are preconfigured or installable; opt-in services stay off until installed/enabled.
- USB storage and extroot helper are provided (`/root/usb-overlay.sh`) for larger overlays and service data.

## UI and project page

- The router project page is served through LuCI (`/cgi-bin/luci/admin/services/rtac3200`) so it requires authentication and does not leak status from a public `/www` route.
- Footer badge patch and branding helper keep the project identity consistent across themes and shell/ubus banners.

## Limitations

- No hardware NAT offload on this platform.
- Some features depend on optional packages and USB storage for persistence/performance.
