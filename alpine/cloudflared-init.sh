#!/sbin/openrc-run

name="cloudflared"
description="Cloudflare Tunnel daemon"
command="/usr/local/bin/cloudflared"
command_args="tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}"
command_user="cloudflared:cloudflared"
command_background="yes"
pidfile="/run/${RC_SVCNAME}.pid"

depend() {
    need net
    after firewall
}

start_pre() {
    if [ -z "${CLOUDFLARE_TUNNEL_TOKEN}" ]; then
        eerror "CLOUDFLARE_TUNNEL_TOKEN is not set"
        eerror "Set it in /etc/conf.d/cloudflared"
        return 1
    fi
    checkpath --directory --owner cloudflared:cloudflared --mode 0755 /run/cloudflared
}