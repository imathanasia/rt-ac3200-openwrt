# What this router can do now

Written for the ASUS RT-AC3200 with this build (OpenWrt 25.12, kernel 6.12). Project and packaging by **ImAthanasia**.

The scenarios come first because that is what people actually look for. The full feature table is below it.

## Practical scenarios

**"My smart TV and phones get ads"** → point the LAN DNS at the router; AdGuard Home strips them at
the resolver. No app installs, nothing to configure per device.

**"I want my NAS from a hotel"** → `tailscale up --advertise-routes=192.168.1.0/24`; install Tailscale
on the laptop, reach `192.168.1.x` directly. No port forwarding, no DDNS, no exposed services.

**"The cable line died"** → plug the phone in, enable USB tethering, and the router keeps the LAN
online through the phone (or mwan3 fails over automatically).

**"Sharing files with the family"** → USB SSD in the 3.0 port, extroot it, share over SMB and DLNA.
Apps live on the disk, NAND is left alone.

**"Bufferbloat makes calls stutter"** → SQM/cake at your line rate; bufferbloat score drops and
latency stays flat while someone downloads.

**"Who is eating the uplink?"** → nlbwmon's per-device table, then vnstat2 for the monthly total.

**"Add a guest network"** → second SSID, isolated zone (one page in LuCI), with AdGuard filtering it
too.

## The full list: before and after

Every feature in this build, next to what the last ASUS firmware (384.13_10, Linux 2.6.36) could do.

| # | Job | Before (ASUS 384.13_10) | Now |
|---|---|---|---|
| 1 | **Ad and tracker blocking for every device** | none | AdGuard Home with per-device stats, DoH upstream, 190k+ rules; dnsmasq falls back to the upstream resolver if it is down |
| 2 | **Reach the home LAN from anywhere** | port forwards / ASUS DDNS only | Tailscale subnet router (whole `192.168.1.0/24`), no ports opened |
| 3 | **VPN for family devices** | PPTP/OpenVPN from 2016 | WireGuard (kernel), OpenVPN 2.7, and ocserv for AnyConnect clients |
| 4 | **USB disk as a share** | Samba 3.x, NTFS via Tuxera | ksmbd (SMB3) + DLNA (minidlna) + SMART, and extroot to run apps off the disk |
| 5 | **USB printer on the network** | ASUS print server, 2.6 kernel | p910nd (raw), works with modern drivers |
| 6 | **Serial device over the network** | no | ser2net (UPS, Arduino, another router's console) |
| 7 | **Share a USB device with a PC** | no | usbip (server + client) |
| 8 | **4G/5G backup WAN** | USB modem only | any Android phone over USB tethering (tested: `usb0` → 10.172.x, 24 ms), plus mwan3 failover |
| 9 | **See who uses the bandwidth** | per-interface counters | nlbwmon per device, vnstat2 daily/monthly, collectd graphs (CPU, RAM, temp, radios) |
| 10 | **Keep latency sane on a loaded line** | ASUS "QoS" presets | SQM with cake, per-direction shaping |
| 11 | **Band steering between 2.4 and 5 GHz** | ASUS Smart Connect (closed) | usteer |
| 12 | **Use it as a Wi-Fi repeater/client** | WISP mode, limited | travelmate (multi-profile STA + AP) |
| 13 | **IPTV multicast** | limited | udpxy |
| 14 | **Block abusive sources / countries** | no | banip (nftables sets) |
| 15 | **Monitoring hooks** | none | lldpd neighbours, SNMP, e-mail notifications, MQTT broker, Prometheus exporter |
| 16 | **Fun hardware** | none | dump1090 on a USB SDR, ustreamer for a USB camera, NUT for a UPS |
| 17 | **Software updates** | last build 2020 | Attended Sysupgrade (one click) + package manager in the GUI |
| 18 | **Modern TLS everywhere** | OpenSSL 1.0.1-era | OpenSSL 3.x, current CA bundle |

---

**Contents:** [Practical scenarios](#practical-scenarios) · [The full list: before and after](#the-full-list-before-and-after)
