#!/bin/bash

# tester si utile
cat >/etc/udev/rules.d/20-gpiomem.rules <<EOF
SUBSYSTEM=="bcm2835-gpiomem", KERNEL=="gpiomem", GROUP="gpio", MODE="0660"
EOF

#TODO: user add genepi + group gpio
# syslog.d conf
# systemd unit
