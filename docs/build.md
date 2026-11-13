# Building this image

## Host
Debian 12 / Ubuntu 22.04+ with: `build-essential flex bison g++ gawk gettext rsync swig unzip
zlib1g-dev libncurses-dev libssl-dev python3-setuptools file wget libelf-dev`.
Running as root requires `FORCE_UNSAFE_CONFIGURE=1`.
`libc6-i386` / `libstdc++6:i386` are *not* needed for OpenWrt (they were only for the D-Link SDK).

## Tree
```sh
git clone https://git.openwrt.org/openwrt/openwrt.git -b openwrt-25.12
cd openwrt
./scripts/feeds update -a
./scripts/feeds install -a
```

## Config
Start from **target bcm53xx / subtarget generic / device asus_rt-ac3200**, then select:

```
# core
luci luci-ssl luci-app-firewall luci-app-nftables luci-app-opkg luci-app-package-manager
# VPN / remote
tailscale luci-app-tailscale-community kmod-wireguard wireguard-tools luci-proto-wireguard
openvpn-openssl luci-app-openvpn ocserv luci-app-ocserv
ddns-scripts luci-app-ddns luci-app-acme
# QoS
sqm-scripts luci-app-sqm
# DNS / adblock
adguardhome luci-app-adguardhome adblock-fast luci-app-adblock-fast
smartdns luci-app-smartdns luci-app-nextdns luci-app-cloudflared luci-app-https-dns-proxy
# stats / UI
luci-app-statistics collectd-mod-disk collectd-mod-sensors collectd-mod-processes
luci-app-nlbwmon luci-app-vnstat2 luci-app-wifihistory luci-app-ttyd luci-app-librespeed
speedtest-go
# storage / SMB / USB
kmod-usb-storage block-mount luci-app-diskman kmod-fs-ext4 kmod-fs-ntfs3 kmod-fs-exfat
ksmbd-server luci-app-ksmbd smartmontools luci-app-hddinfo hddidle
# SIM / LTE
kmod-usb-net-cdc-mbim kmod-usb-serial-option usb-modeswitch
# reliability / control
banip luci-app-banip watchcat luci-app-watchcat luci-app-wifischedule lldpd luci-app-lldpd
mwan3 luci-app-mwan3 pbr luci-app-pbr ip-full luci-app-email luci-app-udpxy udpxy
luci-app-wol luci-app-upnp luci-app-commands
# extras
mosquitto-ssl luci-app-mosquitto ustreamer luci-app-ustreamer nut luci-app-nut
dump1090 luci-app-dump1090 htop curl wget-ssl ca-bundle ntp-client pppoe-full
```

Two traps that cost build cycles:
* **`ip-full` vs `ip-tiny`** — `pbr` needs `ip-full`; do not also select `ip-tiny`.
* **`snmpd-ssl` vs `snmpd-nossl`** — both provide the virtual `snmpd`; selecting a variant *and*
  `luci-app-snmpd` pulls the other one → apk conflict. (SNMP is left out of the shipped build.)

## Baked first-boot config
`files/` in the tree root is copied into the rootfs:

| repo file | target path | purpose |
|---|---|---|
| `scripts/first-boot/99-wifi.sh` | `/etc/uci-defaults/99-wifi.sh` | SSIDs, channels, country |
| `scripts/first-boot/98-ap-mode.sh` | `/etc/uci-defaults/98-ap-mode.sh` | LAN 192.168.1.200, gateway, DHCP off, DNS chain |
| `scripts/first-boot/97-adguard.sh` | `/etc/uci-defaults/97-adguard.sh` | fix AdGuard ownership |
| `scripts/first-boot/96-rootpass.sh` | `/etc/uci-defaults/96-rootpass.sh` | root password |
| `scripts/first-boot/adguardhome.yaml` | `/etc/adguardhome/adguardhome.yaml` | pre-configured AdGuard |
| `scripts/first-boot/luci_statistics` | `/etc/config/luci_statistics` | collectd graphs |
| `scripts/first-boot/tailscale` | `/etc/config/tailscale` | tailscaled (nftables) |
| `scripts/first-boot/fstab` | `/etc/config/fstab` | USB automount |
| `scripts/first-boot/logd` | `/etc/config/logd` | 256 KB log cap (RAM) |
| `scripts/first-boot/usb-overlay.sh` | `/root/usb-overlay.sh` | one-command extroot |
| `router-page/rtac3200.html` | `/www/rtac3200.html` | in-router project page |
| `package/rtac3200-ledchase/` | `/usr/bin/ledchase` | LED sweep helper (built from source) |

## Host quirk: tar ownership
If the build host's filesystem refuses `chown` to foreign uids (some VMs answer `EINVAL`), unpacking
tarballs owned by other uids fails with *"Cannot change ownership … Invalid argument"*. Fix in
`include/unpack.mk`:
```make
TAR_CMD=$(HOST_TAR) -C $(1)/.. --no-same-owner $(TAR_OPTIONS)
```
(The env var `TAR_OPTIONS` is unexported by the top-level makefile, so the patch is the reliable way.)

## Build & verify
```sh
make -j$(nproc) V=s
# artifact: bin/targets/bcm53xx/generic/openwrt-bcm53xx-generic-asus_rt-ac3200-squashfs.trx
python3 - <<'PY'
d=open('bin/targets/bcm53xx/generic/openwrt-bcm53xx-generic-asus_rt-ac3200-squashfs.trx','rb').read()
print('size', len(d), 'productid', d[-64:][:16])   # must contain b'RT-AC3200'
PY
```
Extract `root.squashfs` from `build_dir/target-*/linux-bcm53xx_generic/` with
`staging_dir/host/bin/unsquashfs4` to confirm the baked files are inside the image.
