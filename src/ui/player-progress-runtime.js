// Installed in the existing shell script; no router, timer, or event listener.
function hvEnsurePlayerProgress() {
  if (P.hvPlayerProgress?.version === 1) return true;
  return hvRunCommittedTransaction({ commandId: 'player.progress.migrate:v1', source: 'player.migration',
    mutate: player => { hvMigratePlayerProgress(player); return { ok: true }; } }).ok;
}
function hvPlayerGateMessage(gate) {
  return gate.code === 'PLAYER_LEVEL' ? 'Cần cấp ' + gate.requiredLevel + ' · Nhận rương AFK hoặc làm nhiệm vụ để thêm EXP.'
    : 'Vượt ải trước để mở khóa.';
}
function hvCheckCampaignEntry(idx) {
  if (!hvEnsurePlayerProgress()) { toast('Chưa lưu được cấp người chơi. Vui lòng thử lại.'); return false; }
  const stage = Math.min(17, Math.max(0, Math.floor(Number(P.campaignStages?.[idx]) || 0)));
  const gate = hvCampaignGate(P, idx, stage);
  if (!gate.ok) { navTo('campaign'); toast(hvPlayerGateMessage(gate)); return false; }
  return true;
}
function hvCampaignSettlementXp(player, payload) {
  if (ST.mode !== 'campaign' || !payload.win) return 0;
  const chapter = ST.chapterIdx, stage = ST.campaignBattleIndex;
  if (payload.battleId !== chapterBattleSequence(chapter)[stage]) return 0;
  return hvRecordCampaignXp(player, chapter, stage);
}
window.HonVietPlayerProgress = Object.freeze({ ensure: hvEnsurePlayerProgress, gate: hvCampaignGate,
  level: hvPlayerLevel, threshold: hvLevelXp, afkView: hvAfkXpView, grantAfk: hvGrantAfkXp });
