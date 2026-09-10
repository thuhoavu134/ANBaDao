// Read models only. Opening a screen must not advance a stage or grant loot.
export const CAMPAIGN_BOARD_SIZE = 6;
export function campaignSlotRow(slot) {
  return slot < 3 ? 'front' : 'back';
}

function clonePick(pick, slot) {
  return { id: pick.id, row: campaignSlotRow(slot), slot };
}

function uniqueSlotMap(squad) {
  const used = new Set();
  const mapped = [];
  for (const pick of squad) {
    const slot = Number(pick?.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= CAMPAIGN_BOARD_SIZE || used.has(slot) || typeof pick?.id !== 'string') {
      return null;
    }
    used.add(slot);
    mapped.push({ pick, slot });
  }
  return mapped;
}

export function expandCampaignBoard(squad) {
  const board = Array(CAMPAIGN_BOARD_SIZE).fill(null);
  const list = Array.isArray(squad) ? squad.filter(pick => pick && typeof pick.id === 'string') : [];
  const unique = uniqueSlotMap(list);
  if (unique) {
    for (const { pick, slot } of unique) board[slot] = clonePick(pick, slot);
    return board;
  }
  const spill = [];
  const front = list.filter(pick => pick.row === 'front');
  const back = list.filter(pick => pick.row !== 'front');
  front.forEach((pick, i) => { if (i < 3) board[i] = clonePick(pick, i); else spill.push(pick); });
  back.forEach((pick, i) => { if (i < 3) board[i + 3] = clonePick(pick, i + 3); else spill.push(pick); });
  spill.forEach(pick => {
    const slot = board.findIndex(cell => !cell);
    if (slot >= 0) board[slot] = clonePick(pick, slot);
  });
  return board;
}

export function compactCampaignBoard(board) {
  return (Array.isArray(board) ? board : []).flatMap((pick, slot) => pick ? [clonePick(pick, slot)] : []);
}

export function toggleCampaignHero(squad, heroId, ownedIds) {
  const board = expandCampaignBoard(squad);
  if (!ownedIds.includes(heroId)) return compactCampaignBoard(board);
  const index = board.findIndex(pick => pick?.id === heroId);
  if (index >= 0) {
    board[index] = null;
    return compactCampaignBoard(board);
  }
  if (board.every(Boolean)) return compactCampaignBoard(board);
  const slot = board.findIndex(pick => !pick);
  board[slot] = clonePick({ id: heroId }, slot);
  return compactCampaignBoard(board);
}

export function swapCampaignPositions(squad, from, to) {
  const board = expandCampaignBoard(squad);
  if (![from, to].every(i => Number.isInteger(i) && i >= 0 && i < CAMPAIGN_BOARD_SIZE)) {
    return compactCampaignBoard(board);
  }
  const source = board[from];
  const target = board[to];
  board[from] = target ? clonePick(target, from) : null;
  board[to] = source ? clonePick(source, to) : null;
  return compactCampaignBoard(board);
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
  const board = expandCampaignBoard(squad);
  if (!Number.isInteger(index) || index < 0 || index >= CAMPAIGN_BOARD_SIZE || !ownedIds.includes(heroId)) {
    return compactCampaignBoard(board);
  }
  const existing = board.findIndex(pick => pick?.id === heroId);
  if (existing === index) return compactCampaignBoard(board);
  const previous = board[index];
  board[index] = clonePick({ id: heroId }, index);
  if (existing >= 0) board[existing] = previous ? clonePick(previous, existing) : null;
  return compactCampaignBoard(board);
}

// Match the combat board's three front / three back positions. A row change
// exchanges the paired positions, so battle will not silently spill another hero.
export function swapCampaignRows(squad, index) {
  if (!Number.isInteger(index) || index < 0 || index > 5) return compactCampaignBoard(expandCampaignBoard(squad));
  const target = index < 3 ? index + 3 : index - 3;
  return swapCampaignPositions(squad, index, target);
}
