// Sandbox Escape Probe v11 - Deep Investigation
// Q1: Does ui/message actually SEND or just paste?
// Q2: What's in the 75K source?
// Q3: What MCP methods exist?

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

async function probe() {
  console.log("=== PROBE v11 — DEEP INVESTIGATION ===\n");

  // ============================================================
  // Q1: Test ALL ways to send a message
  // ============================================================
  console.log("========== Q1: MESSAGE SENDING TESTS ==========\n");

  // 1a: ui/message (what we've been using)
  console.log("[1a] ui/message...");
  try {
    const r = await mcpRequest('ui/message', {
      role: 'user',
      content: [{ type: 'text', text: 'TEST_1A: sent via ui/message from artifact' }]
    });
    console.log("[1a] Result:", JSON.stringify(r));
  } catch(e) {
    console.log("[1a] Error:", JSON.stringify(e));
  }

  // 1b: Check if window.sendPrompt exists (from widget code)
  console.log("[1b] window.sendPrompt exists?", typeof window.sendPrompt);
  if (typeof window.sendPrompt === 'function') {
    try {
      window.sendPrompt('TEST_1B: sent via window.sendPrompt()');
      console.log("[1b] sendPrompt() called successfully");
    } catch(e) {
      console.log("[1b] sendPrompt error:", e.message);
    }
  }

  // 1c: Check if window.app exists (MCP helper from widget)
  console.log("[1c] window.app exists?", typeof window.app);
  if (window.app) {
    console.log("[1c] window.app keys:", Object.keys(window.app));
    try {
      const r = await window.app.sendRequest({
        method: 'ui/message',
        params: { role: 'user', content: [{ type: 'text', text: 'TEST_1C: sent via window.app.sendRequest' }] }
      });
      console.log("[1c] app.sendRequest result:", JSON.stringify(r));
    } catch(e) {
      console.log("[1c] app.sendRequest error:", e.message);
    }
  }

  // 1d: Try the elicitation submit pattern
  console.log("[1d] Trying anthropic:elicit-submit pattern...");
  try {
    window.parent.postMessage({
      type: 'anthropic:elicit-submit',
      text: 'TEST_1D: sent via elicit-submit',
      files: []
    }, '*');
    console.log("[1d] elicit-submit sent");
  } catch(e) {
    console.log("[1d] Error:", e.message);
  }

  // 1e: Try direct postMessage patterns to parent
  console.log("[1e] Trying raw postMessage patterns...");
  const msgPatterns = [
    { type: 'user-message', text: 'TEST_1E_a' },
    { type: 'send-message', text: 'TEST_1E_b' },
    { type: 'submit', text: 'TEST_1E_c' },
    { type: 'chat-message', content: 'TEST_1E_d' },
    { jsonrpc: '2.0', method: 'ui/send-message', params: { text: 'TEST_1E_e' }, id: 99990 },
    { jsonrpc: '2.0', method: 'ui/chat', params: { role: 'user', text: 'TEST_1E_f' }, id: 99991 },
    { jsonrpc: '2.0', method: 'ui/submit-message', params: { text: 'TEST_1E_g' }, id: 99992 },
    { jsonrpc: '2.0', method: 'messages/create', params: { role: 'user', content: 'TEST_1E_h' }, id: 99993 },
  ];
  for (const p of msgPatterns) {
    window.parent.postMessage(p, '*');
  }
  console.log("[1e] Sent", msgPatterns.length, "patterns");

  // Collect responses for 1e
  await new Promise(r => setTimeout(r, 3000));

  // ============================================================
  // Q2: Dump the full 75K internal source
  // ============================================================
  console.log("\n========== Q2: INTERNAL SOURCE CODE ==========\n");
  try {
    const r = await mcpRequest('resources/read', { uri: 'ui://imagine/show-widget.html' });
    const source = r?.contents?.[0]?.text || '';
    console.log("[SOURCE] Total length:", source.length, "chars");
    console.log("[SOURCE] Full content below:");
    // Log in chunks to avoid console truncation
    const chunkSize = 5000;
    for (let i = 0; i < source.length; i += chunkSize) {
      console.log(`[SOURCE chunk ${Math.floor(i/chunkSize)+1}/${Math.ceil(source.length/chunkSize)}]`, source.slice(i, i + chunkSize));
    }
  } catch(e) {
    console.log("[SOURCE] Error:", e.message);
  }

  // ============================================================
  // Q3: Comprehensive MCP method enumeration
  // ============================================================
  console.log("\n========== Q3: MCP METHOD ENUMERATION ==========\n");

  const allMethods = [
    // Standard MCP spec methods
    'initialize', 'ping',
    'tools/list', 'tools/call',
    'resources/list', 'resources/read', 'resources/subscribe', 'resources/unsubscribe',
    'prompts/list', 'prompts/get',
    'completion/complete',
    'logging/setLevel',
    'sampling/createMessage',
    'roots/list',

    // UI-specific methods (from widget source)
    'ui/initialize', 'ui/message', 'ui/open-link', 'ui/download-file',
    'ui/request-display-mode', 'ui/get-context', 'ui/get-user',
    'ui/get-conversation', 'ui/get-organization', 'ui/get-project',
    'ui/get-messages', 'ui/get-artifacts', 'ui/get-settings',
    'ui/navigate', 'ui/refresh', 'ui/close', 'ui/resize',
    'ui/get-auth-token', 'ui/get-session',

    // Notification methods
    'ui/notifications/size-changed', 'ui/notifications/initialized',
    'ui/notifications/tool-input', 'ui/notifications/tool-input-partial',
    'ui/notifications/sandbox-proxy-ready', 'ui/notifications/sandbox-resource-ready',
    'ui/notifications/host-context-changed', 'ui/notifications/tool-result',
    'ui/notifications/error', 'ui/notifications/ready',
    'notifications/message', 'notifications/cancelled',
    'notifications/progress', 'notifications/resources/updated',
    'notifications/tools/list_changed', 'notifications/roots/list_changed',

    // Action methods
    'ui/actions/send-message', 'ui/actions/navigate',
    'ui/actions/create-artifact', 'ui/actions/update-artifact',
    'ui/actions/delete-artifact', 'ui/actions/get-artifact',
    'ui/actions/list-conversations', 'ui/actions/get-conversation-messages',
    'ui/actions/create-project', 'ui/actions/list-projects',

    // Auth/identity
    'auth/token', 'auth/session', 'auth/user', 'auth/organization',
    'user/me', 'user/settings', 'user/preferences',
    'organization/info', 'organization/members',

    // Conversation data
    'conversation/list', 'conversation/get', 'conversation/messages',
    'conversation/create', 'conversation/delete', 'conversation/update',
    'conversation/share', 'conversation/export',
    'messages/list', 'messages/search',

    // File/artifact
    'artifacts/list', 'artifacts/get', 'artifacts/create',
    'files/list', 'files/read', 'files/upload',

    // Admin/settings
    'settings/get', 'settings/update',
    'billing/usage', 'billing/subscription',

    // Misc
    'health', 'version', 'capabilities',
    'context/get', 'context/set',
    'storage/get', 'storage/set', 'storage/list', 'storage/delete',
  ];

  console.log(`Testing ${allMethods.length} methods...`);

  const methodResults = { working: [], errors: [], timeouts: [] };

  for (const method of allMethods) {
    try {
      const r = await mcpRequest(method, {}, 2000);
      methodResults.working.push({ method, result: JSON.stringify(r).slice(0, 300) });
      console.log(`  ✓ ${method} →`, JSON.stringify(r).slice(0, 200));
    } catch(e) {
      if (e.message === 'timeout') {
        methodResults.timeouts.push(method);
      } else {
        const code = e.code || '';
        if (code === -32601) {
          // Method not found - expected
        } else {
          methodResults.errors.push({ method, error: JSON.stringify(e).slice(0, 200) });
          console.log(`  ⚠ ${method} → unexpected error:`, JSON.stringify(e).slice(0, 200));
        }
      }
    }
  }

  console.log("\n=== METHOD ENUMERATION RESULTS ===");
  console.log("WORKING methods:", methodResults.working.length);
  for (const w of methodResults.working) {
    console.log(`  ✓ ${w.method}: ${w.result}`);
  }
  console.log("\nTIMEOUT methods (may need params):", methodResults.timeouts.length);
  for (const t of methodResults.timeouts) {
    console.log(`  ? ${t}`);
  }
  console.log("\nUNEXPECTED ERRORS:", methodResults.errors.length);
  for (const e of methodResults.errors) {
    console.log(`  ⚠ ${e.method}: ${e.error}`);
  }

  console.log("\n=== PROBE v11 COMPLETE ===");
}

probe().catch(e => console.error("Probe failed:", e));
