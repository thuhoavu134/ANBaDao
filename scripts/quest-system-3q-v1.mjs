import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAIN_QUEST_SCHEMA,
  bootstrapMainQuestState,
  claimMainQuest,
  createMainQuestState,
  getCurrentMainQuest,
  recordMainQuestBattle
} from '../src/domain/quest/main-quest.mjs';

const root = process.cwd();
const indexPath = join(root, 'dist', 'index.html');

function assertQuestContract() {
  const bootstrap = bootstrapMainQuestState({
    chapters: [{ idx: 0 }, { idx: 1 }],
    unlockedChapters: [0, 1],
    clearedChapters: [0],
    campaignStages: { 1: 1 }
  });
  const quest = getCurrentMainQuest(bootstrap, {
    chapterCount: 2,
    stageCount: 2,
    battleId: 'build-quest-battle',
    title: 'Mộng Phố'
  });
  const completed = recordMainQuestBattle(bootstrap, quest, {
    win: true,
    battleId: quest.battleId,
    at: 1
  });
  const claimed = claimMainQuest(completed.state, quest, {
    chapterCount: 2,
    stageCount: 2,
    hasNextChapter: true,
    reward: { gold: 120 }
  });
  if (MAIN_QUEST_SCHEMA !== 'hon-viet-main-quest/v1') throw new Error('main quest schema drift');
  if (!completed.changed || !claimed.changed || claimed.state.stageIndex !== 0 || claimed.state.chapterIndex !== 1) {
    throw new Error('main quest progression contract drift');
  }
}

assertQuestContract();

function browserQuestModuleSource() {
  return readFileSync(join(root, 'src', 'domain', 'quest', 'main-quest.mjs'), 'utf8')
    .replace(/^export\s+/gm, '');
}

