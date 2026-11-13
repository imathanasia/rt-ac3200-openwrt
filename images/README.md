# Screenshots

Captured from a running RT-AC3200 with headless Chromium (1440×900 viewport, 2× device scale → 2880×1800).

| File | Page |
|---|---|
| `luci-login.png` | LuCI login |
| `luci-overview.png` | Status → Overview |
| `luci-statistics.png` | Statistics → Graphs (collectd/RRD) |
| `luci-nlbwmon.png` | Statistics → nlbwmon (per-device traffic) |
| `luci-vnstat2.png` | Statistics → vnstat2 (totals) |
| `luci-wireless.png` | Network → Wireless (3 radios) |
| `luci-sqm.png` | Services → SQM (cake) |
| `luci-tailscale.png` | Services → Tailscale |
| `router-page.png` | the baked `/rtac3200.html` project page |
| `adguard-login.png`, `adguard.png` | AdGuard Home UI |

Re-capture after a firmware change:
```sh
# needs node + playwright + chromium
node shoot.js http://192.168.1.200
```
