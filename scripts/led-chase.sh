#!/bin/sh
# Proof-of-concept LED chase for the RT-AC3200 (BCM4709A0).
# This board has exactly three controllable lamps:
#   white:power, white:wps, red:wan
# Writes sysfs only; /etc/init.d/led restart restores the configured state.
# BusyBox sleep here has no fractional seconds, so steps are 1 s.
L="white:power white:wps red:wan"

for l in $L; do echo none > /sys/class/leds/$l/trigger 2>/dev/null; done
off() { for l in $L; do echo 0 > /sys/class/leds/$l/brightness; done; }
on()  { echo 1 > /sys/class/leds/$l/brightness; }

for l in $L; do on $l; done; sleep 1; off

i=0
while [ $i -lt 4 ]; do
	for l in white:power white:wps red:wan white:wps; do
		off; on $l; sleep 1
	done
	i=$((i + 1))
done

i=0
while [ $i -lt 3 ]; do
	for l in $L; do on $l; done; sleep 1
	off; sleep 1
	i=$((i + 1))
done

on white:power
/etc/init.d/led restart >/dev/null 2>&1
