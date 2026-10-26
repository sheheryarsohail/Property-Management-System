#!/bin/bash
set -e

echo "========================================================================"
echo "☕ Disabling Automatic Sleep, Suspend, and Hibernation (24/7 Server)"
echo "========================================================================"

# 1. Mask systemd sleep, suspend, and hibernate targets system-wide
echo "🛡️ 1. Masking systemd sleep and suspend targets..."
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# 2. Disable GNOME Desktop Power Manager auto-sleep (if GUI session active)
echo "🖥️ 2. Disabling desktop idle suspend via gsettings..."
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing' 2>/dev/null || true
gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null || true

# 3. Prevent sleep from lid switch or power buttons in logind.conf
echo "⚙️ 3. Configuring /etc/systemd/logind.conf to ignore suspend events..."
LOGIND_CONF="/etc/systemd/logind.conf"
if [ -f "$LOGIND_CONF" ]; then
  sudo sed -i 's/^#*HandleSuspendKey=.*/HandleSuspendKey=ignore/' "$LOGIND_CONF"
  sudo sed -i 's/^#*HandleHibernateKey=.*/HandleHibernateKey=ignore/' "$LOGIND_CONF"
  sudo sed -i 's/^#*HandleLidSwitch=.*/HandleLidSwitch=ignore/' "$LOGIND_CONF"
  sudo sed -i 's/^#*HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' "$LOGIND_CONF"
fi

echo "========================================================================"
echo "🎉 SUCCESS: Automatic sleep and suspend are permanently disabled!"
echo "Your server will now run 24/7 without going to sleep or stopping apps."
echo "========================================================================"
