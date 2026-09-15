/* Zero-dependency dev server with live reload.
   Run:  node dev-server.js      →  http://localhost:3000
   Any save to a file in this folder instantly repaints the open browser tab:
   CSS is hot-swapped in place (no flash), HTML/JS trigger a reload. */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

/* every non-internal IPv4 address this machine has, so teammates get a URL */
function lanAddresses(){
  const out = [];
  for (const list of Object.values(os.networkInterfaces())){
    for (const net of list || []){
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';   // 0.0.0.0 = also reachable on the LAN

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const clients = new Set();

const LIVE_RELOAD = `
<script>
(function(){
  var es = new EventSource('/__live');
  es.onmessage = function(e){
    if (e.data.endsWith('.css')) {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function(l){
        if (!l.href.includes('fonts.googleapis')) {
          var u = new URL(l.href);
          u.searchParams.set('v', Date.now());
          l.href = u.href;
        }
      });
      console.log('[live] css hot-swapped');
    } else {
      location.reload();
    }
  };
  es.onerror = function(){ setTimeout(function(){ location.reload(); }, 1200); };
})();
</script>`;

http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/__live') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 500\n\n');
    clients.add(res);
    const cleanup = () => clients.delete(res);
    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
    return;
  }

  let file = path.join(ROOT, decodeURIComponent(url === '/' ? '/index.html' : url));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  fs.stat(file, (err, st) => {
    if (err || st.isDirectory()) {
      if (!err && st.isDirectory()) file = path.join(file, 'index.html');
      else { res.writeHead(404, { 'Content-Type': 'text/html' }).end('<h1>404</h1>' + LIVE_RELOAD); return; }
    }
    fs.readFile(file, (e, buf) => {
      if (e) { res.writeHead(404, { 'Content-Type': 'text/html' }).end('<h1>404</h1>' + LIVE_RELOAD); return; }
      const ext = path.extname(file).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
      if (ext === '.html') {
        res.writeHead(200, headers).end(buf.toString('utf8').replace('</body>', LIVE_RELOAD + '\n</body>'));
      } else {
        res.writeHead(200, headers).end(buf);
      }
    });
  });
}).listen(PORT, HOST, () => {
  const ips = lanAddresses();
  console.log('');
  console.log('  Realcognita - General Assembly 2026');
  console.log('  ' + '-'.repeat(50));
  console.log(`  Local      http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  Network    http://${ip}:${PORT}`);
  if (!ips.length) console.log('  Network    (no LAN interface found)');
  console.log('');
  console.log('  Presentation   add  #preview  to any URL above');
  console.log('  Live reload    on - edit a file and every open tab updates');
  console.log('');
  if (ips.length){
    console.log('  Share a Network URL with teammates on the same Wi-Fi.');
    console.log('  Blocked for them? See SHARING.md (Windows firewall rule).');
    console.log('');
  }
});

/* --- watcher (debounced) --- */
let timer = null;
let pending = '';
fs.watch(ROOT, { recursive: true }, (evt, filename) => {
  if (!filename) return;
  const f = filename.replace(/\\/g, '/');
  if (f.includes('node_modules') || f.startsWith('.git') || f.endsWith('~') || f.includes('dev-server.js')) return;
  pending = f;
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('  ↻ changed:', pending);
    for (const c of Array.from(clients)) {
      try {
        c.write(`data: ${pending}\n\n`);
      } catch (_) {
        clients.delete(c);
      }
    }
  }, 90);
});

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'EPIPE' || err.code === 'ECONNRESET')) return;
  console.error('Server error:', err);
});
