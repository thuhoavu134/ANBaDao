// QA runner: drives a private headless Chrome over CDP (independent of the AICoworker browser tab).
// Usage: node scripts/qa-run.mjs <flowFile.mjs>
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9555;  // alt port: another agent runs the pipeline on 9444

export async function launch({ width = 390, height = 844 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore', detached: false });

  const base = `http://127.0.0.1:${PORT}`;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(base + '/json/version'); if (r.ok) break; } catch {}
    await new Promise(r => setTimeout(r, 350));
  }

  const list = await (await fetch(base + '/json/list')).json();
  const page = list.find(t => t.type === 'page');
  return {
    base, proc, profile,
    targetId: page.id,
    async newTab(url = 'about:blank') {
      const r = await fetch(base + '/json/new?' + encodeURIComponent(url), { method: 'PUT' });
      return r.json();
    },
    async kill() {
      try { proc.kill('SIGKILL'); } catch {}
      await new Promise(r => setTimeout(r, 600));
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

/** Thin CDP client bound to one target's ws url. */
export async function attach(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws fail')); });
  let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}, timeoutMs = 30000) => new Promise((res, rej) => {
    const myId = ++id;
    const timer = setTimeout(() => { pending.delete(myId); rej(new Error('timeout ' + method)); }, timeoutMs);
    pending.set(myId, m => { clearTimeout(timer); m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  return {
    send, close: () => ws.close(),
    async eval(expr, { awaitPromise = true, timeoutMs = 40000 } = {}) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true, userGesture: true }, timeoutMs);
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result?.value;
    },
    async goto(url, waitMs = 3000) { await send('Page.enable'); await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, waitMs)); },
    async resize(width, height, mobile = false) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
    },
    async shot(bufPath, opts = {}) {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, ...opts }, 30000);
      const { writeFileSync } = await import('node:fs');
      writeFileSync(bufPath, Buffer.from(r.data, 'base64'));
      return bufPath;
    },
  };
}
