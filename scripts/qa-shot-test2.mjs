import { cdp } from './qa-cdp.mjs';

const c = await cdp('battle.html');
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/battle.html', 4000);
const p1 = await c.shotSafe('docs/qa/BD-UI-FIX/test-fresh.png');
console.log('fresh shot:', p1);
c.close();
