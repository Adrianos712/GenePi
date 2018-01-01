#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

genepi_dir=/opt/genepi/
apikey_file=${genepi_dir}apikey
install_path=$(dirname $0)/
exit 0


echo Installing genepi to $install_path
rm -r $genepi_dir
mkdir -p $genepi_dir
cp -a $install_path $genepi_dir


echo Generating apikey
cat /proc/sys/kernel/random/uuid > $apikey_file
chmod 400 $apikey_file


#TODO: user add genepi + group gpio


echo Installing systemd unit file
cat > /etc/systemd/system/genepi.service <<EOF
[Unit]
Description=Home automation GenePi Daemon
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/genepi/genepi-daemon.js -l 4
WorkingDirectory=$genepi_dir
Restart=always
# Restart service after 10 seconds if node service crashes
#RestartSec=10
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=genepi
User=pi
Group=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo Configuring rsyslog
cat > /etc/rsyslog.d/genepi.conf <<EOF
if $programname == 'genepi' then /var/log/genepi.log
if $programname == 'genepi' then ~
EOF

# tester si utile
#cat >/etc/udev/rules.d/20-gpiomem.rules <<EOF
#SUBSYSTEM=="bcm2835-gpiomem", KERNEL=="gpiomem", GROUP="gpio", MODE="0660"
#EOF

echo Enabling deamon
systemctl enable genepi
systemctl start genepi

echo Install complete

