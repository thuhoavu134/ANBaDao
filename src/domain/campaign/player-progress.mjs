// Additive account progression. Hero levels and spendable currencies are independent.
export const HV_PLAYER_MAX_LEVEL = 60;
export const HV_PLAYER_AFK_XP_HOUR = 240;
const hvProgressInt = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
export function hvStageLevel(chapter, stage) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 5 || !Number.isInteger(stage) || stage < 0 || stage > 17) return null;
  return 1 + 10 * chapter + Math.floor(9 * stage / 17);
}
export function hvLevelXp(level) {
  const steps = Math.min(59, Math.max(0, hvProgressInt(level) - 1));
  return steps * 100 + 10 * steps * (steps - 1);
}
export function hvPlayerLevel(xp) {
  let level = 1;
  while (level < HV_PLAYER_MAX_LEVEL && hvProgressInt(xp) >= hvLevelXp(level + 1)) level++;
  return level;
}
export function hvMigratePlayerProgress(player) {
  if (player.hvPlayerProgress?.version === 1) return false;
  const clears = [], cleared = new Set(player.clearedChapters || []);
  let level = 1;
  for (let c = 0; c < 6; c++) {
    const count = cleared.has(c) ? 18 : Math.min(17, hvProgressInt(player.campaignStages?.[c]));
    for (let s = 0; s < count; s++) clears.push(c + ':' + s);
    if (cleared.has(c) || (player.unlockedChapters || []).includes(c)) level = Math.max(level, hvStageLevel(c, cleared.has(c) ? 17 : count));
  }
  player.hvPlayerProgressLegacy = {
    campaignStages: { ...player.campaignStages },
    clearedChapters: [...(player.clearedChapters || [])], unlockedChapters: [...(player.unlockedChapters || [])]
  };
  player.hvPlayerProgress = { version: 1, xp: hvLevelXp(level), clears, afkRemainder: 0 };
  return true;
}
export function hvAddPlayerXp(player, amount) {
  hvMigratePlayerProgress(player);
  const p = player.hvPlayerProgress, old = Math.min(hvLevelXp(60), hvProgressInt(p.xp));
  p.xp = Math.min(hvLevelXp(60), old + hvProgressInt(amount));
  return p.xp - old;
}
export function hvRecordCampaignXp(player, chapter, stage) {
  if (hvStageLevel(chapter, stage) === null) return 0;
  hvMigratePlayerProgress(player);
  const key = chapter + ':' + stage, p = player.hvPlayerProgress;
  if (p.clears.includes(key)) return 0;
  p.clears.push(key);
  return hvAddPlayerXp(player, 80 + chapter * 20 + stage * 8);
}
export function hvAfkXpView(player, seconds) {
  const units = Math.min(54000, hvProgressInt(seconds)) * HV_PLAYER_AFK_XP_HOUR + hvProgressInt(player.hvPlayerProgress?.afkRemainder) % 3600;
  return { xp: Math.floor(units / 3600), remainder: units % 3600 };
}
export function hvGrantAfkXp(player, seconds) {
  hvMigratePlayerProgress(player);
  const view = hvAfkXpView(player, seconds);
  player.hvPlayerProgress.afkRemainder = view.remainder;
  return hvAddPlayerXp(player, view.xp);
}
export function hvQuestXp(source) { return source === 'daily.quest' ? 80 : source === 'daily.weekly' ? 240 : 0; }
export function hvCampaignGate(player, chapter, stage) {
  const requiredLevel = hvStageLevel(chapter, stage), level = hvPlayerLevel(player.hvPlayerProgress?.xp);
  const result = code => ({ ok: code === 'OPEN', code, requiredLevel, level });
  if (requiredLevel === null) return result('INVALID_STAGE');
  const clears = player.hvPlayerProgress?.clears || [];
  if ((player.clearedChapters || []).includes(chapter) || clears.includes(chapter + ':' + stage)) return result('OPEN');
  if (!(player.unlockedChapters || []).includes(chapter) || (chapter > 0 && !(player.clearedChapters || []).includes(chapter - 1))) return result('PREVIOUS_CHAPTER');
  const cursor = hvProgressInt(player.campaignStages?.[chapter]);
  if (stage > 0 && !clears.includes(chapter + ':' + (stage - 1)) && cursor < stage) return result('PREVIOUS_STAGE');
  return result(level < requiredLevel ? 'PLAYER_LEVEL' : 'OPEN');
}
