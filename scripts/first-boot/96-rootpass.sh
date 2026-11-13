#!/bin/sh
# Set the root password for this pre-built image.
#
# This image is meant for a home/AP setup, so an empty root password is a hole
# on the LAN.  Credentials for this build:
#
#     root / ac3200-admin        (SSH + LuCI)
#     AdGuard Home admin / ac3200-admin   (http://<router>:3000)
#
# Change them (root password):      passwd
#                    (AdGuard):     Services -> AdGuard Home -> Settings
HASH='$6$HPnHJKmR50xfka4/$MJBYnrCx4b23cGQ2BMpd1lePXvYbi5BveKQ46TtkDKODyW.3SzN1/UsZhqrRRYlbd/T9L5Q1p8U01pfUR6YXv.'

if [ -f /etc/shadow ]; then
	sed -i "s|^root:[^:]*:|root:${HASH}:|" /etc/shadow
fi

logger -t ac3200-image "root password set to 'ac3200-admin' - change it with 'passwd'"
