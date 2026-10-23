// Raw CDP helper over Node's built-in WebSocket (no playwright needed).
// Usage: import { cdp } from './qa-cdp.mjs'; const c = await cdp('battle.html');
import { writeFileSync } from 'node:fs';

const DEBUG = 'http://127.0.0.1:9333';

export async function targets() {
  const r = await fetch(DEBUG + '/json/list');
  return r.json();
}

export async function cdp(match, { createIfMissing = null } = {}) {
  let list = await targets();
  let t = list.find(x => x.type === 'page' && x.url.includes(match));
  if (!t && createIfMissing) {
    await fetch(DEBUG + '/json/new?' + encodeURIComponent(createIfMissing), { method: 'PUT' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1200));
    list = await targets();
    t = list.find(x => x.type === 'page' && x.url.includes(match));
  }
  if (!t) throw new Error('no target matching ' + match);
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = e => rej(new Error('ws error')); });
  let id = 0;
  const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}, timeoutMs = 30000) => new Promise((res, rej) => {
    const myId = ++id;
    const timer = setTimeout(() => { pending.delete(myId); rej(new Error('timeout ' + method)); }, timeoutMs);
    pending.set(myId, m => { clearTimeout(timer); m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  return {
    target: t,
    send,
    close: () => ws.close(),
    async eval(expr, { awaitPromise = true, timeoutMs = 30000 } = {}) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true, allowUnsafeEvalBlockedByCSP: true }, timeoutMs);
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result?.value;
    },
    async goto(url, waitMs = 2500) {
      await send('Page.enable');
      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, waitMs));
    },
    async resize(width, height) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    },
    async shot(path, { timeoutMs = 25000 } = {}) {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, timeoutMs);
      writeFileSync(path, Buffer.from(r.data, 'base64'));
      return path;
    },
    async shotSafe(path) {
      for (let i = 0; i < 3; i++) {
        try { return await this.shot(path); } catch (e) { await new Promise(r => setTimeout(r, 700)); }
      }
      return null;
    },
  };
}
