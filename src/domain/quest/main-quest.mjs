export const MAIN_QUEST_SCHEMA = 'hon-viet-main-quest/v1';

function integer(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => String(item)).filter(Boolean))];
}

export function mainQuestId(chapterIndex, stageIndex) {
  return `main:${Math.max(0, integer(chapterIndex))}:${Math.max(0, integer(stageIndex))}`;
}

export function createMainQuestState(options = {}) {
  return {
    schema: MAIN_QUEST_SCHEMA,
    chapterIndex: Math.max(0, integer(options.chapterIndex, 0)),
    stageIndex: Math.max(0, integer(options.stageIndex, 0)),
    progress: clamp(integer(options.progress, 0), 0, 1),
    allComplete: options.allComplete === true,
    campaignCycle: Math.max(1, integer(options.campaignCycle, 1)),
    claimed: uniqueStrings(options.claimed),
    history: Array.isArray(options.history) ? options.history.slice(-20) : []
  };
}

export function normalizeMainQuestState(input = {}, options = {}) {
  const chapterCount = Math.max(0, integer(options.chapterCount, 0));
  const state = createMainQuestState(input);
  if (chapterCount > 0) {
    state.chapterIndex = clamp(state.chapterIndex, 0, chapterCount - 1);
    const stageCount = typeof options.stageCount === 'function'
      ? Math.max(1, integer(options.stageCount(state.chapterIndex), 1))
      : Math.max(1, integer(options.stageCount, 1));
    state.stageIndex = clamp(state.stageIndex, 0, stageCount - 1);
  } else {
    state.chapterIndex = 0;
    state.stageIndex = 0;
    state.progress = 0;
  }
  return state;
}

/**
 * Bootstrap a quest cursor for a save created before the main-quest module.
 * The campaign cursor is authoritative, so returning players never restart
 * at ải 1 merely because this module is new.
 */
export function bootstrapMainQuestState(options = {}) {
  const chapters = Array.isArray(options.chapters) ? options.chapters : [];
  const unlocked = new Set((Array.isArray(options.unlockedChapters) ? options.unlockedChapters : []).map((value) => integer(value)));
  const cleared = new Set((Array.isArray(options.clearedChapters) ? options.clearedChapters : []).map((value) => integer(value)));
  const campaignStages = options.campaignStages && typeof options.campaignStages === 'object' ? options.campaignStages : {};
  const open = chapters.find((chapter) => {
    const index = integer(chapter?.idx, -1);
    return index >= 0 && unlocked.has(index) && !cleared.has(index);
  });
  if (open) {
    const chapterIndex = integer(open.idx, 0);
    return createMainQuestState({
      chapterIndex,
      stageIndex: Math.max(0, integer(campaignStages[chapterIndex], 0)),
      campaignCycle: Math.max(1, integer(options.campaignCycle, 1))
    });
  }
  if (chapters.length) {
    return createMainQuestState({
      chapterIndex: Math.max(0, integer(chapters[chapters.length - 1]?.idx, chapters.length - 1)),
      allComplete: true,
      campaignCycle: Math.max(1, integer(options.campaignCycle, 1))
    });
  }
  return createMainQuestState();
}

export function getCurrentMainQuest(state, options = {}) {
  const normalized = normalizeMainQuestState(state, options);
  const chapterIndex = normalized.chapterIndex;
  const stageIndex = normalized.stageIndex;
  const id = mainQuestId(chapterIndex, stageIndex);
  const claimed = normalized.claimed.includes(id);
  return {
    id,
    chapterIndex,
    stageIndex,
    chapterNumber: chapterIndex + 1,
    stageNumber: stageIndex + 1,
    battleId: options.battleId == null ? null : String(options.battleId),
    title: options.title == null ? `Chương ${chapterIndex + 1}` : String(options.title),
    objective: options.objective == null ? `Vượt ải ${chapterIndex + 1}-${stageIndex + 1}` : String(options.objective),
    goal: 1,
    progress: normalized.progress,
    ready: normalized.progress >= 1 && !claimed,
    claimed,
    complete: normalized.allComplete
  };
}

export function recordMainQuestBattle(state, quest, result = {}) {
  const next = createMainQuestState(state);
  const expectedId = quest?.id == null ? '' : String(quest.id);
  const expectedBattle = quest?.battleId == null ? '' : String(quest.battleId);
  const actualBattle = result?.battleId == null ? '' : String(result.battleId);
  if (!result?.win || !expectedId || (expectedBattle && expectedBattle !== actualBattle) || next.claimed.includes(expectedId)) {
    return { state: next, changed: false, reason: 'not-applicable' };
  }
  if (next.progress >= 1) return { state: next, changed: false, reason: 'already-complete' };
  next.progress = 1;
  next.history.push({ id: expectedId, battleId: actualBattle || expectedBattle || null, at: result.at ?? null });
  next.history = next.history.slice(-20);
  return { state: next, changed: true, completedId: expectedId };
}

export function claimMainQuest(state, quest, options = {}) {
  const next = createMainQuestState(state);
  const id = quest?.id == null ? '' : String(quest.id);
  if (!id || next.claimed.includes(id) || next.progress < 1) {
    return { state: next, changed: false, reason: 'not-ready', reward: null };
  }
  next.claimed.push(id);
  const stageCount = Math.max(1, integer(options.stageCount, (quest?.stageCount || 1)));
  const chapterCount = Math.max(1, integer(options.chapterCount, next.chapterIndex + 1));
  const atChapterEnd = next.stageIndex + 1 >= stageCount;
  const finalChapter = atChapterEnd && options.hasNextChapter === false;
  if (atChapterEnd) {
    if (finalChapter) {
      next.allComplete = true;
    } else {
      next.chapterIndex = Math.min(chapterCount - 1, next.chapterIndex + 1);
      next.stageIndex = 0;
    }
  } else {
    next.stageIndex += 1;
  }
  next.progress = 0;
  return {
    state: next,
    changed: true,
    claimedId: id,
    reward: options.reward || null,
    chapterComplete: atChapterEnd,
    allComplete: finalChapter
  };
}
