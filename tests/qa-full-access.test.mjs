import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

test('QA full access bypasses campaign progression gates without changing the normal-route gate owner', () => {
  assert.match(index, /const baseCampaignGate=typeof hvCampaignGate==='function'\?hvCampaignGate:null/);
  assert.match(index, /hvCampaignGate=function qaCampaignGate/);
  assert.match(index, /if\(!active\|\|!baseCampaignGate\)return baseCampaignGate\?baseCampaignGate\.apply\(this,arguments\):\{ok:false,code:'QA_GATE_UNAVAILABLE'/);
  assert.match(index, /return \{\.\.base,ok:true,code:'OPEN',qaBypass:true\}/);
  assert.match(index, /sandbox không lưu/);
});

test('QA full access is present but opt-in', () => {
  assert.match(index, /id="hv-qa-full-access-v1"/);
  assert.match(index, /qa=unlock-all/);
  assert.match(index, /qaSafePersist/);
  assert.match(index, /data-testid="qa-full-access-panel"/);
  assert.match(index, /P\.unlockedChapters=allChapters/);
});