function runtimeSource() {
  const moduleSource = browserQuestModuleSource();
  return String.raw`/* hv-main-quest-v1-runtime */
(()=> {
  const __hvMainQuestModule = (()=> {
${moduleSource}
    return { MAIN_QUEST_SCHEMA, mainQuestId, createMainQuestState, normalizeMainQuestState, bootstrapMainQuestState, getCurrentMainQuest, recordMainQuestBattle, claimMainQuest };
  })();
  window.__HV_MAIN_QUEST_MODULE_V1 = __hvMainQuestModule;

  const chapterCount = () => Array.isArray(DATA?.chapters) ? DATA.chapters.length : 0;
  const sequenceFor = (chapterIndex) => {
    try {
      const seq = typeof chapterBattleSequence === 'function' ? chapterBattleSequence(chapterIndex) : [];
      return Array.isArray(seq) && seq.length ? seq : [''];
    } catch (_) {
      return [''];
    }
  };
  const ensure = () => {
    const hasState = !!((P.hvMainQuest && typeof P.hvMainQuest === 'object') || (P.mainQuest && typeof P.mainQuest === 'object'));
    let existing = (P.hvMainQuest && typeof P.hvMainQuest === 'object') ? P.hvMainQuest
      : ((P.mainQuest && typeof P.mainQuest === 'object') ? P.mainQuest : null);
    /* Do not reset a returning player to ải 1: bootstrap from the campaign
       cursor already stored in the save. */
    if (!hasState) {
      existing = __hvMainQuestModule.bootstrapMainQuestState({
        chapters: DATA?.chapters,
        unlockedChapters: P.unlockedChapters,
        clearedChapters: P.clearedChapters,
        campaignStages: P.campaignStages
      });
    }
    const normalized = __hvMainQuestModule.normalizeMainQuestState(existing, {
      chapterCount: chapterCount(),
      stageCount: (idx) => sequenceFor(idx).length
    });
    P.hvMainQuest = normalized;
    return normalized;
  };
  const current = () => {
    const state = ensure();
    if (state.allComplete) {
      return __hvMainQuestModule.getCurrentMainQuest(state, {
        chapterCount: chapterCount(),
        stageCount: 1,
        battleId: null,
        title: 'Biên Niên Hồn Việt',
        objective: 'Đã hoàn thành tuyến nhiệm vụ'
      });
    }
    const sequence = sequenceFor(state.chapterIndex);
    const chapter = DATA.chapters?.[state.chapterIndex] || {};
    return __hvMainQuestModule.getCurrentMainQuest(state, {
      chapterCount: chapterCount(),
      stageCount: sequence.length,
      battleId: sequence[state.stageIndex] || null,
      title: chapter.name || ('Chương ' + (state.chapterIndex + 1)),
      objective: 'Vượt ải ' + (state.chapterIndex + 1) + '-' + (state.stageIndex + 1)
    });
  };
  const rewardFor = (quest) => ({
    gold: 120 + (quest.chapterIndex * 30) + (quest.stageIndex * 15),
    gems: quest.stageNumber % 3 === 0 ? 5 : 0
  });
  const rewardItems = (reward) => Object.entries(reward)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => ({ icon: key === 'gold' ? '🪙' : '💎', label: key === 'gold' ? 'Vàng' : 'Ngọc', value }));
  const persistQuest = () => {
    if (typeof persist === 'function') persist();
    if (typeof refreshResbar === 'function') refreshResbar();
  };
  const showQuestReward = (quest, reward) => {
    const desc = 'Đã vượt ' + (quest.objective || ('ải ' + quest.stageNumber)) + ' · tuyến nhiệm vụ tự mở ải kế tiếp.';
    if (typeof showRewardCeremony === 'function') showRewardCeremony('NHIỆM VỤ CHÍNH TUYẾN', desc, rewardItems(reward), '📜', 'Phần thưởng nhiệm vụ');
    else if (typeof toast === 'function') toast('📜 Hoàn thành ' + (quest.objective || 'nhiệm vụ chính tuyến'));
  };
  const claimReady = () => {
    const state = ensure();
    const quest = current();
    if (!quest.ready) return false;
    const sequence = sequenceFor(state.chapterIndex);
    const out = __hvMainQuestModule.claimMainQuest(state, quest, {
      chapterCount: chapterCount(),
      stageCount: sequence.length,
      hasNextChapter: state.chapterIndex + 1 < chapterCount(),
      reward: rewardFor(quest)
    });
    if (!out.changed) return false;
    P.hvMainQuest = out.state;
    applyReward(out.reward || {});
    persistQuest();
    showQuestReward(quest, out.reward || {});
    renderQuestSurfaces();
    return true;
  };
  const onBattleResult = (payload = {}) => {
    if (!payload?.win) return false;
    const state = ensure();
    const quest = current();
    if (!quest.battleId) return false;
    const out = __hvMainQuestModule.recordMainQuestBattle(state, quest, {
      win: true,
      battleId: payload.battleId,
      at: Date.now()
    });
    if (!out.changed) {
      persistQuest();
      return false;
    }
    const sequence = sequenceFor(state.chapterIndex);
    const claimed = __hvMainQuestModule.claimMainQuest(out.state, quest, {
      chapterCount: chapterCount(),
      stageCount: sequence.length,
      hasNextChapter: state.chapterIndex + 1 < chapterCount(),
      reward: rewardFor(quest)
    });
    if (!claimed.changed) {
      P.hvMainQuest = out.state;
      persistQuest();
      return true;
    }
    P.hvMainQuest = claimed.state;
    const reward = claimed.reward || rewardFor(quest);
    applyReward(reward);
    persistQuest();
    if (typeof showProgressBurst === 'function') showProgressBurst('Nhiệm vụ hoàn thành', quest.objective + ' · tự mở nhiệm vụ kế tiếp');
    else if (typeof toast === 'function') toast('📜 Hoàn thành ' + quest.objective);
    renderQuestSurfaces();
    return true;
  };
  const go = () => {
    const quest = current();
    if (quest.complete) {
      navTo('daily');
      return;
    }
    if (quest.ready && claimReady()) return;
    const state = ensure();
    if (typeof startChapter === 'function') startChapter(state.chapterIndex, { fromMainQuest: true });
    else navTo('campaign');
  };
  const panelHtml = () => {
    const quest = current();
    if (quest.complete) return '<div class="hv-main-quest-complete"><b>🌅 Đã hoàn thành tuyến nhiệm vụ</b><small>Biên Niên hiện tại đã đi hết.</small></div>';
    const state = ensure();
    const total = sequenceFor(state.chapterIndex).length;
    const label = quest.ready ? 'NHẬN THƯỞNG' : 'ĐẾN NGAY';
    return '<div class="hv-main-quest-kicker">NHIỆM VỤ CHÍNH TUYẾN</div>'
      + '<div class="hv-main-quest-title">Chương ' + quest.chapterNumber + ' · ' + esc(quest.title) + '</div>'
      + '<div class="hv-main-quest-objective">' + esc(quest.objective) + ' · (' + quest.progress + '/1)</div>'
      + '<div class="hv-main-quest-progress"><i style="width:' + Math.round(quest.progress * 100) + '%"></i></div>'
      + '<div class="hv-main-quest-meta">Ải ' + quest.stageNumber + '/' + Math.max(1, total) + ' · 6v6 tự động · -' + (DATA.daily?.costCampaign || 6) + '⚡</div>'
      + '<button type="button" class="btn gold sm hv-main-quest-cta" data-hv-main-quest-cta="1">' + label + '</button>';
  };
  const bindCta = (rootEl) => {
    rootEl?.querySelectorAll?.('[data-hv-main-quest-cta]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        go();
      });
    });
  };
  const renderHubPanel = (rootEl) => {
    if (!rootEl) return;
    rootEl.querySelector('#hv-main-quest-hub')?.remove();
    const card = document.createElement('section');
    card.id = 'hv-main-quest-hub';
    card.className = 'hv-main-quest-hub';
    card.setAttribute('data-testid', 'main-quest-hub');
    card.innerHTML = panelHtml();
    rootEl.querySelector('.art-hub')?.appendChild(card);
    bindCta(card);
  };
  const renderDailyPanel = (rootEl) => {
    if (!rootEl) return;
    rootEl.querySelector('#hv-main-quest-daily')?.remove();
    const section = document.createElement('section');
    section.id = 'hv-main-quest-daily';
    section.className = 'section hv-main-quest-daily';
    section.setAttribute('data-testid', 'main-quest-daily');
    section.innerHTML = panelHtml() + '<small class="hv-main-quest-hint">Tuyến nhiệm vụ nối thẳng bản đồ ải; thưởng nhận ngay sau mỗi trận thắng.</small>';
    rootEl.prepend(section);
    bindCta(section);
  };
  const renderQuestSurfaces = () => {
    if (ST?.screen === 'hub') {
      const stage = document.getElementById('mainStage');
      if (stage) renderHubPanel(stage);
    }
    if (ST?.screen === 'daily') {
      const body = document.getElementById('dailyBody');
      if (body) renderDailyPanel(body);
    }
  };
  window.__HV_MAIN_QUEST_RUNTIME_V1 = Object.freeze({
    schema: __hvMainQuestModule.MAIN_QUEST_SCHEMA,
    ensure,
    current,
    onBattleResult,
    claimReady,
    go,
    renderHubPanel,
    renderDailyPanel,
    renderQuestSurfaces
  });
  ensure();
  persistQuest();
  renderQuestSurfaces();
})();`;
}

