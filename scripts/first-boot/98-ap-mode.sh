#!/bin/sh
# AP-mode defaults for this image (this box sits behind a cable modem / main
# router at 192.168.1.1).
#
#   LAN  : static 192.168.1.200/24, gateway+DNS 192.168.1.1
#   DHCP : disabled here, the upstream router keeps serving addresses
#   DNS  : dnsmasq(:53) -> AdGuard Home(127.0.0.1#5353) -> 192.168.1.1
#
# To turn it into a standalone router later:
#   uci set network.lan.proto='dhcp'; uci delete network.lan.gateway
#   uci delete network.lan.dns; uci set dhcp.lan.ignore='0'
#   uci commit network; uci commit dhcp; /etc/init.d/network restart
#
# To move it to a different upstream: replace 192.168.1.1 below and in
# /etc/adguardhome/adguardhome.yaml (upstream_dns / bootstrap_dns).

LAN_IP="192.168.1.200"
LAN_CIDR="192.168.1.200/24"
UPSTREAM="192.168.1.1"

uci -q set network.lan.proto='static'
uci -q set network.lan.ipaddr="$LAN_CIDR"
uci -q set network.lan.gateway="$UPSTREAM"
uci -q set network.lan.dns="$UPSTREAM"

# no DHCP server here - the upstream router owns it
uci -q set dhcp.lan.ignore='1'

# dnsmasq forwards to AdGuard Home first, falls back to the upstream router
uci -q delete dhcp.@dnsmasq[0].server
uci -q add_list dhcp.@dnsmasq[0].server='127.0.0.1#5353'
uci -q add_list dhcp.@dnsmasq[0].server="$UPSTREAM"

# keep the box's own DNS going through AdGuard too
uci -q set dhcp.@dnsmasq[0].noresolv='1'

uci commit network
uci commit dhcp

logger -t ac3200-image "AP mode: LAN $LAN_IP, gateway $UPSTREAM, DHCP off, DNS via AdGuard"
