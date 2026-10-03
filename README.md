# DHCP Automation Pro

Cisco DHCP automation workspace with DHCP Generator, Subnet Calculator, traffic/UIh log tools, System Owner Finder, VOIP Finder, and Operations Messages.

## Live Production

**Current production:** [Open DHCP Automation Pro](https://dhcp-automation-pro.vercel.app/?v=f5a3619)

**Latest deployment:** [dhcp-automation-u7w7zqsvw-riptwosec.vercel.app](https://dhcp-automation-u7w7zqsvw-riptwosec.vercel.app/)

**Current production commit:** `f5a3619061e64ed7e0f8f85244b641cd69cf9bab` — `ui: apply Business Hours v1`

The canonical URL remains `https://dhcp-automation-pro.vercel.app/` and always points to the current Vercel Production deployment. The `?v=f5a3619` suffix above is only a visible version/cache-busting marker for the current build.

## Current UI features

- Same-page Utility menu: System Owner Finder, VOIP Finder, Operations Messages
- Responsive Fit v1 for mobile, tablet, laptop, desktop, landscape, and ultrawide
- Operations Messages with live copy actions
- Business Hours v1 for the “ไม่สามารถติดต่อเจ้าหน้าที่ได้” message
  - Weekdays before 08:30 → 08:30 same day
  - Monday–Thursday from 18:00 → next business day 08:30
  - Friday from 18:00 and weekends → Monday 08:30