const style = `<style id="hv-main-quest-v1-style">
.hv-main-quest-hub{position:absolute;left:clamp(10px,3.4vw,42px);bottom:clamp(88px,15vh,142px);z-index:35;width:min(310px,calc(100% - 20px));padding:13px 14px 12px;border:1px solid rgba(220,178,81,.78);border-radius:15px;background:linear-gradient(145deg,rgba(25,18,29,.96),rgba(13,28,31,.94));box-shadow:0 10px 28px rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,239,170,.08);color:#f4e7c2;backdrop-filter:blur(5px)}
.hv-main-quest-kicker{font-size:10px;letter-spacing:.12em;font-weight:900;color:#f2c75c}.hv-main-quest-title{margin-top:3px;font-size:15px;font-weight:900;color:#fff0bf}.hv-main-quest-objective{margin-top:3px;font-size:12px;color:#e3d1ae}.hv-main-quest-progress{height:5px;margin:9px 0 6px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden}.hv-main-quest-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#d49b38,#f4df88)}.hv-main-quest-meta{font-size:10px;color:#aab7b0}.hv-main-quest-cta{margin-top:9px;min-width:98px;font-size:11px;letter-spacing:.04em}.hv-main-quest-complete b{display:block;font-size:14px;color:#ffe59a}.hv-main-quest-complete small{display:block;margin-top:3px;color:#b3c0b9;font-size:11px}.hv-main-quest-daily{border-color:rgba(218,177,80,.7)!important;background:linear-gradient(145deg,rgba(28,21,32,.96),rgba(12,31,33,.94))!important}.hv-main-quest-daily .hv-main-quest-meta{font-size:11px}.hv-main-quest-hint{display:block;margin-top:8px;color:#9eb1aa;font-size:11px;line-height:1.45}.hv-main-quest-daily .hv-main-quest-cta{min-height:40px;padding-inline:18px}
@media(max-width:640px){.hv-main-quest-hub{left:10px;right:10px;bottom:87px;width:auto;padding:10px 12px}.hv-main-quest-hub .hv-main-quest-meta{font-size:9px}.hv-main-quest-hub .hv-main-quest-cta{margin-top:6px}.hv-main-quest-daily{margin-inline:8px!important}}
</style>`;

