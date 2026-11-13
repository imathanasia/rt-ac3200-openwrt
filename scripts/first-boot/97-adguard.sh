#!/bin/sh
# Make sure the pre-seeded AdGuard Home config is usable by the AdGuard user.
# The yaml itself ships in /etc/adguardhome/adguardhome.yaml (generated on a real
# unit, so the schema version matches the binary).  It binds the DNS server to
# 127.0.0.1:5353; dnsmasq keeps :53 and forwards to it (see 98-ap-mode.sh),
# so LAN clients get filtered DNS and dnsmasq falls back to the upstream
# resolver if AdGuard is ever down.

mkdir -p /etc/adguardhome /var/lib/adguardhome
chown -R adguardhome:adguardhome /etc/adguardhome /var/lib/adguardhome 2>/dev/null
chmod 700 /etc/adguardhome
chmod 600 /etc/adguardhome/adguardhome.yaml 2>/dev/null

# /etc/init.d/adguardhome must not wipe a valid config
grep -q 'CONFIG_ADGUARDHOME' /etc/init.d/adguardhome 2>/dev/null ||
	sed -i 's|^config_file=.*|config_file=/etc/adguardhome/adguardhome.yaml|' /etc/init.d/adguardhome 2>/dev/null
