#!/bin/sh
# First-boot Wi-Fi for ASUS RT-AC3200 (brcmfmac, 3x BCM43602).
#
# The bcm53xx image already ships /etc/config/wireless with radio0/1/2 and
# disabled "default_radioN" ifaces (ssid=OpenWrt).  This script rewrites those
# only if they are still untouched, so it is safe to leave in /etc/uci-defaults.
#
# Hardware reality on this board (OpenWrt brcmfmac, no vendor CLM blob):
#   radio0 = 5 GHz, radio1 = 2.4 GHz, radio2 = 5 GHz
# Only UNII-1 (36-48) is usable, so keep ONE 5 GHz radio at 80 MHz;
# the second 5 GHz radio stays disabled (no non-overlapping channel available).

uci -q get wireless >/dev/null 2>&1 || exit 0

SSID_24="AC3200-2G"
SSID_5A="AC3200-5G"
PASS="ac3200-change-me-now"

set_radio() { # $1=radio $2=ssid $3=channel $4=htmode
	uci -q set wireless.$1.country='PL'
	uci -q set wireless.$1.channel="$3"
	uci -q set wireless.$1.htmode="$4"
	uci -q set wireless.default_$1.ssid="$2"
	uci -q set wireless.default_$1.encryption='psk2'
	uci -q set wireless.default_$1.key="$PASS"
	uci -q set wireless.default_$1.disabled='0'
}

for dev in radio0 radio1 radio2; do
	uci -q get wireless.$dev >/dev/null 2>&1 || continue
	ssid=$(uci -q get wireless.default_$dev.ssid)
	# only touch the stock default SSID (or an unset one)
	[ "$ssid" = "OpenWrt" ] || [ -z "$ssid" ] || continue
	band=$(uci -q get wireless.$dev.band)
	case "$dev:$band" in
		radio1:2g) set_radio "$dev" "$SSID_24" 1 HT20 ;;
		radio0:5g) set_radio "$dev" "$SSID_5A" 36 VHT80 ;;
		*)         uci -q set wireless.default_$dev.disabled='1' ;;
	esac
done

uci -q commit wireless