function patchIndex() {
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('/* hv-main-quest-v1-runtime */')) {
    const mainClose = html.indexOf('</script>');
    if (mainClose < 0) throw new Error('main quest runtime missing primary script anchor');
    html = html.slice(0, mainClose) + runtimeSource() + '\n' + html.slice(mainClose);
  }
  if (!html.includes('id="hv-main-quest-v1-style"')) {
    if (!html.includes('</head>')) throw new Error('main quest style missing head anchor');
    html = html.replace('</head>', style + '\n</head>');
  }
  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);')) {
    const battleHook = /(if\s*\(!payload\.win\)\s*return;)/;
    if (!battleHook.test(html)) throw new Error('main quest battle hook anchor missing');
    html = html.replace(battleHook, '$1\n    window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);');
  }
  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.renderDailyPanel?.(b);')) {
    const dailyAnchor = /(const\s+ql\s*=\s*document\.getElementById\(['"]questList['"]\);)/;
    if (!dailyAnchor.test(html)) throw new Error('main quest daily render anchor missing');
    html = html.replace(dailyAnchor, '  window.__HV_MAIN_QUEST_RUNTIME_V1?.renderDailyPanel?.(b);\n  $1');
  }
  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.renderHubPanel?.(st);')) {
    const hubAnchor = /(st\.querySelectorAll\(\s*['"]\[data-art-go\]['"]\s*\)\.forEach\(b\s*=>\s*\{)/;
    if (!hubAnchor.test(html)) throw new Error('main quest hub render anchor missing');
    html = html.replace(hubAnchor, '  window.__HV_MAIN_QUEST_RUNTIME_V1?.renderHubPanel?.(st);\n  $1');
  }
  if (!html.includes('/* hv-main-quest-v1-runtime */') || !html.includes("setAttribute('data-testid', 'main-quest-hub')")) {
    throw new Error('main quest runtime injection failed');
  }
  writeFileSync(indexPath, html);
  console.log('3Q-style main quest v1 wired: sequential ải → auto-battle → reward → next quest');
}

patchIndex();
