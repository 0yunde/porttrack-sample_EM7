#!/usr/bin/env bash
set -e
# create systemd unit
cat >/etc/systemd/system/porttrack.service <<'UNIT'
[Unit]
Description=PortTrack Sample App
After=network.target

[Service]
WorkingDirectory=/opt/porttrack/app/app
ExecStart=/usr/bin/node server.js
Restart=always
EnvironmentFile=-/opt/porttrack/app/app/.env
# Example: Environment=DB_SECRET_ARN=arn:aws:secretsmanager:REGION:ACCT:secret:/porttrack/${ENV}/db

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable porttrack
systemctl restart porttrack
