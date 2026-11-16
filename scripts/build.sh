#!/bin/sh
# Rebuild the RT-AC3200 OpenWrt image from an existing OpenWrt tree.
# usage: TREE=/path/to/openwrt [CFG=/path/to/config] scripts/build.sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TREE=${TREE:-$HERE/../openwrt}
CFG=${CFG:-$HERE/config/config.ac3200}

if [ ! -d "$TREE/.git" ]; then
	echo "OpenWrt tree not found at $TREE" >&2
	exit 1
fi
cd "$TREE"

cp "$CFG" .config
FORCE_UNSAFE_CONFIGURE=1 make defconfig
FORCE_UNSAFE_CONFIGURE=1 make -j"$(nproc)"

ls -l bin/targets/bcm53xx/generic/openwrt-bcm53xx-generic-asus_rt-ac3200*-squashfs.trx
sha256sum bin/targets/bcm53xx/generic/openwrt-bcm53xx-generic-asus_rt-ac3200*-squashfs.trx
