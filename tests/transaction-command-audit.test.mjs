import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

import {
  L03A_COMMAND_INVENTORY,
  auditCommandInventory
} from '../src/domain/transaction/command-audit.mjs';

const source = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

test('L03a source audit verifies the mutation inventory and opening sequence', () => {
  const report = auditCommandInventory({ source });

  assert.equal(report.ok, true, JSON.stringify(report.errors, null, 2));
  assert.equal(report.summary.auditedCommandCount, L03A_COMMAND_INVENTORY.length);
  assert.equal(
    report.summary.verifiedCommandCount,
    L03A_COMMAND_INVENTORY.length
  );
  assert.equal(report.opening.orderValid, true);
  assert.equal(report.opening.questProgressPersistsInternally, true);
  assert.equal(report.opening.weeklyProgressPersistsInternally, true);
  assert.equal(report.opening.transactionBoundaryPresent, false);
  assert.equal(report.opening.atomicity, 'not-atomic');
  assert.equal(report.transactionRuntimeWired, false);
});

test('L03a records receipt absence instead of treating direct persist as atomic', () => {
  const report = auditCommandInventory({ source });
  const levelUp = report.inventory.find(entry => entry.id === 'hero.level-up');
  const questProgress = report.inventory.find(entry => entry.id === 'quest.progress');
  const chapterClear = report.inventory.find(entry => entry.id === 'chapter.clear');

  assert.equal(levelUp.receipt, 'none');
  assert.equal(levelUp.transaction, 'none');
  assert.equal(levelUp.atomicity, 'not-atomic');
  assert.equal(questProgress.receipt, 'none');
  assert.equal(chapterClear.receipt, 'none');
  assert.ok(report.summary.candidateMutationFunctionCount > 0);
  assert.equal(
    /\b(?:executeLocalTransaction|settleRewardTransaction|HonVietTransaction)\b/.test(source),
    false
  );
});

test('L03a audit source hash is stable for the captured active runtime', () => {
  const hash = crypto.createHash('sha256').update(source).digest('hex');
  // Re-pinned 2026-10-25 (b): six more hero-screen lines (Bạch Y Vân Phong, Bé An, Hồng Thương, Ông Phở,
  // Tích Đạo, Tiểu Linh). Previous pin: ten more hero-screen lines wired in HERO_VOICE_LINES (Bạch Diện, Đinh Lôi, Kỳ Vân,
  // Lăng Chân, Lăng Nguyệt, Lăng Tiêu, Lăng Vân, Thầy Mo, Tiêu Phong, Tịnh Mặc), cleaned by clean-voice.py.
  // No save / economy code changed; the L03a mutation inventory assertions above pass.
  assert.equal(hash, '0984e092b67f44cdeacc11f3183b5b080df5de08fd2e307f5c8a651a662e015b');
});
