// Read models only. Opening a screen must not advance a stage or grant loot.
export function toggleCampaignHero(squad, heroId, ownedIds) {
  const draft = squad.map(pick => ({ ...pick }));
  if (!ownedIds.includes(heroId)) return draft;
  const index = draft.findIndex(pick => pick.id === heroId);
  if (index >= 0) { draft.splice(index, 1); return draft; }
  if (draft.length >= 6) return draft;
  const row = draft.filter(pick => pick.row === 'front').length < 3 ? 'front' : 'back';
  draft.push({ id: heroId, row });
  return draft;
}

export function swapCampaignPositions(squad, from, to) {
  if (![from, to].every(i => Number.isInteger(i) && i >= 0 && i < squad.length)) return squad.map(pick => ({ ...pick }));
  return replaceCampaignSlot(squad, to, squad[from].id, squad.map(pick => pick.id));
}

export function campaignCheckpoint(player, chapters, sequenceFor) {
  const unlocked = new Set(player?.unlockedChapters || []);
  const cleared = new Set(player?.clearedChapters || []);
  const available = chapters.filter(chapter => unlocked.has(chapter.idx));
  const chapter = available.find(candidate => !cleared.has(candidate.idx)) || available.at(-1);
  if (!chapter) return null;
  const sequence = sequenceFor(chapter.idx);
  if (!Array.isArray(sequence) || !sequence.length) return null;
  const replay = cleared.has(chapter.idx);
  const raw = Number(player?.campaignStages?.[chapter.idx]);
  const stageIndex = replay ? 0 : Math.max(0, Math.min(sequence.length - 1, Number.isFinite(raw) ? Math.floor(raw) : 0));
  return { chapterIndex: chapter.idx, title: chapter.title || chapter.name || 'Mộng lộ', stageIndex,
    stageCount: sequence.length, battleId: sequence[stageIndex], replay,
    key: chapter.idx + ':' + stageIndex + ':' + sequence[stageIndex] };
}

// A selected hero already on the field swaps places; row belongs to the slot.
// Return fresh records so Cancel can discard every change without a save.
export function replaceCampaignSlot(squad, index, heroId, ownedIds) {
  const draft = squad.map(pick => ({ ...pick }));
  if (!Number.isInteger(index) || index < 0 || index >= draft.length || !ownedIds.includes(heroId)) return draft;
  const existing = draft.findIndex(pick => pick.id === heroId);
  if (existing === index) return draft;
  const previous = draft[index].id;
  draft[index].id = heroId;
  if (existing >= 0) draft[existing].id = previous;
  return draft;
}

// Match the combat board's three front / three back positions. A row change
// exchanges the paired positions, so battle will not silently spill another hero.
export function swapCampaignRows(squad, index) {
  if (squad.length !== 6 || !Number.isInteger(index) || index < 0 || index > 5) return squad.map(pick => ({ ...pick }));
  const target = index < 3 ? index + 3 : index - 3;
  return replaceCampaignSlot(squad, target, squad[index].id, squad.map(pick => pick.id));
}
