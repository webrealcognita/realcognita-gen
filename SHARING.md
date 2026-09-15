# Sharing the presentation with teammates

## Start the server

```
node dev-server.js
```

It prints both URLs. To use a different port:

```
PORT=8080 node dev-server.js
```

## The two URLs

| | URL | Who it's for |
|---|---|---|
| **Local** | `http://localhost:5173` | Only this computer |
| **Network** | `http://10.19.26.107:5173` | Anyone on the same Wi-Fi / office LAN |

Add `#preview` to either one to skip the countdown and go straight into the
presentation deck:

```
http://10.19.26.107:5173/#preview
```

Send teammates the **Network** URL.

## If a teammate can't open it

**1. Same network?** They must be on the same Wi-Fi or office LAN. This is a
local server — it is not on the public internet, so it will not work from home
or over mobile data.

**2. Windows Firewall.** The first time Node accepts an outside connection,
Windows may silently block it. This machine is on the corporate network
`realcognita.net`, which Windows classifies as a **Domain** network — so the
rule has to target the Domain profile. Run once from an **Administrator**
PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Realcognita GA deck" `
  -Direction Inbound -Protocol TCP -LocalPort 5173 `
  -Action Allow -Profile Domain,Private
```

No such rule exists yet, so if teammates get a timeout this is the likely
cause. Corporate policy may also block adding rules — if the command is
refused, ask IT, or use the tunnel option at the bottom of this file.

To remove it later:

```powershell
Remove-NetFirewallRule -DisplayName "Realcognita GA deck"
```

**3. IP changed.** The address `10.19.26.107` is assigned by your network and
can change when you reconnect or move between offices. Restart the server and
read the new Network line from its banner.

## Notes

- **Live reload is on for everyone.** When you save a file, every open tab —
  yours and your teammates' — updates instantly. Useful during review, so be
  aware they see edits as you make them.
- **Presenter controls:** `←` `→` or `Space` to advance, `F` fullscreen,
  `P` autoplay, `Home` / `End`, mouse wheel, swipe on touch, or the dots on
  the right.
- **Stop the server** with `Ctrl+C` in its terminal.

## Sharing beyond the office network

The dev server is for local use only. To send a link to someone off-network,
either:

- Run a tunnel (e.g. `npx localtunnel --port 5173`), which gives a temporary
  public URL — fine for a quick review, not for the live event; or
- Host the folder as a static site. It is plain HTML/CSS/JS with no build step,
  so any static host works — upload `index.html`, `style.css`, `script.js` and
  the `assets/` folder as they are.

For the event itself, run it locally on the presenting machine. Nothing
depends on the network except the Google Fonts stylesheet, and the page falls
back to system fonts without it.
